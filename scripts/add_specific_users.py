import asyncio
import asyncpg
import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.utils.passwords import hash_password

DB_URL = "postgresql://postgres:postgres@db:5432/tinder_clone"

async def add_specific_users():
    """Adicionar usuários específicos: Bob, Alice e Carol"""
    conn = await asyncpg.connect(DB_URL)
    
    try:
        print("🚀 Adicionando usuários específicos...")
        
        # Dados dos usuários específicos
        users_data = [
            {
                "name": "Bob",
                "email": "bob@example.com",
                "username": "bob",
                "gender": "male",
                "sexual_pref": "female",  # Bob gosta de mulheres
                "age": 28,
                "bio": "Olá! Sou o Bob, gosto de esportes e tecnologia. Procuro uma mulher especial para compartilhar bons momentos.",
                "fame_rating": 75
            },
            {
                "name": "Alice",
                "email": "alice@example.com", 
                "username": "alice",
                "gender": "female",
                "sexual_pref": "male",  # Alice gosta de homens
                "age": 25,
                "bio": "Oi! Sou a Alice, adoro música, arte e viagens. Estou procurando um homem interessante para conhecer.",
                "fame_rating": 80
            },
            {
                "name": "Carol",
                "email": "carol@example.com",
                "username": "carol", 
                "gender": "female",
                "sexual_pref": "both",  # Carol gosta de ambos
                "age": 30,
                "bio": "Olá! Sou a Carol, sou uma pessoa aberta e gosto de conhecer pessoas interessantes, independente do gênero.",
                "fame_rating": 85
            }
        ]
        
        password_hash = hash_password("StrongPass123!")
        
        for user_data in users_data:
            print(f"👤 Criando usuário: {user_data['name']}")
            
            # Verificar se usuário já existe
            existing_user = await conn.fetchrow(
                "SELECT user_id FROM users WHERE email = $1 OR username = $2",
                user_data["email"], user_data["username"]
            )
            
            if existing_user:
                print(f"⚠️  Usuário {user_data['name']} já existe, pulando...")
                continue
            
            # Inserir usuário
            user_id = await conn.fetchval("""
                INSERT INTO users (name, email, username, password_hash, fame_rating, is_verified)
                VALUES ($1, $2, $3, $4, $5, TRUE)
                RETURNING user_id
            """, user_data["name"], user_data["email"], user_data["username"], 
                password_hash, user_data["fame_rating"])
            
            # Inserir perfil
            await conn.execute("""
                INSERT INTO profiles (user_id, bio, age, gender, sexual_pref,
                                      location, latitude, longitude, avatar_url,
                                      photo1_url, photo2_url, photo3_url, photo4_url, photo5_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            """, user_id, user_data["bio"], user_data["age"], user_data["gender"], 
                user_data["sexual_pref"], "São Paulo", -23.5505, -46.6333,
                f"https://randomuser.me/api/portraits/{'men' if user_data['gender']=='male' else 'women'}/{user_id%99}.jpg",
                f"https://picsum.photos/seed/{user_data['name']}1/400/400",
                f"https://picsum.photos/seed/{user_data['name']}2/400/400", 
                f"https://picsum.photos/seed/{user_data['name']}3/400/400",
                f"https://picsum.photos/seed/{user_data['name']}4/400/400",
                f"https://picsum.photos/seed/{user_data['name']}5/400/400")
            
            # Inserir preferências
            await conn.execute("""
                INSERT INTO preferences (user_id, preferred_gender, age_min, age_max, max_distance_km)
                VALUES ($1, $2, $3, $4, $5)
            """, user_id, user_data["sexual_pref"], 20, 40, 50)
            
            # Adicionar algumas tags
            tags = ["friendly", "adventure", "music", "travel", "sporty"]
            for tag_name in tags:
                # Verificar se tag existe
                tag_id = await conn.fetchval("SELECT tag_id FROM tags WHERE name = $1", tag_name)
                if tag_id:
                    await conn.execute("""
                        INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING
                    """, user_id, tag_id)
            
            print(f"✅ Usuário {user_data['name']} criado com sucesso!")
            print(f"   📧 Email: {user_data['email']}")
            print(f"   👤 Username: {user_data['username']}")
            print(f"   🔑 Senha: StrongPass123!")
            print(f"   💕 Preferência: {user_data['sexual_pref']}")
            print()
        
        print("🎉 Todos os usuários específicos foram criados com sucesso!")
        print("\n📋 Credenciais para teste:")
        print("   Bob - Username: bob, Senha: StrongPass123! (gosta de mulheres)")
        print("   Alice - Username: alice, Senha: StrongPass123! (gosta de homens)")  
        print("   Carol - Username: carol, Senha: StrongPass123! (gosta de ambos)")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(add_specific_users())
