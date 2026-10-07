import os
from pathlib import Path
import pytest

Path('tmp').mkdir(exist_ok=True)
os.environ['DATABASE_URL']='sqlite:///./tmp/test-zodiac.db'
os.environ['APP_ENV']='development'
os.environ['PYTHON_DOTENV_DISABLED']='1'
for key in ['POSTGRES_HOST','MONGO_HOST','MONGO_URL','AI_PROVIDER_KEY','OPENROUTER_API_KEY']: os.environ.pop(key,None)

from app.db import Base, engine
from sqlalchemy import inspect,update
from app.models import QuizRoom
from app.main import app,rate_windows
from fastapi.testclient import TestClient

@pytest.fixture(autouse=True)
def isolated_database():
    # Break the intentional room/session cycle in this disposable test database.
    if 'quiz_rooms' in inspect(engine).get_table_names():
        with engine.begin() as connection:connection.execute(update(QuizRoom).values(session_id=None))
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    rate_windows.clear()
    yield

@pytest.fixture
def client():
    with TestClient(app) as c:yield c

def guest(client,name='Test explorer'):
    r=client.post('/api/auth/guest',json={'name':name});assert r.status_code==200,r.text;return r.json()
