"""Server-authoritative deadlines, per-question reveals, and final rankings.

One API worker owns WebSocket broadcasts. PostgreSQL row locks serialize room
mutations; the process lock gives SQLite development equivalent ordering.
"""
import asyncio
import json
import logging
import secrets
import threading
import time
import uuid
from collections import defaultdict
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError
from .auth import current_user, user_from_token
from .db import transaction
from .models import QuizRoom, QuizSession, QuizTeam, QuizParticipant, SessionQuestion, QuizAnswer, TeamScore, User
from .quiz_questions import live_quiz_questions

router=APIRouter(prefix='/api/quiz',tags=['Live Quiz'])
lock=threading.RLock()
MAX_ROOM=32
PREVIEW_SECONDS=5
QUESTION_SECONDS=20
REVEAL_SECONDS=8
BASE_POINTS=1000
connections=defaultdict(dict)

def uid(): return str(uuid.uuid4())

def room_by_code(db,code):
    room=db.scalar(select(QuizRoom).where(QuizRoom.code==code).with_for_update())
    if not room: raise HTTPException(404,'Room not found. Check the six-digit code and try again.')
    return room

def participant(db,room,user):
    person=db.scalar(select(QuizParticipant).where(QuizParticipant.room_id==room.id,QuizParticipant.user_id==user['id']))
    if not person: raise HTTPException(403,'Join this room first.')
    return person

def current_question(db,session):
    return db.scalar(select(SessionQuestion).where(SessionQuestion.session_id==session.id,SessionQuestion.position==session.current_question))

def player_count(db,room):
    return db.scalar(select(func.count()).select_from(QuizParticipant).where(QuizParticipant.room_id==room.id,QuizParticipant.user_id!=room.host_id))

def advance(db,room,clock=None):
    if room.status!='active': return False
    session=db.get(QuizSession,room.session_id)
    now=time.time() if clock is None else clock
    changed=False
    # Full deadlines remain the default; only the host can end a phase early.
    total=db.scalar(select(func.count()).select_from(SessionQuestion).where(SessionQuestion.session_id==session.id))
    while not session.finished and now>=session.ends_at:
        changed=True
        boundary=session.ends_at
        session.starts_at=boundary
        if session.phase=='preview':
            session.phase='question'; session.ends_at=boundary+QUESTION_SECONDS
        elif session.phase=='question':
            session.phase='reveal'; session.ends_at=boundary+REVEAL_SECONDS
        elif session.current_question+1>=total:
            session.finished=True; session.phase='finished'; room.status='finished'
        else:
            session.current_question+=1; session.phase='preview'; session.ends_at=boundary+PREVIEW_SECONDS
    return changed

def player_view(state,host):
    # Presenter content never enters an active player's HTTP or socket payload.
    result=state|{'host':host,'role':'presenter' if host else 'player'}
    if not host: result['question']=None
    return result

def personal_reveal(reveal,question,answer):
    choices=question.snapshot['choices']
    selected=choices.index(answer.answer) if answer else None
    return reveal|dict(submitted_index=selected,correct=answer.correct if answer else None,points=answer.points if answer else 0)

def question_reveal(question,answers,mine):
    q=question.snapshot
    fields=('prompt','prompt_th','system','representation','choices','choices_th','answer','answer_th','explanation','explanation_th','source_lesson','source_title','source_title_th','source_slide')
    reveal={key:q[key] for key in fields if key in q}
    reveal.update(question_id=question.id,correct_index=q['choices'].index(q['answer']),answer_counts=[sum(a.question_id==question.id and a.answer==choice for a in answers) for choice in q['choices']])
    return personal_reveal(reveal,question,mine)

def snapshot(db,room,user):
    person=participant(db,room,user)
    finished=room.status=='finished'
    session=db.get(QuizSession,room.session_id) if room.session_id else None
    question=current_question(db,session) if session else None
    members=db.execute(select(QuizParticipant.user_id,QuizParticipant.team_id,QuizParticipant.ready,User.name).join(User,User.id==QuizParticipant.user_id).where(QuizParticipant.room_id==room.id,QuizParticipant.user_id!=room.host_id)).all()
    answers=list(db.scalars(select(QuizAnswer).where(QuizAnswer.session_id==session.id))) if session else []
    teams=[]
    for team in db.scalars(select(QuizTeam).where(QuizTeam.room_id==room.id).order_by(QuizTeam.letter)):
        people=[dict(id=m.user_id,name=m.name,ready=m.ready) for m in members if m.team_id==team.id]
        size=team.locked_size if session else len(people)
        team_answers=[a for a in answers if a.team_id==team.id]
        responses=sum(a.question_id==question.id for a in team_answers) if question else 0
        points=sum(a.points for a in team_answers) if finished else 0
        correct=sum(a.correct for a in team_answers) if finished else 0
        power=round(points/size,2) if finished and size else (round(responses/size,4) if size else 0)
        teams.append(dict(id=team.id,letter=team.letter,players=people,size=size,correct=correct,points=points,power=power,answered=len(team_answers),responses=responses))
    mine=next((a for a in answers if a.question_id==question.id and a.user_id==user['id']),None) if question else None
    total=db.scalar(select(func.count()).select_from(SessionQuestion).where(SessionQuestion.session_id==session.id)) if session else 0
    visible_question=None
    if question and session.phase in ('preview','question'):
        visible_question={key:question.snapshot[key] for key in ('prompt','prompt_th','system','representation','choices','choices_th') if key in question.snapshot}
        visible_question['id']=question.id
    state=dict(code=room.code,status=room.status,host=room.host_id==user['id'],team_id=person.team_id if room.host_id!=user['id'] else None,ready=person.ready,teams=teams,server_now=int(time.time()*1000),max_players=MAX_ROOM,player_count=len(members),question=visible_question,session_id=room.session_id,category=question.snapshot.get('quiz_category','numerals') if question else None,total=total,phase=session.phase if session else 'lobby',question_id=question.id if question else None,question_number=session.current_question+1 if session else 0,choice_count=len(question.snapshot['choices']) if question else 4,starts_at=int(session.starts_at*1000) if session else None,ends_at=int(session.ends_at*1000) if session else None,answered=bool(mine),selected_index=question.snapshot['choices'].index(mine.answer) if mine else None,responses=sum(t['responses'] for t in teams))
    if question and session.phase=='reveal':
        state['reveal']=question_reveal(question,answers,mine)
    if finished:
        high=max((t['power'] for t in teams if t['size']),default=0)
        state['winners']=[t['letter'] for t in teams if t['size'] and t['power']==high]
        questions=list(db.scalars(select(SessionQuestion).where(SessionQuestion.session_id==session.id).order_by(SessionQuestion.position)))
        leaderboard=[]
        for member in members:
            personal=[a for a in answers if a.user_id==member.user_id]
            by_question={a.question_id:a for a in personal}
            streak=best=0
            for q in questions:
                streak=streak+1 if q.id in by_question and by_question[q.id].correct else 0
                best=max(best,streak)
            leaderboard.append(dict(id=member.user_id,name=member.name,team=next(t['letter'] for t in teams if t['id']==member.team_id),points=sum(a.points for a in personal),correct=sum(a.correct for a in personal),streak=best))
        leaderboard.sort(key=lambda item:(-item['points'],-item['correct'],item['name'].casefold(),item['id']))
        state['leaderboard']=[item|{'rank':i+1} for i,item in enumerate(leaderboard)]
    return player_view(state,room.host_id==user['id'])

async def broadcast(code):
    audience=list(connections.get(code,{}).items())
    if not audience: return
    with lock,transaction() as db:
        room=room_by_code(db,code); advance(db,room); db.flush()
        base=snapshot(db,room,{'id':room.host_id})
        roster={p.user_id:p for p in db.scalars(select(QuizParticipant).where(QuizParticipant.room_id==room.id))}
        question=current_question(db,db.get(QuizSession,room.session_id)) if room.session_id else None
        answers={a.user_id:a for a in db.scalars(select(QuizAnswer).where(QuizAnswer.session_id==room.session_id,QuizAnswer.question_id==question.id))} if question else {}
        payloads=[]
        for ws,user in audience:
            if user['id'] not in roster: continue
            if room.status=='finished': state=snapshot(db,room,user)
            else:
                person=roster[user['id']]; answer=answers.get(user['id']); host=room.host_id==user['id']
                state=player_view(base|{'team_id':None if host else person.team_id,'ready':person.ready,'answered':bool(answer),'selected_index':question.snapshot['choices'].index(answer.answer) if answer else None},host)
                if 'reveal' in base: state['reveal']=personal_reveal(base['reveal'],question,answer)
            payloads.append((ws,state))
    for ws,state in payloads:
        try: await ws.send_json({'event':'room_state','state':state})
        except (WebSocketDisconnect,RuntimeError,OSError): connections.get(code,{}).pop(ws,None)

@router.post('/rooms')
def create(user=Depends(current_user)):
    with lock,transaction() as db:
        code=str(secrets.randbelow(900000)+100000)
        while db.scalar(select(QuizRoom.id).where(QuizRoom.code==code)): code=str(secrets.randbelow(900000)+100000)
        room=QuizRoom(id=uid(),code=code,host_id=user['id']); db.add(room); db.flush()
        teams=[QuizTeam(id=uid(),room_id=room.id,letter=letter) for letter in 'ABCD']; db.add_all(teams); db.flush()
        # Presenter membership authorizes the shared display, without using a slot.
        db.add(QuizParticipant(id=uid(),room_id=room.id,user_id=user['id'],team_id=teams[0].id,ready=True)); db.flush()
        return snapshot(db,room,user)

@router.post('/rooms/{code}/join')
async def join(code:str,user=Depends(current_user)):
    with lock,transaction() as db:
        room=room_by_code(db,code)
        existing=db.scalar(select(QuizParticipant).where(QuizParticipant.room_id==room.id,QuizParticipant.user_id==user['id']))
        if not existing:
            if room.status!='lobby': raise HTTPException(409,'This match has started. Rejoin with your original account.')
            if player_count(db,room)>=MAX_ROOM: raise HTTPException(409,'This room is full (32 players).')
            teams=list(db.scalars(select(QuizTeam).where(QuizTeam.room_id==room.id).order_by(QuizTeam.letter)))
            team=min(teams,key=lambda t:db.scalar(select(func.count()).select_from(QuizParticipant).where(QuizParticipant.team_id==t.id,QuizParticipant.user_id!=room.host_id)))
            db.add(QuizParticipant(id=uid(),room_id=room.id,user_id=user['id'],team_id=team.id)); db.flush()
        advance(db,room); db.flush(); result=snapshot(db,room,user)
    await broadcast(code)
    return result

@router.get('/rooms/{code}')
def state(code:str,user=Depends(current_user)):
    with lock,transaction() as db:
        room=room_by_code(db,code); advance(db,room); db.flush()
        return snapshot(db,room,user)

class TeamInput(BaseModel): letter:Literal['A','B','C','D']
class ReadyInput(BaseModel): ready:bool

@router.put('/rooms/{code}/team')
async def select_team(code:str,data:TeamInput,user=Depends(current_user)):
    with lock,transaction() as db:
        room=room_by_code(db,code); person=participant(db,room,user)
        if room.host_id==user['id']: raise HTTPException(403,'The presenter controls the shared screen and does not join a team.')
        if room.status!='lobby' or person.locked: raise HTTPException(409,'Teams are locked for this match.')
        person.team_id=db.scalar(select(QuizTeam.id).where(QuizTeam.room_id==room.id,QuizTeam.letter==data.letter)); person.ready=False
    await broadcast(code)
    return {'ok':True}

@router.put('/rooms/{code}/ready')
async def ready(code:str,data:ReadyInput,user=Depends(current_user)):
    with lock,transaction() as db:
        room=room_by_code(db,code); person=participant(db,room,user)
        if room.host_id==user['id']: raise HTTPException(403,'Only players need to mark themselves ready.')
        if room.status!='lobby': raise HTTPException(409,'This match has already started.')
        person.ready=data.ready
    await broadcast(code)
    return {'ok':True}

class StartInput(BaseModel): category:Literal['astrology','numerals','mixed']='numerals'

@router.post('/rooms/{code}/start')
async def start(code:str,data:StartInput|None=None,user=Depends(current_user)):
    category=data.category if data else 'numerals'
    questions=live_quiz_questions(category)
    if len(questions)!=(15 if category=='mixed' else 10): raise HTTPException(503,'The selected quiz does not have enough course questions.')
    with lock,transaction() as db:
        room=room_by_code(db,code)
        if room.host_id!=user['id']: raise HTTPException(403,'Only the host can start the match.')
        if room.status=='active': return snapshot(db,room,user)
        if room.status!='lobby': raise HTTPException(409,'Create a rematch room to play again.')
        people=list(db.scalars(select(QuizParticipant).where(QuizParticipant.room_id==room.id,QuizParticipant.user_id!=room.host_id)))
        if not people: raise HTTPException(409,'Wait for at least one player to join.')
        if not all(p.ready for p in people): raise HTTPException(409,'Wait until every player is ready.')
        now=time.time()
        session=QuizSession(id=uid(),room_id=room.id,phase='preview',starts_at=now,ends_at=now+PREVIEW_SECONDS); db.add(session); db.flush()
        room.session_id=session.id; room.status='active'
        for person in people: person.locked=True
        for team in db.scalars(select(QuizTeam).where(QuizTeam.room_id==room.id)):
            team.locked_size=sum(p.team_id==team.id for p in people)
            db.add(TeamScore(id=uid(),session_id=session.id,team_id=team.id,correct=0))
        for i,question in enumerate(questions): db.add(SessionQuestion(id=uid(),session_id=session.id,position=i,snapshot=question|{'quiz_category':category}))
        db.flush(); result=snapshot(db,room,user)
    await broadcast(code)
    return result

class SkipInput(BaseModel):
    question_id:str=Field(min_length=1,max_length=36)
    phase:Literal['preview','question','reveal']

@router.post('/rooms/{code}/skip')
async def skip(code:str,data:SkipInput,user=Depends(current_user)):
    with lock,transaction() as db:
        room=room_by_code(db,code)
        if room.host_id!=user['id']: raise HTTPException(403,'Only the host can advance the question.')
        if room.status!='active': raise HTTPException(409,'There is no active question.')
        now=time.time()
        advance(db,room,clock=now)
        session=db.get(QuizSession,room.session_id)
        question=current_question(db,session)
        # Bind a click to exactly one question and phase. Duplicate requests or
        # a click racing the timer must never skip the following phase/question.
        if room.status=='active' and question.id==data.question_id and session.phase==data.phase:
            session.ends_at=now
            advance(db,room,clock=now)
        db.flush(); result=snapshot(db,room,user)
    await broadcast(code)
    return result

class AnswerInput(BaseModel):
    question_id:str=Field(max_length=36)
    choice_index:int|None=Field(default=None,ge=0,le=3)
    answer:str|None=Field(default=None,min_length=1,max_length=120)

def submit_answer(code,data,user,clock=None):
    with lock,transaction() as db:
        room=room_by_code(db,code); person=participant(db,room,user)
        if room.host_id==user['id']: raise HTTPException(403,'The presenter cannot submit player answers.')
        prior=db.scalar(select(QuizAnswer).where(QuizAnswer.session_id==room.session_id,QuizAnswer.question_id==data.question_id,QuizAnswer.user_id==user['id']))
        if prior: return {'accepted':True,'duplicate':True}
        if room.status!='active': raise HTTPException(409,'There is no active question.')
        session=db.get(QuizSession,room.session_id); question=current_question(db,session)
        now=time.time() if clock is None else clock
        if session.phase!='question' or now<session.starts_at: raise HTTPException(409,'Answer buttons are not open yet.')
        if now>=session.ends_at: raise HTTPException(409,'Time is up. Your answer was not submitted.')
        if data.question_id!=question.id: raise HTTPException(409,'This question has ended. Reconnect to get the current question.')
        choices=question.snapshot['choices']
        answer=choices[data.choice_index] if data.choice_index is not None and data.choice_index<len(choices) else data.answer
        if answer not in choices: raise HTTPException(422,'Choose one of the available answers.')
        correct=answer==question.snapshot['answer']
        # Ignore client timestamps. Correct answers earn 500–1000 points.
        response_time=max(0,now-session.starts_at)
        points=int((1-min(response_time,QUESTION_SECONDS)/(2*QUESTION_SECONDS))*BASE_POINTS+0.5) if correct else 0
        db.add(QuizAnswer(id=uid(),session_id=session.id,question_id=question.id,user_id=user['id'],team_id=person.team_id,answer=answer,correct=correct,submitted_at=now,points=points))
        if correct:
            score=db.scalar(select(TeamScore).where(TeamScore.session_id==session.id,TeamScore.team_id==person.team_id).with_for_update()); score.correct+=1
        return {'accepted':True,'duplicate':False}

@router.post('/rooms/{code}/answers')
async def answer(code:str,data:AnswerInput,user=Depends(current_user)):
    result=submit_answer(code,data,user); await broadcast(code)
    return result

@router.post('/rooms/{code}/rematch')
def rematch(code:str,user=Depends(current_user)):
    with transaction() as db:
        room=room_by_code(db,code); participant(db,room,user)
        if room.host_id!=user['id']: raise HTTPException(403,'Only the host can create the rematch.')
        if room.status!='finished': raise HTTPException(409,'Finish the current match first.')
    return create(user)

@router.websocket('/rooms/{code}/ws')
async def room_socket(ws:WebSocket,code:str):
    from .main import ALLOWED_ORIGINS
    if ws.headers.get('origin') not in ALLOWED_ORIGINS:
        await ws.close(code=1008); return
    try:
        user=user_from_token(ws.cookies.get('zodiac_session'))
        with transaction() as db: participant(db,room_by_code(db,code),user)
    except HTTPException:
        await ws.close(code=1008); return
    await ws.accept(); connections[code][ws]=user
    await broadcast(code)
    recent=[]
    try:
        while True:
            raw=await ws.receive_text()
            if len(raw)>4096: await ws.close(code=1009); break
            request_id=None
            try:
                if raw=='snapshot': await broadcast(code); continue
                message=json.loads(raw)
                if not isinstance(message,dict): raise ValueError('Expected an object.')
                request_id=str(message.get('request_id',''))[:80]
                if message.get('action')=='PING':
                    await ws.send_json({'event':'pong','server_now':int(time.time()*1000)}); continue
                if message.get('action')!='SUBMIT_ANSWER': raise ValueError('Unknown room action.')
                now=time.monotonic(); recent=[stamp for stamp in recent if now-stamp<10]
                if len(recent)>=10: raise HTTPException(429,'Too many submissions. Wait a moment.')
                recent.append(now)
                data=AnswerInput(question_id=message.get('question_id',''),choice_index=message.get('choice_index'))
                if data.choice_index is None: raise ValueError('Choose an answer button.')
                result=submit_answer(code,data,user)
                await ws.send_json({'event':'answer_accepted','request_id':request_id,**result})
                await broadcast(code)
            except HTTPException as error:
                await ws.send_json({'event':'answer_error','request_id':request_id,'detail':error.detail})
            except (ValueError,ValidationError,TypeError):
                await ws.send_json({'event':'answer_error','request_id':request_id,'detail':'Choose one of the available answer buttons.'})
    except (WebSocketDisconnect,RuntimeError,OSError): pass
    finally:
        connections.get(code,{}).pop(ws,None)
        if not connections.get(code): connections.pop(code,None)

async def tick():
    while True:
        await asyncio.sleep(0.25)
        changed=[]
        try:
            with lock,transaction() as db:
                for room in db.scalars(select(QuizRoom).where(QuizRoom.status=='active').with_for_update()):
                    if advance(db,room): changed.append(room.code)
            for code in changed: await broadcast(code)
        except SQLAlchemyError:
            logging.getLogger('zodiac.operations').warning('quiz_clock_database_unavailable')
            await asyncio.sleep(1)
