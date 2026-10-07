"""Idempotent, deterministic classroom data, never birth details or chat payloads."""
from uuid import uuid5, NAMESPACE_URL
from datetime import datetime,timezone,timedelta
from sqlalchemy import select,func
from pymongo import ReplaceOne
from .db import create_schema,transaction,mongo
from .models import User,LessonProgress,GameRun,GameAttempt
from .content import LESSONS,generated_bank,make_activity

def seed_id(value):return str(uuid5(NAMESPACE_URL,'zodiac-numerals-seed:'+value))

def seed():
    create_schema()
    if mongo is not None:
        mongo.lesson_modules.bulk_write([ReplaceOne({'slug':x['slug']},x|{'version':1},upsert=True) for x in LESSONS])
        mongo.question_bank.bulk_write([ReplaceOne({'id':x['id']},x,upsert=True) for x in generated_bank()])
        mongo.question_bank.create_index('id',unique=True)
    elif not __import__('os').getenv('APP_ENV','development')=='development':raise RuntimeError('MongoDB is required for production seeding.')
    with transaction() as db:
        for i in range(120):
            user_id=seed_id('student:'+str(i))
            if db.get(User,user_id):continue
            db.add(User(id=user_id,name=f'Classroom explorer {i+1:03}',guest=True,created_at=datetime(2026,1,1,tzinfo=timezone.utc)+timedelta(days=i)))
            db.flush()
            for j,lesson in enumerate(LESSONS):
                slide=(i+j)%len(lesson['slides'])
                db.add(LessonProgress(user_id=user_id,lesson_slug=lesson['slug'],slide=slide,completed=slide==len(lesson['slides'])-1))
            system=['roman','mayan','babylonian','thai'][i%4]
            run_id=seed_id('run:'+str(i));qs=make_activity('decode',system,['beginner','intermediate','advanced'][i%3],run_id)
            db.add(GameRun(id=run_id,user_id=user_id,activity='decode',system=system,difficulty=['beginner','intermediate','advanced'][i%3],questions=qs,finished=True,created_at=datetime(2026,5,1,tzinfo=timezone.utc)+timedelta(hours=i)))
            db.flush()
            for j,q in enumerate(qs):
                correct=(i+j)%5!=0
                answer=q['answer'] if correct else str(int(q['answer'])+1)
                db.add(GameAttempt(run_id=run_id,question_id=q['id'],answer=answer,correct=correct))
        db.flush()
        counts={m.__tablename__:db.scalar(select(func.count()).select_from(m)) for m in [User,LessonProgress,GameRun,GameAttempt]}
    print({'postgres_records':sum(counts.values()),'tables':counts,'mongo_documents':mongo.lesson_modules.count_documents({})+mongo.question_bank.count_documents({}) if mongo is not None else 'local curated content'})

if __name__=='__main__':seed()
