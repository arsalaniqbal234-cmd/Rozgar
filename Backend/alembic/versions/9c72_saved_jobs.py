"""Persist account shortlists independently from saved searches."""
from alembic import op
import sqlalchemy as sa

revision = "9c72_saved_jobs"
down_revision = "8b61d9a2e4c0"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "saved_jobs",
        sa.Column("user_id", sa.String(), primary_key=True),
        sa.Column("source_id", sa.String(300), primary_key=True),
        sa.Column("job_id", sa.Integer(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.UniqueConstraint("user_id", "job_id", name="uq_saved_job_user_id"),
    )


def downgrade():
    op.drop_table("saved_jobs")
