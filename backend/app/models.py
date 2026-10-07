from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, UniqueConstraint, CheckConstraint, DateTime, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base

def now(): return datetime.now(timezone.utc)

class User(Base):
    __tablename__='users'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(60))
    email: Mapped[str | None] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str | None] = mapped_column(String(256))
    guest: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class AuthSession(Base):
    __tablename__='auth_sessions'
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    expires_at: Mapped[float] = mapped_column(Float)

class LessonProgress(Base):
    __tablename__='lesson_progress'
    __table_args__=(UniqueConstraint('user_id','lesson_slug'),CheckConstraint('slide >= 0'))
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    lesson_slug: Mapped[str] = mapped_column(String(50), index=True)
    slide: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)

class GameRun(Base):
    __tablename__='game_runs'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    activity: Mapped[str] = mapped_column(String(20))
    system: Mapped[str] = mapped_column(String(20))
    difficulty: Mapped[str] = mapped_column(String(20))
    questions: Mapped[list] = mapped_column(JSON)
    finished: Mapped[bool] = mapped_column(Boolean,default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),default=now)

class GameAttempt(Base):
    __tablename__='game_attempts'
    __table_args__=(UniqueConstraint('run_id','question_id'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    run_id: Mapped[str] = mapped_column(ForeignKey('game_runs.id'),index=True)
    question_id: Mapped[str] = mapped_column(String(80))
    answer: Mapped[str] = mapped_column(String(120))
    correct: Mapped[bool] = mapped_column(Boolean)

class QuizRoom(Base):
    __tablename__='quiz_rooms'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    code: Mapped[str] = mapped_column(String(6),unique=True,index=True)
    host_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    status: Mapped[str] = mapped_column(String(20),default='lobby')
    session_id: Mapped[str | None] = mapped_column(ForeignKey('quiz_sessions.id',name='fk_room_active_session',use_alter=True),nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),default=now)

class QuizSession(Base):
    __tablename__='quiz_sessions'
    id: Mapped[str] = mapped_column(String(36),primary_key=True)
    room_id: Mapped[str] = mapped_column(ForeignKey('quiz_rooms.id'),index=True)
    current_question: Mapped[int] = mapped_column(Integer,default=0)
    ends_at: Mapped[float] = mapped_column(Float)
    phase: Mapped[str] = mapped_column(String(20),default='preview',server_default='question')
    starts_at: Mapped[float] = mapped_column(Float,default=0,server_default='0')
    finished: Mapped[bool] = mapped_column(Boolean,default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),default=now)

class QuizTeam(Base):
    __tablename__='quiz_teams'
    __table_args__=(UniqueConstraint('room_id','letter'),CheckConstraint('locked_size >= 0'))
    id: Mapped[str] = mapped_column(String(36),primary_key=True)
    room_id: Mapped[str] = mapped_column(ForeignKey('quiz_rooms.id'),index=True)
    letter: Mapped[str] = mapped_column(String(1))
    locked_size: Mapped[int] = mapped_column(Integer,default=0)

class QuizParticipant(Base):
    __tablename__='quiz_participants'
    __table_args__=(UniqueConstraint('room_id','user_id'),)
    id: Mapped[str] = mapped_column(String(36),primary_key=True)
    room_id: Mapped[str] = mapped_column(ForeignKey('quiz_rooms.id'),index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'),index=True)
    team_id: Mapped[str] = mapped_column(ForeignKey('quiz_teams.id'),index=True)
    ready: Mapped[bool] = mapped_column(Boolean,default=False)
    locked: Mapped[bool] = mapped_column(Boolean,default=False)

class SessionQuestion(Base):
    __tablename__='session_questions'
    __table_args__=(UniqueConstraint('session_id','position'),)
    id: Mapped[str] = mapped_column(String(36),primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey('quiz_sessions.id'),index=True)
    position: Mapped[int] = mapped_column(Integer)
    snapshot: Mapped[dict] = mapped_column(JSON)

class QuizAnswer(Base):
    __tablename__='quiz_answers'
    __table_args__=(UniqueConstraint('session_id','question_id','user_id',name='one_answer_per_player'),Index('ix_answers_team_session','team_id','session_id'))
    id: Mapped[str] = mapped_column(String(36),primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey('quiz_sessions.id'),index=True)
    question_id: Mapped[str] = mapped_column(ForeignKey('session_questions.id'),index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'),index=True)
    team_id: Mapped[str] = mapped_column(ForeignKey('quiz_teams.id'))
    answer: Mapped[str] = mapped_column(String(120))
    correct: Mapped[bool] = mapped_column(Boolean)
    submitted_at: Mapped[float] = mapped_column(Float)
    points: Mapped[int] = mapped_column(Integer,default=0,server_default='0')

class TeamScore(Base):
    __tablename__='team_scores'
    __table_args__=(UniqueConstraint('session_id','team_id'),CheckConstraint('correct >= 0'))
    id: Mapped[str] = mapped_column(String(36),primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey('quiz_sessions.id'),index=True)
    team_id: Mapped[str] = mapped_column(ForeignKey('quiz_teams.id'),index=True)
    correct: Mapped[int] = mapped_column(Integer,default=0)
