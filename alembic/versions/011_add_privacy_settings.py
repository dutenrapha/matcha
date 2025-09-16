"""Add privacy settings for location sharing

Revision ID: 011
Revises: 010_make_password_hash_optional
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '011'
down_revision = '010_password_optional'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add privacy settings to profiles table
    op.add_column('profiles', sa.Column('location_visible', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('profiles', sa.Column('show_exact_location', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('profiles', sa.Column('location_precision', sa.Integer(), nullable=False, server_default='1'))
    
    # Add index for location visibility queries
    op.create_index('idx_profiles_location_visible', 'profiles', ['location_visible'], unique=False)


def downgrade() -> None:
    # Remove privacy settings
    op.drop_index('idx_profiles_location_visible', table_name='profiles')
    op.drop_column('profiles', 'location_precision')
    op.drop_column('profiles', 'show_exact_location')
    op.drop_column('profiles', 'location_visible')
