"""Add the active room's session foreign key where absent."""
from alembic import op
from sqlalchemy import inspect
revision='002_room_session_reference'
down_revision='001_baseline'
branch_labels=None
depends_on=None
def upgrade():
    bind=op.get_bind()
    if bind.dialect.name=='postgresql':
        names={fk['name'] for fk in inspect(bind).get_foreign_keys('quiz_rooms')}
        if 'fk_room_active_session' not in names:
            op.create_foreign_key('fk_room_active_session','quiz_rooms','quiz_sessions',['session_id'],['id'])
def downgrade():raise RuntimeError('Use an additive forward migration or restore a tested backup.')
