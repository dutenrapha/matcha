"""Update existing notifications with related_user_id

Revision ID: 009_update_existing_notifications
Revises: 008_add_related_user
Create Date: 2024-01-01 00:09:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '009_update_existing_notifications'
down_revision = '008_add_related_user'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Atualizar notificações de visualização existentes
    op.execute("""
        UPDATE notifications 
        SET related_user_id = (
            SELECT pv.viewer_id 
            FROM profile_views pv 
            JOIN users u ON u.user_id = pv.viewer_id 
            WHERE pv.viewed_id = notifications.user_id 
            AND notifications.content LIKE '%' || u.name || '%'
            AND notifications.type = 'view'
            ORDER BY pv.created_at DESC 
            LIMIT 1
        )
        WHERE notifications.type = 'view' 
        AND notifications.related_user_id IS NULL
    """)
    
    # Atualizar notificações de like existentes
    op.execute("""
        UPDATE notifications 
        SET related_user_id = (
            SELECT s.swiper_id 
            FROM swipes s 
            JOIN users u ON u.user_id = s.swiper_id 
            WHERE s.swiped_id = notifications.user_id 
            AND notifications.content LIKE '%' || u.name || '%'
            AND notifications.type = 'like'
            AND s.direction = 'like'
            ORDER BY s.created_at DESC 
            LIMIT 1
        )
        WHERE notifications.type = 'like' 
        AND notifications.related_user_id IS NULL
    """)
    
    # Atualizar notificações de match existentes
    op.execute("""
        UPDATE notifications 
        SET related_user_id = (
            SELECT CASE 
                WHEN m.user1_id = notifications.user_id THEN m.user2_id
                ELSE m.user1_id
            END
            FROM matches m 
            JOIN users u ON u.user_id = CASE 
                WHEN m.user1_id = notifications.user_id THEN m.user2_id
                ELSE m.user1_id
            END
            WHERE (m.user1_id = notifications.user_id OR m.user2_id = notifications.user_id)
            AND notifications.content LIKE '%' || u.name || '%'
            AND notifications.type = 'match'
            ORDER BY m.created_at DESC 
            LIMIT 1
        )
        WHERE notifications.type = 'match' 
        AND notifications.related_user_id IS NULL
    """)


def downgrade() -> None:
    # Não há como reverter esta mudança de forma segura
    pass
