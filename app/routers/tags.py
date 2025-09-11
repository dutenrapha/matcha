from fastapi import APIRouter, Depends, HTTPException
from app.db import get_connection
from app.schemas.tags import TagCreate, TagOut, UserTagAssign, UserTagRemove, UserTagsOut

router = APIRouter(prefix="/tags", tags=["tags"])

@router.post("/", response_model=dict)
async def create_tag(tag: TagCreate, conn=Depends(get_connection)):
    """Criar nova tag"""
    try:
        await conn.execute("INSERT INTO tags (name) VALUES ($1)", tag.name)
        return {"message": "Tag created successfully"}
    except Exception:
        raise HTTPException(status_code=400, detail="Tag already exists")

@router.get("/", response_model=list)
async def get_all_tags(conn=Depends(get_connection)):
    """Obter todas as tags"""
    rows = await conn.fetch("SELECT * FROM tags ORDER BY name")
    return [dict(r) for r in rows]

@router.get("/{tag_id}", response_model=TagOut)
async def get_tag(tag_id: int, conn=Depends(get_connection)):
    """Obter tag por ID"""
    tag = await conn.fetchrow("SELECT * FROM tags WHERE tag_id = $1", tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return dict(tag)

@router.post("/assign", response_model=dict)
async def assign_tag_to_user(data: UserTagAssign, conn=Depends(get_connection)):
    """Atribuir tag ao usuário"""
    try:
        await conn.execute("""
            INSERT INTO user_tags (user_id, tag_id)
            VALUES ($1, $2)
        """, data.user_id, data.tag_id)
        return {"message": "Tag assigned successfully"}
    except Exception:
        raise HTTPException(status_code=400, detail="Tag already assigned to user")

@router.delete("/unassign", response_model=dict)
async def remove_tag_from_user(data: UserTagRemove, conn=Depends(get_connection)):
    """Remover tag do usuário"""
    result = await conn.execute("""
        DELETE FROM user_tags WHERE user_id = $1 AND tag_id = $2
    """, data.user_id, data.tag_id)
    
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Tag not assigned to user")
    
    return {"message": "Tag removed successfully"}

@router.get("/user/{user_id}", response_model=UserTagsOut)
async def get_user_tags(user_id: int, conn=Depends(get_connection)):
    """Obter tags do usuário"""
    rows = await conn.fetch("""
        SELECT t.tag_id, t.name
        FROM tags t
        JOIN user_tags ut ON t.tag_id = ut.tag_id
        WHERE ut.user_id = $1
        ORDER BY t.name
    """, user_id)
    
    tags = [dict(r) for r in rows]
    return {"user_id": user_id, "tags": tags}

@router.get("/popular", response_model=list)
async def get_popular_tags(limit: int = 20, conn=Depends(get_connection)):
    """Obter tags mais populares"""
    rows = await conn.fetch("""
        SELECT t.tag_id, t.name, COUNT(ut.user_id) as usage_count
        FROM tags t
        LEFT JOIN user_tags ut ON t.tag_id = ut.tag_id
        GROUP BY t.tag_id, t.name
        ORDER BY usage_count DESC, t.name
        LIMIT $1
    """, limit)
    
    return [dict(r) for r in rows]

@router.get("/search/{query}", response_model=list)
async def search_tags(query: str, limit: int = 10, conn=Depends(get_connection)):
    """Buscar tags por nome"""
    rows = await conn.fetch("""
        SELECT * FROM tags 
        WHERE name ILIKE $1
        ORDER BY name
        LIMIT $2
    """, f"%{query}%", limit)
    
    return [dict(r) for r in rows]

@router.delete("/{tag_id}", response_model=dict)
async def delete_tag(tag_id: int, conn=Depends(get_connection)):
    """Deletar tag"""
    # Verificar se tag existe
    tag = await conn.fetchrow("SELECT tag_id FROM tags WHERE tag_id = $1", tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Deletar tag (cascade vai deletar user_tags)
    await conn.execute("DELETE FROM tags WHERE tag_id = $1", tag_id)
    
    return {"message": "Tag deleted successfully"}
