"""Fix duplicate profile views by adding unique constraint

Revision ID: 007_fix_duplicate_profile_views
Revises: 006_fix_profile_views_created_at
Create Date: 2024-01-01 00:07:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '007_fix_duplicate_views'
down_revision = '006_fix_profile_views'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Primeiro, remover visualizações duplicadas, mantendo apenas a mais recente
    op.execute("""
        DELETE FROM profile_views 
        WHERE view_id NOT IN (
            SELECT DISTINCT ON (viewer_id, viewed_id) view_id
            FROM profile_views
            ORDER BY viewer_id, viewed_id, created_at DESC
        )
    """)
    
    # Adicionar constraint única para evitar visualizações duplicadas
    op.create_unique_constraint(
        'uq_profile_views_viewer_viewed',
        'profile_views',
        ['viewer_id', 'viewed_id']
    )


def downgrade() -> None:
    # Remover constraint única
    op.drop_constraint('uq_profile_views_viewer_viewed', 'profile_views', type_='unique')
