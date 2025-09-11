"""Migration inicial: criar todas as tabelas do sistema

Revision ID: 001_init
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_init'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Tabela de usuários
    op.create_table('users',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=150), nullable=False),
        sa.Column('password_hash', sa.Text(), nullable=False),
        sa.Column('fame_rating', sa.Integer(), nullable=True, default=0),
        sa.Column('is_verified', sa.Boolean(), nullable=True, default=False),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('user_id')
    )
    op.create_index('idx_users_email', 'users', ['email'], unique=False)
    op.create_index('idx_users_fame', 'users', ['fame_rating'], unique=False)
    op.create_unique_constraint('users_email_key', 'users', ['email'])

    # Tabela de perfis
    op.create_table('profiles',
        sa.Column('profile_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('sexual_pref', sa.String(length=20), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('avatar_url', sa.Text(), nullable=False),
        sa.Column('photo1_url', sa.Text(), nullable=True),
        sa.Column('photo2_url', sa.Text(), nullable=True),
        sa.Column('photo3_url', sa.Text(), nullable=True),
        sa.Column('photo4_url', sa.Text(), nullable=True),
        sa.Column('photo5_url', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('profile_id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('idx_profiles_location', 'profiles', ['latitude', 'longitude'], unique=False)
    op.create_check_constraint('profiles_age_check', 'profiles', 'age >= 18')

    # Tabela de preferências
    op.create_table('preferences',
        sa.Column('preference_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('preferred_gender', sa.String(length=20), nullable=True),
        sa.Column('age_min', sa.Integer(), nullable=True),
        sa.Column('age_max', sa.Integer(), nullable=True),
        sa.Column('max_distance_km', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('preference_id'),
        sa.UniqueConstraint('user_id')
    )

    # Tabela de tags
    op.create_table('tags',
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint('tag_id'),
        sa.UniqueConstraint('name')
    )

    # Tabela de tags do usuário
    op.create_table('user_tags',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.tag_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'tag_id')
    )

    # Tabela de visualizações de perfil
    op.create_table('profile_views',
        sa.Column('view_id', sa.Integer(), nullable=False),
        sa.Column('viewer_id', sa.Integer(), nullable=True),
        sa.Column('viewed_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['viewed_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['viewer_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('view_id')
    )
    op.create_index('idx_views_viewed', 'profile_views', ['viewed_id'], unique=False)

    # Tabela de swipes (likes/dislikes)
    op.create_table('swipes',
        sa.Column('swipe_id', sa.Integer(), nullable=False),
        sa.Column('swiper_id', sa.Integer(), nullable=True),
        sa.Column('swiped_id', sa.Integer(), nullable=True),
        sa.Column('direction', sa.String(length=10), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['swiped_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['swiper_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('swipe_id'),
        sa.UniqueConstraint('swiper_id', 'swiped_id')
    )
    op.create_index('idx_swipes_swiped', 'swipes', ['swiped_id'], unique=False)
    op.create_index('idx_swipes_swiper', 'swipes', ['swiper_id'], unique=False)
    op.create_check_constraint('swipes_direction_check', 'swipes', "direction IN ('like','dislike')")

    # Tabela de matches
    op.create_table('matches',
        sa.Column('match_id', sa.Integer(), nullable=False),
        sa.Column('user1_id', sa.Integer(), nullable=True),
        sa.Column('user2_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user1_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user2_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('match_id'),
        sa.UniqueConstraint('user1_id', 'user2_id')
    )
    op.create_index('idx_matches_users', 'matches', ['user1_id', 'user2_id'], unique=False)

    # Tabela de chats
    op.create_table('chats',
        sa.Column('chat_id', sa.Integer(), nullable=False),
        sa.Column('match_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['match_id'], ['matches.match_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('chat_id'),
        sa.UniqueConstraint('match_id')
    )

    # Tabela de mensagens
    op.create_table('messages',
        sa.Column('message_id', sa.Integer(), nullable=False),
        sa.Column('chat_id', sa.Integer(), nullable=True),
        sa.Column('sender_id', sa.Integer(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['chat_id'], ['chats.chat_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('message_id')
    )
    op.create_index('idx_messages_chat', 'messages', ['chat_id'], unique=False)

    # Tabela de notificações
    op.create_table('notifications',
        sa.Column('notification_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('type', sa.String(length=20), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('notification_id')
    )
    op.create_index('idx_notifications_user', 'notifications', ['user_id'], unique=False)
    op.create_check_constraint('notifications_type_check', 'notifications', "type IN ('like','view','message','match','unlike','system')")

    # Tabela de usuários bloqueados
    op.create_table('blocked_users',
        sa.Column('block_id', sa.Integer(), nullable=False),
        sa.Column('blocker_id', sa.Integer(), nullable=True),
        sa.Column('blocked_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['blocked_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['blocker_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('block_id'),
        sa.UniqueConstraint('blocker_id', 'blocked_id')
    )

    # Tabela de reports
    op.create_table('reports',
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('reporter_id', sa.Integer(), nullable=True),
        sa.Column('reported_id', sa.Integer(), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['reported_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('report_id')
    )

    # Tabela de verificação de email
    op.create_table('email_verifications',
        sa.Column('token', postgresql.UUID(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('token')
    )

    # Tabela de reset de senha
    op.create_table('password_resets',
        sa.Column('token', postgresql.UUID(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('token')
    )

    # Tabela de sessões
    op.create_table('sessions',
        sa.Column('session_id', postgresql.UUID(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('session_id')
    )
    op.create_index('idx_sessions_user', 'sessions', ['user_id'], unique=False)

    # Tabela de tokens JWT invalidados (para logout)
    op.create_table('blacklisted_tokens',
        sa.Column('token_id', sa.Integer(), nullable=False),
        sa.Column('token_jti', sa.String(length=255), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('token_id'),
        sa.UniqueConstraint('token_jti')
    )
    op.create_index('idx_blacklist_user', 'blacklisted_tokens', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_blacklist_user', table_name='blacklisted_tokens')
    op.drop_table('blacklisted_tokens')
    op.drop_index('idx_sessions_user', table_name='sessions')
    op.drop_table('sessions')
    op.drop_table('password_resets')
    op.drop_table('email_verifications')
    op.drop_table('reports')
    op.drop_table('blocked_users')
    op.drop_index('idx_notifications_user', table_name='notifications')
    op.drop_table('notifications')
    op.drop_index('idx_messages_chat', table_name='messages')
    op.drop_table('messages')
    op.drop_table('chats')
    op.drop_index('idx_matches_users', table_name='matches')
    op.drop_table('matches')
    op.drop_index('idx_swipes_swiper', table_name='swipes')
    op.drop_index('idx_swipes_swiped', table_name='swipes')
    op.drop_table('swipes')
    op.drop_index('idx_views_viewed', table_name='profile_views')
    op.drop_table('profile_views')
    op.drop_table('user_tags')
    op.drop_table('tags')
    op.drop_table('preferences')
    op.drop_index('idx_profiles_location', table_name='profiles')
    op.drop_table('profiles')
    op.drop_index('idx_users_fame', table_name='users')
    op.drop_index('idx_users_email', table_name='users')
    op.drop_table('users')
