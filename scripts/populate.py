import asyncio
import asyncpg
import random
from faker import Faker
import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.utils.passwords import hash_password

DB_URL = "postgresql://postgres:postgres@db:5432/tinder_clone"
faker = Faker()

# Tags populares para o app
POPULAR_TAGS = [
    "vegan", "geek", "sporty", "travel", "music", "art", "fitness", "cooking",
    "photography", "reading", "gaming", "dancing", "hiking", "yoga", "coffee",
    "wine", "beer", "pets", "dogs", "cats", "nature", "beach", "mountains",
    "city", "countryside", "adventure", "relaxation", "party", "quiet",
    "outdoor", "indoor", "creative", "analytical", "spontaneous", "planned"
]

async def populate_users(n=500):
    """Popular banco com usuários fake"""
    conn = await asyncpg.connect(DB_URL)
    
    try:
        print(f"🚀 Iniciando população de {n} usuários...")
        
        # Limpar dados existentes (opcional - descomente se necessário)
        print("🧹 Limpando dados existentes...")
        await conn.execute("DELETE FROM user_tags")
        await conn.execute("DELETE FROM matches")
        await conn.execute("DELETE FROM swipes")
        await conn.execute("DELETE FROM profiles")
        await conn.execute("DELETE FROM users")
        
        # Criar tags se não existirem
        print("📝 Criando tags...")
        for tag_name in POPULAR_TAGS:
            await conn.execute("""
                INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING
            """, tag_name)
        
        # Obter IDs das tags
        tag_rows = await conn.fetch("SELECT tag_id, name FROM tags")
        tag_map = {row["name"]: row["tag_id"] for row in tag_rows}
        
        for i in range(n):
            # Dados do usuário
            gender = random.choice(["male", "female"])
            # Usar nomes apropriados para o gênero
            if gender == "male":
                name = faker.first_name_male()
            else:
                name = faker.first_name_female()
            
            # Criar username baseado no nome
            username = f"{name.lower()}{i}{random.randint(100, 999)}"
            email = f"{name.lower()}{i}{random.randint(1000, 9999)}@example.com"
            password_hash = hash_password("TestPass123!")
            age = random.randint(18, 50)
            sexual_pref = random.choice(["male", "female", "both"])
            
            # Criar bio mais apropriada ao gênero
            if gender == "male":
                bio_templates = [
                    f"Olá! Sou {name}, gosto de esportes e tecnologia. Procuro alguém especial para compartilhar bons momentos.",
                    f"Oi! Meu nome é {name}, adoro música e viagens. Estou procurando uma pessoa interessante para conhecer.",
                    f"Hey! Sou {name}, gosto de aventuras e boa conversa. Vamos nos conhecer?",
                    f"Olá! Sou {name}, apaixonado por fotografia e natureza. Procuro alguém para explorar o mundo juntos."
                ]
            else:
                bio_templates = [
                    f"Oi! Sou {name}, adoro arte e música. Estou procurando alguém especial para compartilhar momentos únicos.",
                    f"Olá! Meu nome é {name}, gosto de dança e viagens. Vamos nos conhecer?",
                    f"Hey! Sou {name}, apaixonada por livros e café. Procuro uma pessoa interessante para conversar.",
                    f"Oi! Sou {name}, adoro yoga e natureza. Estou procurando alguém para explorar a vida juntos."
                ]
            
            bio = random.choice(bio_templates)
            fame_rating = random.randint(0, 100)
            
            # Fotos
            avatar_url = f"https://randomuser.me/api/portraits/{'men' if gender=='male' else 'women'}/{i%99}.jpg"
            photos = [
                f"https://picsum.photos/seed/{name}{j}/400/400" for j in range(1, 6)
            ]
            
            # Localização (São Paulo e região)
            lat = random.uniform(-23.8, -23.4)
            lon = random.uniform(-46.8, -46.3)
            city = random.choice(["São Paulo", "Guarulhos", "Santo André", "São Bernardo", "Osasco"])
            
            # Inserir usuário
            user_id = await conn.fetchval("""
                INSERT INTO users (name, email, username, password_hash, fame_rating, is_verified)
                VALUES ($1, $2, $3, $4, $5, TRUE)
                RETURNING user_id
            """, name, email, username, password_hash, fame_rating)
            
            # Inserir perfil
            await conn.execute("""
                INSERT INTO profiles (user_id, bio, age, gender, sexual_pref,
                                      location, latitude, longitude, avatar_url,
                                      photo1_url, photo2_url, photo3_url, photo4_url, photo5_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            """, user_id, bio, age, gender, sexual_pref,
                 city, lat, lon, avatar_url,
                 photos[0], photos[1], photos[2], photos[3], photos[4])
            
            # Inserir preferências
            await conn.execute("""
                INSERT INTO preferences (user_id, preferred_gender, age_min, age_max, max_distance_km)
                VALUES ($1, $2, $3, $4, $5)
            """, user_id, sexual_pref, 18, 50, random.choice([10, 20, 50]))
            
            # Atribuir tags aleatórias (1-5 tags por usuário)
            num_tags = random.randint(1, 5)
            user_tags = random.sample(POPULAR_TAGS, num_tags)
            
            for tag_name in user_tags:
                tag_id = tag_map.get(tag_name)
                if tag_id:
                    await conn.execute("""
                        INSERT INTO user_tags (user_id, tag_id)
                        VALUES ($1, $2) ON CONFLICT DO NOTHING
                    """, user_id, tag_id)
            
            # Forçar update de fame_rating inicial
            await conn.execute("SELECT update_fame_rating($1)", user_id)
            
            if (i + 1) % 50 == 0:
                print(f"✅ Criados {i + 1} usuários...")
        
        print(f"🎉 População concluída! {n} usuários criados com sucesso.")
        
        # Estatísticas finais
        total_users = await conn.fetchval("SELECT COUNT(*) FROM users")
        total_profiles = await conn.fetchval("SELECT COUNT(*) FROM profiles")
        total_tags = await conn.fetchval("SELECT COUNT(*) FROM tags")
        total_user_tags = await conn.fetchval("SELECT COUNT(*) FROM user_tags")
        
        print(f"\n📊 Estatísticas:")
        print(f"   👥 Usuários: {total_users}")
        print(f"   📋 Perfis: {total_profiles}")
        print(f"   🏷️  Tags: {total_tags}")
        print(f"   🔗 Tags de usuários: {total_user_tags}")
        
    except Exception as e:
        print(f"❌ Erro durante população: {e}")
        raise
    finally:
        await conn.close()

async def create_sample_swipes_and_matches():
    """Criar alguns swipes e matches de exemplo"""
    conn = await asyncpg.connect(DB_URL)
    
    try:
        print("💕 Criando swipes e matches de exemplo...")
        
        # Obter alguns usuários
        users = await conn.fetch("SELECT user_id FROM users LIMIT 20")
        user_ids = [row["user_id"] for row in users]
        
        # Criar swipes aleatórios
        for _ in range(100):
            swiper_id = random.choice(user_ids)
            swiped_id = random.choice([uid for uid in user_ids if uid != swiper_id])
            direction = random.choice(["like", "dislike"])
            
            await conn.execute("""
                INSERT INTO swipes (swiper_id, swiped_id, direction)
                VALUES ($1, $2, $3) ON CONFLICT (swiper_id, swiped_id) DO NOTHING
            """, swiper_id, swiped_id, direction)
        
        # Criar alguns matches manuais
        for i in range(0, len(user_ids) - 1, 2):
            user1_id = user_ids[i]
            user2_id = user_ids[i + 1]
            
            # Criar match
            match_id = await conn.fetchval("""
                INSERT INTO matches (user1_id, user2_id)
                VALUES ($1, $2) ON CONFLICT (user1_id, user2_id) DO NOTHING
                RETURNING match_id
            """, user1_id, user2_id)
            
            if match_id:
                # Criar chat para o match
                chat_id = await conn.fetchval("""
                    INSERT INTO chats (match_id) VALUES ($1)
                    RETURNING chat_id
                """, match_id)
                
                if chat_id:
                    # Criar algumas mensagens
                    for _ in range(random.randint(1, 5)):
                        sender_id = random.choice([user1_id, user2_id])
                        content = faker.sentence(nb_words=random.randint(3, 10))
                        
                        await conn.execute("""
                            INSERT INTO messages (chat_id, sender_id, content)
                            VALUES ($1, $2, $3)
                        """, chat_id, sender_id, content)
        
        print("✅ Swipes e matches criados!")
        
    except Exception as e:
        print(f"❌ Erro criando swipes/matches: {e}")
    finally:
        await conn.close()

async def main():
    """Função principal"""
    print("🎯 Iniciando população do banco de dados...")
    
    # Popular usuários
    await populate_users(500)
    
    # Criar swipes e matches
    await create_sample_swipes_and_matches()
    
    print("\n🎉 População completa! Banco pronto para uso.")

if __name__ == "__main__":
    asyncio.run(main())
