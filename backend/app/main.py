import os, asyncio, contextlib, time
from pathlib import Path
from contextlib import asynccontextmanager
from collections import defaultdict,deque
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from pymongo.errors import PyMongoError

# Local Uvicorn runs read the ignored project-root .env file. Compose/production
# injects its environment directly and does not load a repository .env file.
if os.getenv('APP_ENV','development')!='production':
    load_dotenv(Path(__file__).resolve().parents[2]/'.env',override=False)

from . import auth, learning, games, astrology, quiz, tutor
from .db import create_schema, engine, mongo, DEVELOPMENT

ALLOWED_ORIGINS=os.getenv('ALLOWED_ORIGINS','http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080').split(',')

@asynccontextmanager
async def lifespan(app):
    create_schema()
    task=asyncio.create_task(quiz.tick())
    yield
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):await task

app=FastAPI(title='Zodiac & Numerals API',version='1.0.0',description='Lesson, practice, chart and authoritative four-team quiz API. Birth inputs and tutor messages are transient.',lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=ALLOWED_ORIGINS,allow_credentials=True,allow_methods=['GET','POST','PUT'],allow_headers=['Content-Type'])
rate_windows=defaultdict(deque)

@app.middleware('http')
async def privacy_and_limits(request:Request,call_next):
    if request.method in ('POST','PUT'):
        origin=request.headers.get('origin')
        if origin and origin not in ALLOWED_ORIGINS:return JSONResponse({'detail':'Origin is not permitted.'},status_code=403)
        # Do not inspect bodies. Memory contains only an IP bucket and timestamps.
        key=(request.client.host if request.client else 'local',request.url.path.split('/')[2] if len(request.url.path.split('/'))>2 else '')
        window=rate_windows[key];now=time.monotonic()
        while window and window[0]<now-60:window.popleft()
        limit=60 if key[1]=='auth' else 30 if key[1] in ('tutor','astrology') else 600
        if len(window)>=limit:return JSONResponse({'detail':'Too many requests. Please wait a minute and try again.'},status_code=429)
        window.append(now)
    response=await call_next(request)
    response.headers['Cache-Control']='no-store'
    response.headers['X-Content-Type-Options']='nosniff'
    response.headers['Referrer-Policy']='no-referrer'
    return response

@app.exception_handler(RequestValidationError)
async def validation_error(request,exc):
    # Pydantic's default includes input values. Return field names and messages only.
    return JSONResponse(status_code=422,content={'detail':'; '.join('.'.join(str(x) for x in e['loc'][1:])+': '+e['msg'] for e in exc.errors())})

@app.exception_handler(SQLAlchemyError)
async def relational_error(request,exc):return JSONResponse(status_code=503,content={'detail':'The progress and quiz database is unavailable. Please try again.'})

@app.exception_handler(PyMongoError)
async def content_error(request,exc):return JSONResponse(status_code=503,content={'detail':'The learning content database is unavailable. Please try again.'})

@app.get('/api/health',tags=['Operations'])
def health():
    with engine.connect() as connection:connection.execute(text('SELECT 1'))
    if mongo is not None:mongo.command('ping')
    return {'status':'ok','storage':'sqlite + curated content (local development)' if DEVELOPMENT and mongo is None else 'postgresql + mongodb','tutor':'ai' if os.getenv('AI_PROVIDER_KEY') or os.getenv('OPENROUTER_API_KEY') else 'course-guide'}

for router in [auth.router,learning.router,games.router,astrology.router,quiz.router,tutor.router]:app.include_router(router)
