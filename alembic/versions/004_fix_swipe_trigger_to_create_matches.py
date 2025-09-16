"""fix swipe trigger to create matches

Revision ID: 004_fix_swipe_trigger
Revises: 003_fix_ambiguous_column
Create Date: 2025-01-12 19:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_fix_swipe_trigger_to_create_matches'
down_revision = '003_fix_ambiguous_column'
branch_labels = None
depends_on = None


def upgrade():
    """Upgrade database schema to fix swipe trigger to create matches automatically."""
    
    # Primeiro, vamos criar uma função para detectar e criar matches
    op.execute("""
    CREATE OR REPLACE FUNCTION create_match_if_mutual_like() RETURNS TRIGGER AS $$
    BEGIN
        -- Só processar se for um like
        IF NEW.direction = 'like' THEN
            -- Verificar se existe um like mútuo
            IF EXISTS (
                SELECT 1 FROM swipes 
                WHERE swiper_id = NEW.swiped_id 
                  AND swiped_id = NEW.swiper_id 
                  AND direction = 'like'
            ) THEN
                -- Criar match se não existir
                INSERT INTO matches (user1_id, user2_id, created_at)
                VALUES (
                    LEAST(NEW.swiper_id, NEW.swiped_id),
                    GREATEST(NEW.swiper_id, NEW.swiped_id),
                    NOW()
                )
                ON CONFLICT (user1_id, user2_id) DO NOTHING;
            END IF;
        END IF;
        
        -- Atualizar fame rating
        PERFORM update_fame_rating(NEW.swiped_id);
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    
    # Recriar o trigger com a nova função
    op.execute("DROP TRIGGER IF EXISTS trg_swipe_update ON swipes;")
    op.execute("""
    CREATE TRIGGER trg_swipe_update
    AFTER INSERT ON swipes
    FOR EACH ROW EXECUTE FUNCTION create_match_if_mutual_like();
    """)


def downgrade():
    """Downgrade database schema to remove the match creation functionality."""
    
    # Restaurar a função original
    op.execute("""
    CREATE OR REPLACE FUNCTION trigger_swipe_update() RETURNS TRIGGER AS $$
    BEGIN
        PERFORM update_fame_rating(NEW.swiped_id);
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    
    # Recriar o trigger original
    op.execute("DROP TRIGGER IF EXISTS trg_swipe_update ON swipes;")
    op.execute("""
    CREATE TRIGGER trg_swipe_update
    AFTER INSERT ON swipes
    FOR EACH ROW EXECUTE FUNCTION trigger_swipe_update();
    """)
    
    # Remover a função de criação de matches
    op.execute("DROP FUNCTION IF EXISTS create_match_if_mutual_like();")
