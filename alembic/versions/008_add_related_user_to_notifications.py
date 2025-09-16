"""Add related_user_id to notifications table

Revision ID: 008_add_related_user_to_notifications
Revises: 007_fix_duplicate_profile_views
Create Date: 2024-01-01 00:08:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '008_add_related_user_to_notifications'
down_revision = '007_fix_duplicate_profile_views'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Adicionar coluna related_user_id à tabela notifications
    op.add_column('notifications', sa.Column('related_user_id', sa.Integer(), nullable=True))
    
    # Adicionar foreign key constraint
    op.create_foreign_key(
        'fk_notifications_related_user',
        'notifications',
        'users',
        ['related_user_id'],
        ['user_id'],
        ondelete='SET NULL'
    )
    
    # Adicionar índice para melhor performance
    op.create_index('idx_notifications_related_user', 'notifications', ['related_user_id'], unique=False)


def downgrade() -> None:
    # Remover índice e constraint
    op.drop_index('idx_notifications_related_user', table_name='notifications')
    op.drop_constraint('fk_notifications_related_user', 'notifications', type_='foreignkey')
    op.drop_column('notifications', 'related_user_id')
