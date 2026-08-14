"""Initial schema: accounts, tokens, profiles, sessions and the content bank

Revision ID: 77181a6710bb
Revises:
Create Date: 2026-08-14 01:08:51.006404

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

import app.orm  # UtcDateTime, referenced by the column definitions below

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "accounts",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("username", sa.String(length=254), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", app.orm.UtcDateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("accounts", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_accounts_username"), ["username"], unique=True)

    op.create_table(
        "content_meta",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("content_version", sa.String(length=128), nullable=False),
        sa.Column("generated_at", sa.String(length=64), nullable=False),
        sa.Column("sources", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "entities",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("scope", sa.String(length=16), nullable=True),
        sa.Column("region", sa.String(length=64), nullable=True),
        sa.Column("geometry_id", sa.String(length=16), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("entities", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_entities_name"), ["name"], unique=False)
        batch_op.create_index(batch_op.f("ix_entities_scope"), ["scope"], unique=False)
        batch_op.create_index(batch_op.f("ix_entities_type"), ["type"], unique=False)

    op.create_table(
        "profiles",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("account_id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=24), nullable=False),
        sa.Column("avatar", sa.String(length=16), nullable=False),
        sa.Column("level", sa.Float(), nullable=False),
        sa.Column("best_sustained_level", sa.Float(), nullable=False),
        sa.Column("last_session_end_level", sa.Float(), nullable=False),
        sa.Column("created_at", app.orm.UtcDateTime(timezone=True), nullable=False),
        sa.Column("pin_hash", sa.String(length=255), nullable=True),
        sa.Column("answered", sa.Integer(), nullable=False),
        sa.Column("correct", sa.Integer(), nullable=False),
        sa.Column("streak_days", sa.Integer(), nullable=False),
        sa.Column("mastery", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("profiles", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_profiles_account_id"), ["account_id"], unique=False)

    op.create_table(
        "questions",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.String(length=64), nullable=False),
        sa.Column("format", sa.String(length=32), nullable=False),
        sa.Column("level", sa.Float(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("topic", sa.String(length=32), nullable=True),
        sa.Column("scope", sa.String(length=16), nullable=True),
        sa.Column("entity_type", sa.String(length=32), nullable=True),
        sa.Column("region", sa.String(length=64), nullable=True),
        sa.Column("age_band", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["entity_id"], ["entities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("questions", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_questions_entity_id"), ["entity_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_questions_format"), ["format"], unique=False)
        batch_op.create_index(batch_op.f("ix_questions_level"), ["level"], unique=False)
        batch_op.create_index(batch_op.f("ix_questions_scope"), ["scope"], unique=False)
        batch_op.create_index(batch_op.f("ix_questions_topic"), ["topic"], unique=False)
        batch_op.create_index("ix_questions_topic_level", ["topic", "level"], unique=False)

    op.create_table(
        "tokens",
        sa.Column("digest", sa.String(length=64), nullable=False),
        sa.Column("account_id", sa.String(length=64), nullable=False),
        sa.Column("expires_at", app.orm.UtcDateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("digest"),
    )
    with op.batch_alter_table("tokens", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_tokens_account_id"), ["account_id"], unique=False)

    op.create_table(
        "review_queue",
        sa.Column("entity_id", sa.String(length=64), nullable=False),
        sa.Column("added_at", app.orm.UtcDateTime(timezone=True), nullable=False),
        sa.Column("clean_passes", sa.Integer(), nullable=False),
        sa.Column("seq", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("profile_id", sa.String(length=64), nullable=True),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("seq"),
    )
    with op.batch_alter_table("review_queue", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_review_queue_profile_id"), ["profile_id"], unique=False
        )

    op.create_table(
        "sessions",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("profile_id", sa.String(length=64), nullable=False),
        sa.Column("account_id", sa.String(length=64), nullable=False),
        sa.Column("topic", sa.String(length=32), nullable=False),
        sa.Column("level", sa.Float(), nullable=False),
        sa.Column("started_at", app.orm.UtcDateTime(timezone=True), nullable=False),
        sa.Column("state", sa.String(length=16), nullable=False),
        sa.Column("ended_at", app.orm.UtcDateTime(timezone=True), nullable=True),
        sa.Column("answered", sa.Integer(), nullable=False),
        sa.Column("correct", sa.Integer(), nullable=False),
        sa.Column("wrong", sa.Integer(), nullable=False),
        sa.Column("correct_streak", sa.Integer(), nullable=False),
        sa.Column("wrong_streak", sa.Integer(), nullable=False),
        sa.Column("asked_question_ids", sa.JSON(), nullable=False),
        sa.Column("seen_entity_ids", sa.JSON(), nullable=False),
        sa.Column("learned_entity_ids", sa.JSON(), nullable=False),
        sa.Column("review_round_remaining", sa.Integer(), nullable=False),
        sa.Column("last_answer_wrong", sa.Boolean(), nullable=False),
        sa.Column("review_offered", sa.Boolean(), nullable=False),
        sa.Column("pending_question_id", sa.String(length=64), nullable=True),
        sa.Column("pending_index", sa.Integer(), nullable=True),
        sa.Column("pending_is_review", sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("sessions", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_sessions_account_id"), ["account_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_sessions_profile_id"), ["profile_id"], unique=False)

    op.create_table(
        "answers",
        sa.Column("seq", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("session_id", sa.String(length=64), nullable=False),
        sa.Column("question_id", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.String(length=64), nullable=False),
        sa.Column("correct", sa.Boolean(), nullable=False),
        sa.Column("answered_at", app.orm.UtcDateTime(timezone=True), nullable=False),
        sa.Column("is_review", sa.Boolean(), nullable=False),
        sa.Column("profile_before", sa.JSON(), nullable=False),
        sa.Column("session_before", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("seq"),
    )
    with op.batch_alter_table("answers", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_answers_id"), ["id"], unique=True)
        batch_op.create_index(batch_op.f("ix_answers_session_id"), ["session_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("answers", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_answers_session_id"))
        batch_op.drop_index(batch_op.f("ix_answers_id"))

    op.drop_table("answers")
    with op.batch_alter_table("sessions", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_sessions_profile_id"))
        batch_op.drop_index(batch_op.f("ix_sessions_account_id"))

    op.drop_table("sessions")
    with op.batch_alter_table("review_queue", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_review_queue_profile_id"))

    op.drop_table("review_queue")
    with op.batch_alter_table("tokens", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_tokens_account_id"))

    op.drop_table("tokens")
    with op.batch_alter_table("questions", schema=None) as batch_op:
        batch_op.drop_index("ix_questions_topic_level")
        batch_op.drop_index(batch_op.f("ix_questions_topic"))
        batch_op.drop_index(batch_op.f("ix_questions_scope"))
        batch_op.drop_index(batch_op.f("ix_questions_level"))
        batch_op.drop_index(batch_op.f("ix_questions_format"))
        batch_op.drop_index(batch_op.f("ix_questions_entity_id"))

    op.drop_table("questions")
    with op.batch_alter_table("profiles", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_profiles_account_id"))

    op.drop_table("profiles")
    with op.batch_alter_table("entities", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_entities_type"))
        batch_op.drop_index(batch_op.f("ix_entities_scope"))
        batch_op.drop_index(batch_op.f("ix_entities_name"))

    op.drop_table("entities")
    op.drop_table("content_meta")
    with op.batch_alter_table("accounts", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_accounts_username"))

    op.drop_table("accounts")
