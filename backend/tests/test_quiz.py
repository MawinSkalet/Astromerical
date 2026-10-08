import time
from concurrent.futures import ThreadPoolExecutor
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import select,func
from app.main import app
from app.db import transaction
from app.models import QuizSession,SessionQuestion,QuizAnswer,TeamScore,QuizRoom
from app.quiz import submit_answer,AnswerInput,advance,PREVIEW_SECONDS,QUESTION_SECONDS,REVEAL_SECONDS
from app.content import public_question
from app.quiz_questions import live_quiz_questions
from conftest import guest

ORIGIN={'origin':'http://localhost:5173'}

def host_room(client):
    host=guest(client,'Host')
    return host,client.post('/api/quiz/rooms').json()['code']

def add_player(code,name='Player'):
    client=TestClient(app)
    user=guest(client,name)
    assert client.post(f'/api/quiz/rooms/{code}/join').status_code==200
    client.put(f'/api/quiz/rooms/{code}/ready',json={'ready':True})
    return client,user

def open_question(state):
    with transaction() as db:
        session=db.get(QuizSession,state['session_id'])
        session.phase='question'; session.starts_at=time.time()-1; session.ends_at=session.starts_at+QUESTION_SECONDS
        question=db.get(SessionQuestion,state['question_id'])
        return question,session.starts_at,session.ends_at

def finish(code):
    with transaction() as db:
        room=db.scalar(select(QuizRoom).where(QuizRoom.code==code))
        advance(db,room,clock=time.time()+2000)

def next_event(ws,event,predicate=lambda message:True):
    for _ in range(20):
        message=ws.receive_json()
        if message['event']==event and predicate(message):return message
    raise AssertionError(f'Expected {event}')

def test_presenter_does_not_use_a_player_slot(client):
    host,code=host_room(client)
    lobby=client.get(f'/api/quiz/rooms/{code}').json()
    assert lobby['role']=='presenter' and lobby['team_id'] is None
    assert lobby['player_count']==0 and sum(team['size'] for team in lobby['teams'])==0
    assert client.post(f'/api/quiz/rooms/{code}/start').status_code==409
    assert client.put(f'/api/quiz/rooms/{code}/team',json={'letter':'B'}).status_code==403
    player,_=add_player(code)
    assert player.post(f'/api/quiz/rooms/{code}/start').status_code==403
    assert client.get(f'/api/quiz/rooms/{code}').json()['player_count']==1

@pytest.mark.parametrize('category,total',[('astrology',10),('numerals',10),('mixed',15)])
def test_category_and_preview_payloads(client,category,total):
    host,code=host_room(client); player,user=add_player(code)
    state=client.post(f'/api/quiz/rooms/{code}/start',json={'category':category}).json()
    assert state['phase']=='preview' and state['total']==total and state['category']==category
    assert state['ends_at']-state['starts_at']==PREVIEW_SECONDS*1000
    assert 'prompt' in state['question'] and not {'answer','hint','source_title','explanation'} & set(state['question'])
    device=player.get(f'/api/quiz/rooms/{code}').json()
    assert device['question'] is None and device['choice_count']==4 and device['question_id']==state['question_id']
    assert not {'review','leaderboard'} & set(device)
    assert player.post(f'/api/quiz/rooms/{code}/answers',json={'question_id':state['question_id'],'choice_index':0}).status_code==409
    assert client.post('/api/tutor/chat',json={'lesson_slug':'roman','message':'What is XIV?'}).status_code==403
    assert player.put(f'/api/quiz/rooms/{code}/team',json={'letter':'B'}).status_code==409

def test_websocket_input_ack_duplicate_and_reconnect(client):
    host,code=host_room(client); player,user=add_player(code); add_player(code,'Waiting player')
    state=client.post(f'/api/quiz/rooms/{code}/start').json()
    question,started,end=open_question(state)
    correct_index=question.snapshot['choices'].index(question.snapshot['answer'])
    with client.websocket_connect(f'/api/quiz/rooms/{code}/ws',headers=ORIGIN) as host_ws:
        assert next_event(host_ws,'room_state')['state']['question']['prompt']
        with player.websocket_connect(f'/api/quiz/rooms/{code}/ws',headers=ORIGIN) as ws:
            device=next_event(ws,'room_state')['state']
            assert device['question'] is None and device['phase']=='question'
            payload={'action':'SUBMIT_ANSWER','question_id':question.id,'choice_index':correct_index,'request_id':'first','clientTimestamp':0}
            ws.send_json(payload)
            ack=next_event(ws,'answer_accepted')
            assert ack=={'event':'answer_accepted','request_id':'first','accepted':True,'duplicate':False}
            update=next_event(ws,'room_state')['state']
            assert update['answered'] and update['selected_index']==correct_index
            assert update['question'] is None and all(team['points']==team['correct']==0 for team in update['teams'])
            ws.send_json(payload|{'request_id':'again'})
            assert next_event(ws,'answer_accepted')['duplicate'] is True
            ws.send_text('not json')
            assert next_event(ws,'answer_error')['detail']
            ws.send_json({'action':'PING'})
            assert next_event(ws,'pong')['server_now']>0
        host_update=next_event(host_ws,'room_state',lambda message:message['state']['responses']==1)['state']
        assert host_update['question']['prompt'] and 'leaderboard' not in host_update
    with player.websocket_connect(f'/api/quiz/rooms/{code}/ws',headers=ORIGIN) as ws:
        restored=next_event(ws,'room_state')['state']
        assert restored['answered'] and restored['selected_index']==correct_index
        assert restored['question'] is None
    with transaction() as db:
        answers=list(db.scalars(select(QuizAnswer)))
        assert len(answers)==1 and 900<=answers[0].points<=1000

def test_server_scoring_rejects_late_invalid_and_presenter_answers(client):
    host,code=host_room(client); player,user=add_player(code); _,other=add_player(code,'Other')
    state=client.post(f'/api/quiz/rooms/{code}/start').json()
    question,started,end=open_question(state)
    answer=AnswerInput(question_id=question.id,choice_index=question.snapshot['choices'].index(question.snapshot['answer']))
    with pytest.raises(HTTPException) as denied:submit_answer(code,answer,host,clock=started+10)
    assert denied.value.status_code==403
    assert submit_answer(code,answer,user,clock=started+10)=={'accepted':True,'duplicate':False}
    with transaction() as db:assert db.scalar(select(QuizAnswer.points))==750
    assert submit_answer(code,answer,user,clock=end+1)['duplicate']
    with pytest.raises(HTTPException) as late:submit_answer(code,answer,other,clock=end)
    assert late.value.status_code==409
    with pytest.raises(HTTPException):submit_answer(code,AnswerInput(question_id='old-question',choice_index=0),other,clock=started+5)
    assert player.post(f'/api/quiz/rooms/{code}/answers',json={'question_id':question.id,'choice_index':4}).status_code==422

def test_full_deadline_then_reveal_then_next_question(client):
    host,code=host_room(client); player,user=add_player(code)
    state=client.post(f'/api/quiz/rooms/{code}/start').json()
    with transaction() as db:
        room=db.scalar(select(QuizRoom).where(QuizRoom.code==code)); session=db.get(QuizSession,state['session_id'])
        preview_end=session.ends_at
        advance(db,room,clock=preview_end)
        assert session.phase=='question' and session.ends_at==preview_end+QUESTION_SECONDS
        question_end=session.ends_at
    question,started,end=open_question(state)
    submit_answer(code,AnswerInput(question_id=question.id,choice_index=0),user)
    update=client.get(f'/api/quiz/rooms/{code}').json()
    assert update['phase']=='question' and update['responses']==1
    assert 'reveal' not in update and update['ends_at']==int(end*1000)
    with transaction() as db:
        room=db.scalar(select(QuizRoom).where(QuizRoom.code==code)); session=db.get(QuizSession,state['session_id'])
        assert advance(db,room,clock=end-0.001) is False
        advance(db,room,clock=end)
        assert session.phase=='reveal' and session.ends_at==end+REVEAL_SECONDS
        advance(db,room,clock=session.ends_at-0.001)
        assert session.phase=='reveal' and session.current_question==0
        advance(db,room,clock=end+REVEAL_SECONDS)
        assert session.phase=='preview' and session.current_question==1
    update=client.get(f'/api/quiz/rooms/{code}').json()
    assert update['question_id']!=question.id and update['phase']=='preview'
    assert not {'leaderboard','review','reveal'} & set(update)
    assert all(team['correct']==team['points']==0 for team in update['teams'])

def test_reveal_payloads_are_personalized_on_http_socket_and_reconnect(client):
    host,code=host_room(client)
    right,right_user=add_player(code,'Correct')
    wrong,wrong_user=add_player(code,'Incorrect')
    absent,_=add_player(code,'No answer')
    state=client.post(f'/api/quiz/rooms/{code}/start',json={'category':'astrology'}).json()
    question,started,end=open_question(state)
    correct_index=question.snapshot['choices'].index(question.snapshot['answer'])
    wrong_index=(correct_index+1)%4
    submit_answer(code,AnswerInput(question_id=question.id,choice_index=correct_index),right_user,clock=started+10)
    submit_answer(code,AnswerInput(question_id=question.id,choice_index=wrong_index),wrong_user,clock=started+10)
    assert 'reveal' not in right.get(f'/api/quiz/rooms/{code}').json()
    with transaction() as db:
        session=db.get(QuizSession,state['session_id']); session.ends_at=time.time()-0.1
    for player,expected,index,points in [(right,True,correct_index,750),(wrong,False,wrong_index,0),(absent,None,None,0)]:
        with player.websocket_connect(f'/api/quiz/rooms/{code}/ws',headers=ORIGIN) as ws:
            message=next_event(ws,'room_state')['state']
            assert message['phase']=='reveal' and message['question'] is None
            reveal=message['reveal']
            assert reveal['correct'] is expected and reveal['submitted_index']==index and reveal['points']==points
            assert reveal['answer']==question.snapshot['answer'] and reveal['correct_index']==correct_index
            assert sum(reveal['answer_counts'])==2 and reveal['explanation_th'] and reveal['source_slide']
            assert 'review' not in message
        restored=player.get(f'/api/quiz/rooms/{code}').json()['reveal']
        assert restored==reveal
    shared=client.get(f'/api/quiz/rooms/{code}').json()['reveal']
    assert shared['correct'] is None and shared['points']==0 and shared['submitted_index'] is None
    assert absent.post(f'/api/quiz/rooms/{code}/answers',json={'question_id':question.id,'choice_index':correct_index}).status_code==409

def test_last_question_gets_full_reveal_before_final_rankings(client):
    host,code=host_room(client); add_player(code)
    state=client.post(f'/api/quiz/rooms/{code}/start').json()
    with transaction() as db:
        room=db.scalar(select(QuizRoom).where(QuizRoom.code==code)); session=db.get(QuizSession,state['session_id'])
        session.current_question=9; session.phase='question'; end=session.ends_at
        advance(db,room,clock=end)
        assert room.status=='active' and session.phase=='reveal'
        advance(db,room,clock=end+REVEAL_SECONDS-0.001)
        assert room.status=='active' and session.phase=='reveal'
        advance(db,room,clock=end+REVEAL_SECONDS)
        assert room.status=='finished' and session.phase=='finished'
    done=client.get(f'/api/quiz/rooms/{code}').json()
    assert done['leaderboard'] and 'review' not in done and 'reveal' not in done

def test_host_skip_reveals_to_players_preserves_scores_and_rejects_late_answers(client):
    host,code=host_room(client)
    right,user=add_player(code,'Answered')
    absent,_=add_player(code,'Still thinking')
    state=client.post(f'/api/quiz/rooms/{code}/start').json()
    question,started,end=open_question(state)
    index=question.snapshot['choices'].index(question.snapshot['answer'])
    submit_answer(code,AnswerInput(question_id=question.id,choice_index=index),user,clock=started+0.5)
    with transaction() as db: points=db.scalar(select(QuizAnswer.points))
    with right.websocket_connect(f'/api/quiz/rooms/{code}/ws',headers=ORIGIN) as ws:
        assert next_event(ws,'room_state')['state']['phase']=='question'
        payload={'question_id':question.id,'phase':'question'}
        response=client.post(f'/api/quiz/rooms/{code}/skip',json=payload)
        assert response.status_code==200
        revealed=response.json()
        assert revealed['phase']=='reveal' and revealed['question_number']==1
        assert revealed['starts_at']<int(end*1000)
        assert revealed['ends_at']-revealed['starts_at']==REVEAL_SECONDS*1000
        update=next_event(ws,'room_state',lambda message:message['state']['phase']=='reveal')['state']
        assert update['question'] is None and update['reveal']['correct'] is True
        assert update['reveal']['points']==points and sum(update['reveal']['answer_counts'])==1
        # Retrying the same click must not bypass the answer explanation.
        repeated=client.post(f'/api/quiz/rooms/{code}/skip',json=payload).json()
        assert repeated['phase']=='reveal' and repeated['ends_at']==revealed['ends_at']
    assert absent.post(f'/api/quiz/rooms/{code}/answers',json={'question_id':question.id,'choice_index':index}).status_code==409
    missed=absent.get(f'/api/quiz/rooms/{code}').json()['reveal']
    assert missed['submitted_index'] is None and missed['points']==0
    with transaction() as db:
        assert db.scalar(select(func.count()).select_from(QuizAnswer))==1
        assert db.scalar(select(QuizAnswer.points))==points
    next_state=client.post(f'/api/quiz/rooms/{code}/skip',json={'question_id':question.id,'phase':'reveal'}).json()
    assert next_state['phase']=='preview' and next_state['question_number']==2
    assert 'reveal' not in next_state and all(team['points']==0 for team in next_state['teams'])
    stale=client.post(f'/api/quiz/rooms/{code}/skip',json=payload).json()
    assert stale['question_id']==next_state['question_id'] and stale['ends_at']==next_state['ends_at']

def test_skip_is_host_only_and_timer_races_do_not_skip_two_phases(client):
    host,code=host_room(client); player,_=add_player(code)
    payload={'question_id':'not-started','phase':'preview'}
    assert player.post(f'/api/quiz/rooms/{code}/skip',json=payload).status_code==403
    assert client.post(f'/api/quiz/rooms/{code}/skip',json=payload).status_code==409
    state=client.post(f'/api/quiz/rooms/{code}/start').json()
    payload['question_id']=state['question_id']
    assert player.post(f'/api/quiz/rooms/{code}/skip',json=payload).status_code==403
    assert client.post(f'/api/quiz/rooms/{code}/skip',json=payload|{'phase':'finished'}).status_code==422
    answering=client.post(f'/api/quiz/rooms/{code}/skip',json=payload).json()
    assert answering['phase']=='question' and answering['question_id']==state['question_id']
    assert answering['ends_at']-answering['starts_at']==QUESTION_SECONDS*1000
    repeated=client.post(f'/api/quiz/rooms/{code}/skip',json=payload).json()
    assert repeated['phase']=='question' and repeated['ends_at']==answering['ends_at']
    with transaction() as db:
        session=db.get(QuizSession,state['session_id'])
        session.ends_at=time.time()-0.01
        expired=session.ends_at
    # The natural deadline wins. An old answering click cannot skip the reveal.
    revealed=client.post(f'/api/quiz/rooms/{code}/skip',json=payload|{'phase':'question'}).json()
    assert revealed['phase']=='reveal' and revealed['question_number']==1
    assert revealed['ends_at']==int((expired+REVEAL_SECONDS)*1000)

def test_skip_last_question_reveals_then_finishes_with_existing_scores(client):
    host,code=host_room(client); player,user=add_player(code)
    state=client.post(f'/api/quiz/rooms/{code}/start').json()
    question,started,end=open_question(state)
    submit_answer(code,AnswerInput(question_id=question.id,answer=question.snapshot['answer']),user,clock=started+10)
    with transaction() as db:
        session=db.get(QuizSession,state['session_id'])
        session.current_question=9
        session.phase='question'; session.starts_at=time.time()-1; session.ends_at=session.starts_at+QUESTION_SECONDS
    last=client.get(f'/api/quiz/rooms/{code}').json()
    payload={'question_id':last['question_id'],'phase':'question'}
    revealed=client.post(f'/api/quiz/rooms/{code}/skip',json=payload).json()
    assert revealed['status']=='active' and revealed['phase']=='reveal' and 'leaderboard' not in revealed
    assert revealed['reveal']['answer']
    done=client.post(f'/api/quiz/rooms/{code}/skip',json=payload|{'phase':'reveal'}).json()
    assert done['status']=='finished' and done['phase']=='finished'
    assert 'reveal' not in done and done['leaderboard'][0]['points']==750
    assert done['leaderboard'][0]['correct']==1
    assert player.get(f'/api/quiz/rooms/{code}').json()['status']=='finished'

def test_simultaneous_answers_balanced_final_scores_and_rankings(client):
    host,code=host_room(client)
    users=[]; clients=[]
    letters=['A']*4+['B']*6+['C']*3+['D']*5
    for index,letter in enumerate(letters):
        player,user=add_player(code,f'Player {index}')
        player.put(f'/api/quiz/rooms/{code}/team',json={'letter':letter})
        player.put(f'/api/quiz/rooms/{code}/ready',json={'ready':True})
        users.append(user);clients.append(player)
    state=client.post(f'/api/quiz/rooms/{code}/start').json()
    question,started,end=open_question(state)
    payload=AnswerInput(question_id=question.id,answer=question.snapshot['answer'])
    with ThreadPoolExecutor(max_workers=18) as pool:results=list(pool.map(lambda user:submit_answer(code,payload,user,clock=started+10),users))
    assert all(result['accepted'] for result in results)
    playing=client.get(f'/api/quiz/rooms/{code}').json()
    assert [team['size'] for team in playing['teams']]==[4,6,3,5]
    assert all(team['power']==1 and team['correct']==0 and team['points']==0 for team in playing['teams'])
    finish(code)
    done=client.get(f'/api/quiz/rooms/{code}').json()
    assert done['status']=='finished' and done['winners']==list('ABCD')
    assert all(team['power']==750 for team in done['teams'])
    assert 'review' not in done and len(done['leaderboard'])==18
    assert all(person['points']==750 and person['streak']==1 for person in done['leaderboard'])
    personal=clients[0].get(f'/api/quiz/rooms/{code}').json()
    assert 'review' not in personal and personal['leaderboard'][0]['points']==750
    assert clients[0].get('/api/profile').json()['quizzes'][0]['correct']==1
    assert client.get('/api/tutor/status').json()['enabled'] is True
    rematch=client.post(f'/api/quiz/rooms/{code}/rematch').json()
    assert rematch['code']!=code and rematch['player_count']==0

def test_room_membership_and_readiness(client):
    host,code=host_room(client)
    player=TestClient(app);guest(player,'Not ready');player.post(f'/api/quiz/rooms/{code}/join')
    assert client.post(f'/api/quiz/rooms/{code}/start').status_code==409
    assert player.get('/api/quiz/rooms/000000').status_code==404
    outsider=TestClient(app);guest(outsider,'Outsider')
    assert outsider.get(f'/api/quiz/rooms/{code}').status_code==403

def test_live_quiz_sets_are_balanced_and_cite_course_slides():
    astrology=live_quiz_questions('astrology');numerals=live_quiz_questions('numerals');mixed=live_quiz_questions('mixed')
    assert len(astrology)==10 and all(question['category']=='astrology' for question in astrology)
    assert len(numerals)==10 and {question['system'] for question in numerals}=={'thai','mayan','babylonian','roman'}
    assert len(mixed)==15 and sum(question['category']=='astrology' for question in mixed)==8
    assert {question['system'] for question in mixed if question['category']=='numerals'}=={'thai','mayan','babylonian','roman'}
    assert all(question.get('source_title') and question.get('source_title_th') for question in astrology+numerals+mixed)
    assert not {'answer','answer_th','explanation','explanation_th'} & set(public_question(astrology[0]))
