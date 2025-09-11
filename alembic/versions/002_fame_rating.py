"""Migration para sistema de fame rating com triggers

Revision ID: 002_fame_rating
Revises: 001_init
Create Date: 2024-01-01 00:01:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_fame_rating'
down_revision = '001_init'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Função para atualizar fame rating
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

    # Triggers em eventos
    # Quando alguém dá um swipe (like)
    op.execute("""
    CREATE OR REPLACE FUNCTION trigger_swipe_update() RETURNS TRIGGER AS $$
    BEGIN
        PERFORM update_fame_rating(NEW.swiped_id);
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    CREATE TRIGGER trg_swipe_update
    AFTER INSERT ON swipes
    FOR EACH ROW EXECUTE FUNCTION trigger_swipe_update();
    """)

    # Quando ocorre um match
    op.execute("""
    CREATE OR REPLACE FUNCTION trigger_match_update() RETURNS TRIGGER AS $$
    BEGIN
        PERFORM update_fame_rating(NEW.user1_id);
        PERFORM update_fame_rating(NEW.user2_id);
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    CREATE TRIGGER trg_match_update
    AFTER INSERT ON matches
    FOR EACH ROW EXECUTE FUNCTION trigger_match_update();
    """)

    # Quando alguém visualiza perfil
    op.execute("""
    CREATE OR REPLACE FUNCTION trigger_view_update() RETURNS TRIGGER AS $$
    BEGIN
        PERFORM update_fame_rating(NEW.viewed_id);
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    CREATE TRIGGER trg_view_update
    AFTER INSERT ON profile_views
    FOR EACH ROW EXECUTE FUNCTION trigger_view_update();
    """)

    # Quando há report
    op.execute("""
    CREATE OR REPLACE FUNCTION trigger_report_update() RETURNS TRIGGER AS $$
    BEGIN
        PERFORM update_fame_rating(NEW.reported_id);
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    CREATE TRIGGER trg_report_update
    AFTER INSERT ON reports
    FOR EACH ROW EXECUTE FUNCTION trigger_report_update();
    """)

    # Quando há block
    op.execute("""
    CREATE OR REPLACE FUNCTION trigger_block_update() RETURNS TRIGGER AS $$
    BEGIN
        PERFORM update_fame_rating(NEW.blocked_id);
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    CREATE TRIGGER trg_block_update
    AFTER INSERT ON blocked_users
    FOR EACH ROW EXECUTE FUNCTION trigger_block_update();
    """)


def downgrade() -> None:
    # Remover triggers
    op.execute("DROP TRIGGER IF EXISTS trg_block_update ON blocked_users;")
    op.execute("DROP TRIGGER IF EXISTS trg_report_update ON reports;")
    op.execute("DROP TRIGGER IF EXISTS trg_view_update ON profile_views;")
    op.execute("DROP TRIGGER IF EXISTS trg_match_update ON matches;")
    op.execute("DROP TRIGGER IF EXISTS trg_swipe_update ON swipes;")
    
    # Remover funções
    op.execute("DROP FUNCTION IF EXISTS trigger_block_update();")
    op.execute("DROP FUNCTION IF EXISTS trigger_report_update();")
    op.execute("DROP FUNCTION IF EXISTS trigger_view_update();")
    op.execute("DROP FUNCTION IF EXISTS trigger_match_update();")
    op.execute("DROP FUNCTION IF EXISTS trigger_swipe_update();")
    op.execute("DROP FUNCTION IF EXISTS update_fame_rating(INT);")
