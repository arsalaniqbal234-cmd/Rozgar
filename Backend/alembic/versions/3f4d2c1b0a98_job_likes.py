"""Store one like per user and job.

Revision ID: 3f4d2c1b0a98
Revises: 7a01_week7
"""
from alembic import op
import sqlalchemy as sa

revision = "3f4d2c1b0a98"
down_revision = "7a01_week7"
branch_labels = None
depends_on = None


def upgrade():
    if sa.inspect(op.get_bind()).has_table("job_likes"):
        return
    op.create_table(
        "job_likes",
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", sa.String(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("job_likes")
