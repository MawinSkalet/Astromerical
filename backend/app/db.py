import os
from contextlib import contextmanager
from sqlalchemy import create_engine, event, URL, inspect
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from pymongo import MongoClient

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./zodiac.db')
if os.getenv('POSTGRES_HOST'):
    DATABASE_URL = URL.create('postgresql+psycopg',username=os.environ['POSTGRES_USER'],password=os.environ['POSTGRES_PASSWORD'],host=os.environ['POSTGRES_HOST'],database=os.getenv('POSTGRES_DB','zodiac'))
IS_SQLITE = str(DATABASE_URL).startswith('sqlite')
DEVELOPMENT = os.getenv('APP_ENV', 'development') == 'development'
engine = create_engine(DATABASE_URL, pool_pre_ping=True, hide_parameters=True, **({'connect_args': {'check_same_thread': False, 'timeout': 30}} if IS_SQLITE else {}))
if IS_SQLITE:
    @event.listens_for(engine, 'connect')
    def sqlite_constraints(connection, _):
        connection.execute('PRAGMA foreign_keys=ON')
        connection.execute('PRAGMA journal_mode=WAL')
SessionLocal = sessionmaker(engine, expire_on_commit=False)
class Base(DeclarativeBase): pass

@contextmanager
def transaction():
    with SessionLocal.begin() as db:
        yield db

mongo_client = MongoClient(os.environ['MONGO_URL'], serverSelectionTimeoutMS=3000) if os.getenv('MONGO_URL') else (MongoClient(host=os.environ['MONGO_HOST'],username=os.environ['MONGO_USER'],password=os.environ['MONGO_PASSWORD'],authSource='admin',serverSelectionTimeoutMS=3000) if os.getenv('MONGO_HOST') else None)
mongo = mongo_client[os.getenv('MONGO_DB','zodiac')] if mongo_client is not None else None

def create_schema():
    from . import models  # register mappings
    if not DEVELOPMENT and (IS_SQLITE or mongo is None):
        raise RuntimeError('Production requires PostgreSQL and MongoDB')
    # Baseline schema only; production upgrades follow the migration runbook.
    if DEVELOPMENT: Base.metadata.create_all(engine)
    elif not set(Base.metadata.tables).issubset(set(inspect(engine).get_table_names())): raise RuntimeError('Database schema is missing. Run alembic upgrade head.')
    if mongo is not None:
        mongo.command('ping')
        mongo.lesson_modules.create_index('slug', unique=True)
        mongo.question_bank.create_index([('system',1),('difficulty',1),('kind',1)])
