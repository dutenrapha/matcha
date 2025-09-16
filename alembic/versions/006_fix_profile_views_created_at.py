"""Fix profile_views created_at field

Revision ID: 006_fix_profile_views_created_at
Revises: 005_add_username_field
Create Date: 2024-01-01 00:06:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '006_fix_profile_views'
down_revision = '005_add_username_field'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Atualizar registros existentes que têm created_at como NULL
    op.execute("""
        UPDATE profile_views 
        SET created_at = NOW() - INTERVAL '1 day' * (view_id % 30)
        WHERE created_at IS NULL
    """)


def downgrade() -> None:
    # Não há como reverter esta mudança de forma segura
    pass
