import uuid, threading
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
from sqlalchemy import select
from .auth import current_user
from .db import transaction
from .models import GameRun,GameAttempt
from .content import make_activity, public_question
router=APIRouter(prefix='/api/games',tags=['Games'])
game_lock=threading.RLock()
class StartGame(BaseModel):
    activity:Literal['decode','match','timeline','date','astroquest']
    system:Literal['roman','mayan','babylonian','thai','astrology']='roman'
    difficulty:Literal['beginner','intermediate','advanced']='beginner'
class AttemptInput(BaseModel):
    question_id:str=Field(max_length=80)
    answer:str=Field(min_length=1,max_length=120)
    language:Literal['en','th']='en'

def owned(db,id,user):
    run=db.scalar(select(GameRun).where(GameRun.id==id).with_for_update())
    if not run or run.user_id!=user['id']: raise HTTPException(404,'Practice session not found')
    return run

@router.post('')
def start(data:StartGame,user=Depends(current_user)):
    if data.activity=='astroquest':data.system='astrology'
    elif data.system=='astrology':raise HTTPException(422,'Choose a numeral system for this activity.')
    id=str(uuid.uuid4()); qs=make_activity(data.activity,data.system,data.difficulty,id)
    with transaction() as db:
        db.add(GameRun(id=id,user_id=user['id'],activity=data.activity,system=data.system,difficulty=data.difficulty,questions=qs))
    return dict(id=id,questions=[public_question(q) for q in qs])

@router.post('/{id}/attempts')
def attempt(id:str,data:AttemptInput,user=Depends(current_user)):
    with game_lock, transaction() as db:
        run=owned(db,id,user)
        q=next((q for q in run.questions if q['id']==data.question_id),None)
        if not q: raise HTTPException(422,'That question is not in this practice session.')
        existing=db.scalar(select(GameAttempt).where(GameAttempt.run_id==id,GameAttempt.question_id==data.question_id))
        explanation=q.get('explanation_th',q['explanation']) if data.language=='th' else q['explanation']
        if existing: return dict(correct=existing.correct,answer=q['answer'],explanation=explanation)
        answered=list(db.scalars(select(GameAttempt.question_id).where(GameAttempt.run_id==id)))
        if run.questions[len(answered)]['id']!=data.question_id: raise HTTPException(409,'Complete the current question first.')
        if run.activity=='astroquest' and data.answer not in q['choices']:raise HTTPException(422,'Choose one of the available answers.')
        correct=data.answer.strip().lower()==q['answer'].lower()
        db.add(GameAttempt(run_id=id,question_id=q['id'],answer=data.answer,correct=correct))
        run.finished=len(answered)+1==len(run.questions)
        return dict(correct=correct,answer=q['answer'],explanation=explanation)

@router.get('/{id}/results')
def results(id:str,user=Depends(current_user)):
    with transaction() as db:
        run=owned(db,id,user)
        attempts={x.question_id:x for x in db.scalars(select(GameAttempt).where(GameAttempt.run_id==id))}
        if not run.finished: raise HTTPException(409,'Finish this practice session to see your results.')
        def localized_choice(q,value):
            return q.get('choices_th',q.get('choices',[]))[q['choices'].index(value)] if value in q.get('choices',[]) else value
        return dict(activity=run.activity,system=run.system,total=len(run.questions),score=sum(x.correct for x in attempts.values()),answers=[dict(prompt=q['prompt'],prompt_th=q.get('prompt_th'),representation=q.get('representation'),correct=attempts[q['id']].correct,submitted=attempts[q['id']].answer,submitted_th=localized_choice(q,attempts[q['id']].answer),answer=q['answer'],answer_th=localized_choice(q,q['answer']),explanation=q['explanation'],explanation_th=q.get('explanation_th',q['explanation'])) for q in run.questions])
