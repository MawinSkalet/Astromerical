import hashlib, hmac, os, secrets, time, uuid
from fastapi import APIRouter, Cookie, HTTPException, Response, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from .db import transaction
from .models import User, AuthSession

router=APIRouter(prefix='/api/auth',tags=['Auth'])
class GuestInput(BaseModel): name: str = Field(default='Curious explorer',min_length=1,max_length=60)
class Credentials(GuestInput):
    email: str = Field(min_length=3,max_length=254,pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    password: str = Field(min_length=8,max_length=128)

def password_hash(password,salt=None):
    salt=salt or secrets.token_hex(16)
    return salt+':'+hashlib.scrypt(password.encode(),salt=salt.encode(),n=16384,r=8,p=1).hex()

def issue_session(db,user,response):
    token=secrets.token_urlsafe(32)
    db.add(AuthSession(token_hash=hashlib.sha256(token.encode()).hexdigest(),user_id=user.id,expires_at=time.time()+86400*30))
    response.set_cookie('zodiac_session',token,httponly=True,secure=os.getenv('COOKIE_SECURE','false').lower()=='true',samesite='lax',max_age=86400*30,path='/')
    return dict(id=user.id,name=user.name,guest=user.guest)

def user_from_token(token):
    if not token: raise HTTPException(401,'Sign in or continue as a guest to begin.')
    with transaction() as db:
        session=db.get(AuthSession,hashlib.sha256(token.encode()).hexdigest())
        if not session or session.expires_at<time.time(): raise HTTPException(401,'Your session has expired. Please sign in again.')
        user=db.get(User,session.user_id)
        return dict(id=user.id,name=user.name,guest=user.guest)

def current_user(zodiac_session: str | None = Cookie(default=None)): return user_from_token(zodiac_session)

@router.post('/guest')
def guest(data:GuestInput,response:Response):
    with transaction() as db:
        user=User(id=str(uuid.uuid4()),name=data.name.strip() or 'Explorer',guest=True)
        db.add(user); db.flush()
        return issue_session(db,user,response)

@router.post('/register')
def register(data:Credentials,response:Response):
    with transaction() as db:
        if db.scalar(select(User.id).where(User.email==data.email.lower())): raise HTTPException(409,'That email already has an account. Please sign in.')
        user=User(id=str(uuid.uuid4()),name=data.name.strip() or 'Explorer',email=data.email.lower(),password_hash=password_hash(data.password),guest=False)
        db.add(user); db.flush()
        return issue_session(db,user,response)

@router.post('/login')
def login(data:Credentials,response:Response):
    with transaction() as db:
        user=db.scalar(select(User).where(User.email==data.email.lower()))
        if not user or not user.password_hash or not hmac.compare_digest(password_hash(data.password,user.password_hash.split(':')[0]),user.password_hash): raise HTTPException(401,'Email or password is incorrect.')
        return issue_session(db,user,response)

@router.get('/me')
def me(user=Depends(current_user)): return user

@router.post('/logout')
def logout(response:Response,zodiac_session:str|None=Cookie(default=None)):
    with transaction() as db:
        if zodiac_session:
            row=db.get(AuthSession,hashlib.sha256(zodiac_session.encode()).hexdigest())
            if row: db.delete(row)
    response.delete_cookie('zodiac_session',path='/')
    return {'ok':True}
