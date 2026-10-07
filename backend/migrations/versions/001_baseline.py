"""Initial normalized schema. This migration is additive only.

The frozen metadata is independent of application model changes.
"""
from alembic import op
from migrations.baseline_schema import Base
revision='001_baseline'
down_revision=None
branch_labels=None
depends_on=None
def upgrade(): Base.metadata.create_all(bind=op.get_bind())
def downgrade(): raise RuntimeError('Destructive automatic downgrades are disabled. Restore a tested backup instead.')
