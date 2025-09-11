"""Fix ambiguous column error in fame rating function

Revision ID: 003_fix_ambiguous_column
Revises: 002_fame_rating
Create Date: 2024-01-01 00:02:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_fix_ambiguous_column'
down_revision = '002_fame_rating'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Primeiro dropar a função existente
    op.execute("DROP FUNCTION IF EXISTS update_fame_rating(integer);")
    
    # Corrigir a função update_fame_rating para evitar ambiguidade de coluna
    op.execute("""
    CREATE OR REPLACE FUNCTION update_fame_rating(p_user_id INT) RETURNS VOID AS $$
    DECLARE
        likes_count INT;
        matches_count INT;
        views_count INT;
        reports_count INT;
        blocks_count INT;
        completion_bonus INT := 0;
        fame INT;
    BEGIN
        -- contagem de likes recebidos
        SELECT COUNT(*) INTO likes_count
        FROM swipes WHERE swiped_id = p_user_id AND direction = 'like';

        -- contagem de matches
        SELECT COUNT(*) INTO matches_count
        FROM matches WHERE user1_id = p_user_id OR user2_id = p_user_id;

        -- contagem de views
        SELECT COUNT(*) INTO views_count
        FROM profile_views WHERE viewed_id = p_user_id;

        -- penalidades
        SELECT COUNT(*) INTO reports_count
        FROM reports WHERE reported_id = p_user_id;

        SELECT COUNT(*) INTO blocks_count
        FROM blocked_users WHERE blocked_id = p_user_id;

        -- bônus se perfil está mais completo (avatar + bio + 2+ fotos)
        SELECT CASE WHEN avatar_url IS NOT NULL AND bio IS NOT NULL 
                         AND (photo1_url IS NOT NULL OR photo2_url IS NOT NULL) 
                    THEN 1 ELSE 0 END
        INTO completion_bonus
        FROM profiles WHERE user_id = p_user_id;

        -- fórmula de fame
        fame := (likes_count * 1) + (matches_count * 3) + (views_count / 2)
                - (reports_count * 5) - (blocks_count * 2)
                + (completion_bonus * 5);

        -- normaliza para >= 0
        IF fame < 0 THEN
            fame := 0;
        END IF;

        -- atualiza usuário
        UPDATE users SET fame_rating = fame WHERE users.user_id = p_user_id;
    END;
    $$ LANGUAGE plpgsql;
    """)


def downgrade() -> None:
    # Reverter para a versão anterior da função
    op.execute("""
    CREATE OR REPLACE FUNCTION update_fame_rating(user_id INT) RETURNS VOID AS $$
    DECLARE
        likes_count INT;
        matches_count INT;
        views_count INT;
        reports_count INT;
        blocks_count INT;
        completion_bonus INT := 0;
        fame INT;
    BEGIN
        -- contagem de likes recebidos
        SELECT COUNT(*) INTO likes_count
        FROM swipes WHERE swiped_id = user_id AND direction = 'like';

        -- contagem de matches
        SELECT COUNT(*) INTO matches_count
        FROM matches WHERE user1_id = user_id OR user2_id = user_id;

        -- contagem de views
        SELECT COUNT(*) INTO views_count
        FROM profile_views WHERE viewed_id = user_id;

        -- penalidades
        SELECT COUNT(*) INTO reports_count
        FROM reports WHERE reported_id = user_id;

        SELECT COUNT(*) INTO blocks_count
        FROM blocked_users WHERE blocked_id = user_id;

        -- bônus se perfil está mais completo (avatar + bio + 2+ fotos)
        SELECT CASE WHEN avatar_url IS NOT NULL AND bio IS NOT NULL 
                         AND (photo1_url IS NOT NULL OR photo2_url IS NOT NULL) 
                    THEN 1 ELSE 0 END
        INTO completion_bonus
        FROM profiles WHERE user_id = user_id;

        -- fórmula de fame
        fame := (likes_count * 1) + (matches_count * 3) + (views_count / 2)
                - (reports_count * 5) - (blocks_count * 2)
                + (completion_bonus * 5);

        -- normaliza para >= 0
        IF fame < 0 THEN
            fame := 0;
        END IF;

        -- atualiza usuário
        UPDATE users SET fame_rating = fame WHERE users.user_id = user_id;
    END;
    $$ LANGUAGE plpgsql;
    """)
