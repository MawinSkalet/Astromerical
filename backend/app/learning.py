from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from .auth import current_user
from .db import transaction
from .models import LessonProgress, GameRun, GameAttempt, QuizParticipant, QuizRoom, QuizSession, QuizAnswer
from .content import get_lessons, get_lesson
router=APIRouter(prefix='/api',tags=['Learning'])

@router.get('/lessons')
def lessons():
    return [{k:v for k,v in x.items() if k not in ('slides','terms')}|{'total':len(x['slides'])} for x in get_lessons()]

@router.get('/lessons/{slug}')
def lesson(slug:str): return get_lesson(slug)

class ProgressInput(BaseModel):
    slide:int=Field(ge=0,le=100)
    completed:bool=False

@router.put('/progress/{slug}')
def progress(slug:str,data:ProgressInput,user=Depends(current_user)):
    lesson=get_lesson(slug)
    if data.slide>=len(lesson['slides']): raise HTTPException(422,'Invalid lesson slide')
    if data.completed and data.slide!=len(lesson['slides'])-1: raise HTTPException(422,'Finish the final slide to complete this lesson.')
    with transaction() as db:
        row=db.scalar(select(LessonProgress).where(LessonProgress.user_id==user['id'],LessonProgress.lesson_slug==slug))
        if not row:
            row=LessonProgress(user_id=user['id'],lesson_slug=slug,slide=data.slide,completed=data.completed); db.add(row)
        else: row.slide=data.slide; row.completed=row.completed or data.completed
    return {'ok':True}

@router.get('/profile')
def profile(user=Depends(current_user)):
    with transaction() as db:
        progress=[dict(slug=x.lesson_slug,slide=x.slide,completed=x.completed) for x in db.scalars(select(LessonProgress).where(LessonProgress.user_id==user['id']))]
        completed_games=db.scalar(select(func.count()).select_from(GameRun).where(GameRun.user_id==user['id'],GameRun.finished==True))
        runs=db.execute(select(GameRun.id,GameRun.activity,GameRun.system,GameRun.created_at).where(GameRun.user_id==user['id'],GameRun.finished==True).order_by(GameRun.created_at.desc()).limit(10)).all()
        games=[dict(id=r.id,activity=r.activity,system=r.system,date=r.created_at.isoformat(),score=db.scalar(select(func.count()).select_from(GameAttempt).where(GameAttempt.run_id==r.id,GameAttempt.correct==True)),total=db.scalar(select(func.count()).select_from(GameAttempt).where(GameAttempt.run_id==r.id))) for r in runs]
        sessions=db.execute(select(QuizSession.id,QuizRoom.code).join(QuizRoom,QuizRoom.id==QuizSession.room_id).join(QuizParticipant,QuizParticipant.room_id==QuizRoom.id).where(QuizParticipant.user_id==user['id'],QuizSession.finished==True).order_by(QuizSession.created_at.desc()).limit(10)).all()
        quizzes=[dict(id=s.id,code=s.code,correct=db.scalar(select(func.count()).select_from(QuizAnswer).where(QuizAnswer.session_id==s.id,QuizAnswer.user_id==user['id'],QuizAnswer.correct==True)),answered=db.scalar(select(func.count()).select_from(QuizAnswer).where(QuizAnswer.session_id==s.id,QuizAnswer.user_id==user['id']))) for s in sessions]
    return dict(user=user,progress=progress,games=games,quizzes=quizzes,completed_games=completed_games)
