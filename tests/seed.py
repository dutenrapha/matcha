# tests/seed.py
import bcrypt
from app.db import get_connection

async def reset_and_seed():
    """Limpa o banco e insere dados fixos para os testes"""
    async for conn in get_connection():
        # Resetar tudo
        await conn.execute("TRUNCATE messages RESTART IDENTITY CASCADE")
        await conn.execute("TRUNCATE chats RESTART IDENTITY CASCADE")
        await conn.execute("TRUNCATE matches RESTART IDENTITY CASCADE")
        await conn.execute("TRUNCATE swipes RESTART IDENTITY CASCADE")
        await conn.execute("TRUNCATE profiles RESTART IDENTITY CASCADE")
        await conn.execute("TRUNCATE users RESTART IDENTITY CASCADE")
        await conn.execute("TRUNCATE notifications RESTART IDENTITY CASCADE")

        # Usuário principal ID=1
        pwd1 = bcrypt.hashpw("TestPass123!".encode(), bcrypt.gensalt()).decode()
        await conn.execute("""
            INSERT INTO users (user_id, name, email, password_hash, is_verified, fame_rating)
            VALUES (1, 'Test User', 'test@example.com', $1, TRUE, 50)
        """, pwd1)
        await conn.execute("""
            INSERT INTO profiles (user_id, age, gender, sexual_pref, latitude, longitude, avatar_url)
            VALUES (1, 25, 'female', 'male', -23.55, -46.63, 'avatar1.jpg')
        """)

        # Segundo usuário ID=2
        pwd2 = bcrypt.hashpw("OtherPass123!".encode(), bcrypt.gensalt()).decode()
        await conn.execute("""
            INSERT INTO users (user_id, name, email, password_hash, is_verified, fame_rating)
            VALUES (2, 'Other User', 'other@example.com', $1, TRUE, 70)
        """, pwd2)
        await conn.execute("""
            INSERT INTO profiles (user_id, age, gender, sexual_pref, latitude, longitude, avatar_url)
            VALUES (2, 28, 'male', 'female', -23.60, -46.65, 'avatar2.jpg')
        """)

        # Criar match + chat
        match = await conn.fetchrow("""
            INSERT INTO matches (user1_id, user2_id)
            VALUES (1, 2)
            RETURNING match_id
        """)
        await conn.execute("""
            INSERT INTO chats (chat_id, match_id)
            VALUES (1, $1)
        """, match["match_id"])

        # Usuário dummy para notificações (ID=99)
        pwd99 = bcrypt.hashpw("DummyPass123!".encode(), bcrypt.gensalt()).decode()
        await conn.execute("""
            INSERT INTO users (user_id, name, email, password_hash, is_verified, fame_rating)
            VALUES (99, 'Notify User', 'notify@example.com', $1, TRUE, 10)
        """, pwd99)

        # Usuário não verificado para login/logout flow (ID=3)
        pwd3 = bcrypt.hashpw("LoginPass123!".encode(), bcrypt.gensalt()).decode()
        await conn.execute("""
            INSERT INTO users (user_id, name, email, password_hash, is_verified, fame_rating)
            VALUES (3, 'Unverified User', 'login@example.com', $1, FALSE, 20)
        """, pwd3)

        # 👇 garante que inserts automáticos não colidam com seeds fixos
        await conn.execute("ALTER SEQUENCE users_user_id_seq RESTART WITH 1000")
