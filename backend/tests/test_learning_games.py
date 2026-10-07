from sqlalchemy import select,func
from app.db import transaction
from app.models import LessonProgress,GameAttempt
from app.content import generated_bank,bank_questions,roman,representation,make_activity
from conftest import guest

def test_content_has_meaningful_unique_questions():
    bank=generated_bank()
    assert len(bank)==1276 and len({q['id'] for q in bank})==1276
    for system in ['roman','mayan','babylonian','thai']:
        for difficulty in ['beginner','intermediate','advanced']:
            assert len(bank_questions(system,difficulty))==100
    assert roman(1994)=='MCMXCIV'
    assert representation(443,'mayan')['levels']==[1,2,3]
    assert representation(3723,'babylonian')['levels']==[1,2,3]
    for i in range(120):
        questions=make_activity('decode','roman','beginner',str(i))
        assert len({q['id'] for q in questions})==10

def test_profile_and_progress_persist(client):
    user=guest(client)
    lesson=client.get('/api/lessons/thai-astrology').json()
    assert len(lesson['slides'])==12
    assert client.put('/api/progress/thai-astrology',json={'slide':2}).status_code==200
    assert client.get('/api/profile').json()['progress'][0]['slide']==2
    assert client.put('/api/progress/thai-astrology',json={'slide':99}).status_code==422
    assert client.put('/api/progress/thai-astrology',json={'slide':2,'completed':True}).status_code==422
    assert client.put('/api/progress/thai-astrology',json={'slide':11,'completed':True}).status_code==200
    with transaction() as db:assert db.scalar(select(func.count()).select_from(LessonProgress).where(LessonProgress.user_id==user['id']))==1

def test_all_game_flows_are_server_scored(client):
    guest(client)
    for activity in ['decode','match','timeline','date']:
        run=client.post('/api/games',json={'activity':activity,'system':'roman','difficulty':'beginner'}).json()
        assert len(run['questions'])==10
        assert all('answer' not in q and 'explanation' not in q for q in run['questions'])
        qs=make_activity(activity,'roman','beginner',run['id'])
        for i,q in enumerate(qs):
            payload={'question_id':q['id'],'answer':q['answer'] if i!=3 else 'wrong'}
            result=client.post(f'/api/games/{run["id"]}/attempts',json=payload)
            assert result.status_code==200,result.text
            assert result.json()['correct']==(i!=3)
        duplicate=client.post(f'/api/games/{run["id"]}/attempts',json={'question_id':qs[0]['id'],'answer':'wrong'})
        assert duplicate.json()['correct'] is True
        result=client.get(f'/api/games/{run["id"]}/results').json()
        assert result['score']==9 and result['total']==10
        with transaction() as db:assert db.scalar(select(func.count()).select_from(GameAttempt).where(GameAttempt.run_id==run['id']))==10
    assert len(client.get('/api/profile').json()['games'])==4

def test_auth_and_ownership(client):
    assert client.post('/api/games',json={'activity':'decode'}).status_code==401
    guest(client)
    run=client.post('/api/games',json={'activity':'decode'}).json()
    guest(client,'Other explorer')
    assert client.get('/api/games/'+run['id']+'/results').status_code==404
    assert client.get('/api/lessons/unknown').status_code==404

def test_astrology_games_cover_all_levels_and_persist(client):
    guest(client)
    for difficulty in ['beginner','intermediate','advanced']:
        pool=bank_questions('astrology',difficulty)
        assert len(pool)>=10
        assert all(q['answer'] in q['choices'] and len(set(q['choices']))==4 and len(q['choices_th'])==4 for q in pool)
        run=client.post('/api/games',json={'activity':'astroquest','difficulty':difficulty}).json()
        assert len(run['questions'])==10 and len({q['id'] for q in run['questions']})==10
        assert all('answer' not in q and 'explanation_th' not in q for q in run['questions'])
        questions=make_activity('astroquest','astrology',difficulty,run['id'])
        first=questions[0]
        invalid=client.post(f'/api/games/{run["id"]}/attempts',json={'question_id':first['id'],'answer':'invented option'})
        assert invalid.status_code==422
        for i,q in enumerate(questions):
            answer=q['answer'] if i else next(c for c in q['choices'] if c!=q['answer'])
            result=client.post(f'/api/games/{run["id"]}/attempts',json={'question_id':q['id'],'answer':answer,'language':'th'})
            assert result.status_code==200 and result.json()['correct']==bool(i)
            assert result.json()['explanation']==q['explanation_th']
        result=client.get(f'/api/games/{run["id"]}/results').json()
        assert result['system']=='astrology' and result['score']==9 and result['total']==10
        assert all(a['explanation_th'] and a['prompt_th'] and a['submitted_th'] for a in result['answers'])
    profile=client.get('/api/profile').json()
    assert profile['completed_games']==3 and all(g['activity']=='astroquest' for g in profile['games'])

def test_tutor_is_grounded_and_unknown_is_explicit(client):
    guest(client)
    answer=client.post('/api/tutor/chat',json={'lesson_slug':'thai-astrology','message':'What is the ascendant?'}).json()
    assert 'horizon' in answer['answer'] and answer['mode']=='course-guide'
    thai=client.post('/api/tutor/chat',json={'lesson_slug':'thai-astrology','message':'ลัคนาคืออะไร','language':'th'}).json()
    assert 'ขอบฟ้าทิศตะวันออก' in thai['answer']
    thai=client.post('/api/tutor/chat',json={'lesson_slug':'thai-astrology','message':'สุริยุปราคาเกิดอย่างไร','language':'th'}).json()
    assert 'คราส' in thai['answer'] or 'สุริยุปราคา' in thai['answer']
    answer=client.post('/api/tutor/chat',json={'lesson_slug':'roman','message':'Can you cook a pizza?'}).json()
    assert 'don’t know' in answer['answer']
