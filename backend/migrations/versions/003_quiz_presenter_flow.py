"""Persist quiz phases and server-timed answer points without losing existing rooms."""
from alembic import op
import sqlalchemy as sa

revision='003_quiz_presenter_flow'
down_revision='002_room_session_reference'
branch_labels=None
depends_on=None

def upgrade():
    op.add_column('quiz_sessions',sa.Column('phase',sa.String(20),nullable=False,server_default='question'))
    op.add_column('quiz_sessions',sa.Column('starts_at',sa.Float(),nullable=False,server_default='0'))
    op.add_column('quiz_answers',sa.Column('points',sa.Integer(),nullable=False,server_default='0'))
    op.execute('UPDATE quiz_answers SET points = 1000 WHERE correct = true')
    op.execute('UPDATE quiz_sessions SET starts_at = ends_at - 20')

def downgrade():
    raise RuntimeError('Use a forward migration or restore a tested backup.')
