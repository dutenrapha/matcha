from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    users, profiles, preferences, swipes, matches,
    chats, messages, notifications, views, tags,
    blocks, reports, auth, ws_chat, ws_notifications
)

app = FastAPI(
    title="Matcha Clone API",
    description="API para aplicação de encontros estilo Tinder",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers REST
app.include_router(users.router)
app.include_router(profiles.router)
app.include_router(preferences.router)
app.include_router(swipes.router)
app.include_router(matches.router)
app.include_router(chats.router)
app.include_router(messages.router)
app.include_router(notifications.router)
app.include_router(views.router)
app.include_router(tags.router)
app.include_router(blocks.router)
app.include_router(reports.router)
app.include_router(auth.router)

# Incluir routers WebSocket
app.include_router(ws_chat.router)
app.include_router(ws_notifications.router)

@app.get("/")
async def root():
    """Endpoint raiz da API"""
    return {
        "message": "Welcome to Matcha Clone API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
