import bcrypt

COMMON_PASSWORDS = {
    "password", "123456", "qwerty", "abc123", "senha", "reset", "login",
    "admin", "letmein", "welcome", "monkey", "1234567890", "password123",
    "123123", "dragon", "master", "hello", "freedom", "whatever", "qazwsx",
    "trustno1", "654321", "jordan23", "harley", "password1", "1234",
    "robert", "matthew", "jordan", "asshole", "daniel", "andrew", "joshua",
    "michael", "charlie", "michelle", "jessica", "samantha", "ashley",
    "amanda", "jennifer", "sarah", "elizabeth", "heather", "nicole",
    "laura", "stephanie", "rachel", "emily", "kimberly", "rebecca",
    "megan", "lauren", "christina", "kelly", "angela", "crystal",
    "brittany", "diana", "shelly", "april", "maria", "vanessa",
    "courtney", "monica", "christine", "sandra", "katherine", "donna",
    "carol", "ruth", "sharon", "michelle", "laura", "sarah", "kimberly",
    "deborah", "dorothy", "lisa", "nancy", "karen", "betty", "helen",
    "sandra", "donna", "carol", "ruth", "sharon", "michelle", "laura",
    "sarah", "kimberly", "deborah", "dorothy", "lisa", "nancy", "karen",
    "betty", "helen", "sandra", "donna", "carol", "ruth", "sharon"
}

def validate_password(password: str):
    """Valida se a senha atende aos critérios de segurança"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if password.lower() in COMMON_PASSWORDS:
        return False, "Password is too common, please choose a stronger one"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    
    if not any(c in "!@#$%^&*()-_=+[]{};:,.<>?/\\|" for c in password):
        return False, "Password must contain at least one special character"
    
    return True, None

def hash_password(password: str) -> str:
    """Gera hash da senha usando bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verifica se a senha corresponde ao hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
