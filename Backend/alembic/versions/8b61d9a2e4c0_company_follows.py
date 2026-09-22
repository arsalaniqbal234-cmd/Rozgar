"""Add company follows and durable company alert deliveries.

Revision ID: 8b61d9a2e4c0
Revises: 3f4d2c1b0a98
"""
from alembic import op
import sqlalchemy as sa

revision = "8b61d9a2e4c0"
down_revision = "3f4d2c1b0a98"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "company_follows",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("company_name", sa.String(200), nullable=False),
        sa.Column("company_key", sa.String(200), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("followed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("last_notified_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("user_id", "company_key", name="uq_company_follow_user_key"),
    )
    op.create_index("ix_company_follows_user_id", "company_follows", ["user_id"])
    op.create_index("ix_company_follows_company_key", "company_follows", ["company_key"])
    op.create_table(
        "company_alert_deliveries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("follow_id", sa.Integer(), sa.ForeignKey("company_follows.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("first_attempt_at", sa.DateTime(timezone=True)),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True)),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column("provider_id", sa.String()),
        sa.UniqueConstraint("follow_id", "job_id", name="uq_company_alert_follow_job"),
    )
    op.create_index("ix_company_alert_deliveries_follow_id", "company_alert_deliveries", ["follow_id"])
    op.create_index("ix_company_alert_deliveries_due", "company_alert_deliveries", ["status", "next_attempt_at"])
    op.create_index("ix_jobs_company_created_at", "jobs", [sa.text("lower(btrim(company))"), "created_at"])


def downgrade():
    op.drop_index("ix_jobs_company_created_at", table_name="jobs")
    op.drop_index("ix_company_alert_deliveries_due", table_name="company_alert_deliveries")
    op.drop_index("ix_company_alert_deliveries_follow_id", table_name="company_alert_deliveries")
    op.drop_table("company_alert_deliveries")
    op.drop_index("ix_company_follows_company_key", table_name="company_follows")
    op.drop_index("ix_company_follows_user_id", table_name="company_follows")
    op.drop_table("company_follows")
