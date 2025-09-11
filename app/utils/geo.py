import httpx
from typing import Tuple, Optional

async def get_geo_from_ip(ip: str) -> Tuple[float, float, str]:
    """Obtém localização geográfica baseada no IP"""
    try:
        # Usar ip-api.com (gratuito, sem API key)
        url = f"http://ip-api.com/json/{ip}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=5.0)
            data = resp.json()
            
            if data.get("status") == "success":
                lat = data.get("lat", 0.0)
                lon = data.get("lon", 0.0)
                city = data.get("city", "Unknown")
                return lat, lon, city
    except Exception as e:
        print(f"[WARN] IP geolocation failed for {ip}: {e}")
    
    # Fallback para São Paulo, Brasil
    return -23.5475, -46.6361, "São Paulo"

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula distância entre dois pontos usando fórmula de Haversine"""
    import math
    
    # Raio da Terra em km
    R = 6371
    
    # Converter para radianos
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Diferenças
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    # Fórmula de Haversine
    a = (math.sin(dlat/2)**2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2)
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c
