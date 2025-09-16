"""add username field

Revision ID: 005_add_username_field
Revises: 004_fix_swipe_trigger_to_create_matches
Create Date: 2024-01-15 20:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_add_username_field'
down_revision = '004_fix_swipe_trigger'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Adicionar campo username à tabela users
    op.add_column('users', sa.Column('username', sa.String(length=50), nullable=True))
    
    # Criar índice único para username
    op.create_unique_constraint('users_username_key', 'users', ['username'])
    
    # Criar índice para busca por username
    op.create_index('idx_users_username', 'users', ['username'], unique=False)


def downgrade() -> None:
    # Remover índice e constraint
    op.drop_index('idx_users_username', table_name='users')
    op.drop_constraint('users_username_key', 'users', type_='unique')
    
    # Remover coluna username
    op.drop_column('users', 'username')
