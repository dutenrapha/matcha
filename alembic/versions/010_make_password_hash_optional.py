"""make password_hash optional for google users

Revision ID: 010_make_password_hash_optional
Revises: 009_update_existing_notifications
Create Date: 2025-09-16 19:50:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '010_make_password_hash_optional'
down_revision = '009_update_existing_notifications'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Tornar a coluna password_hash opcional (nullable=True)
    # Isso permite que usuários do Google não tenham senha
    op.alter_column('users', 'password_hash',
                    existing_type=sa.Text(),
                    nullable=True)


def downgrade() -> None:
    # Reverter para nullable=False
    # ATENÇÃO: Isso pode falhar se houver usuários com password_hash nulo
    op.alter_column('users', 'password_hash',
                    existing_type=sa.Text(),
                    nullable=False)
