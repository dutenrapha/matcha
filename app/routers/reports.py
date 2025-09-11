from fastapi import APIRouter, Depends, HTTPException
from app.db import get_connection
from app.schemas.reports import ReportIn, ReportOut

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("/", response_model=dict)
async def report_user(data: ReportIn, conn=Depends(get_connection)):
    """Reportar usuário"""
    # Verificar se não está tentando reportar a si mesmo
    if data.reporter_id == data.reported_id:
        raise HTTPException(status_code=400, detail="Cannot report yourself")
    
    # Verificar se já reportou este usuário
    existing = await conn.fetchrow("""
        SELECT report_id FROM reports 
        WHERE reporter_id = $1 AND reported_id = $2
    """, data.reporter_id, data.reported_id)
    
    if existing:
        raise HTTPException(status_code=400, detail="User already reported")
    
    # Inserir report
    await conn.execute("""
        INSERT INTO reports (reporter_id, reported_id, reason)
        VALUES ($1, $2, $3)
    """, data.reporter_id, data.reported_id, data.reason)
    
    return {"message": "User reported successfully"}

@router.get("/{user_id}/made", response_model=list)
async def get_reports_made(user_id: int, conn=Depends(get_connection)):
    """Obter reports feitos pelo usuário"""
    rows = await conn.fetch("""
        SELECT r.report_id, r.reported_id, r.reason, r.created_at,
               u.name as reported_name, p.avatar_url as reported_avatar
        FROM reports r
        JOIN users u ON r.reported_id = u.user_id
        JOIN profiles p ON r.reported_id = p.user_id
        WHERE r.reporter_id = $1
        ORDER BY r.created_at DESC
    """, user_id)
    
    return [dict(r) for r in rows]

@router.get("/{user_id}/received", response_model=list)
async def get_reports_received(user_id: int, conn=Depends(get_connection)):
    """Obter reports recebidos pelo usuário"""
    rows = await conn.fetch("""
        SELECT r.report_id, r.reporter_id, r.reason, r.created_at,
               u.name as reporter_name, p.avatar_url as reporter_avatar
        FROM reports r
        JOIN users u ON r.reporter_id = u.user_id
        JOIN profiles p ON r.reporter_id = p.user_id
        WHERE r.reported_id = $1
        ORDER BY r.created_at DESC
    """, user_id)
    
    return [dict(r) for r in rows]

@router.get("/admin/all", response_model=list)
async def get_all_reports(limit: int = 50, offset: int = 0, conn=Depends(get_connection)):
    """Obter todos os reports (admin)"""
    rows = await conn.fetch("""
        SELECT r.report_id, r.reporter_id, r.reported_id, r.reason, r.created_at,
               reporter.name as reporter_name, reported.name as reported_name
        FROM reports r
        JOIN users reporter ON r.reporter_id = reporter.user_id
        JOIN users reported ON r.reported_id = reported.user_id
        ORDER BY r.created_at DESC
        LIMIT $1 OFFSET $2
    """, limit, offset)
    
    return [dict(r) for r in rows]

@router.get("/{user_id}/count", response_model=dict)
async def get_report_count(user_id: int, conn=Depends(get_connection)):
    """Obter contagem de reports"""
    made = await conn.fetchval("""
        SELECT COUNT(*) FROM reports WHERE reporter_id = $1
    """, user_id)
    
    received = await conn.fetchval("""
        SELECT COUNT(*) FROM reports WHERE reported_id = $1
    """, user_id)
    
    return {
        "user_id": user_id,
        "reports_made": made,
        "reports_received": received
    }

@router.delete("/{report_id}", response_model=dict)
async def delete_report(report_id: int, conn=Depends(get_connection)):
    """Deletar report"""
    # Verificar se report existe
    report = await conn.fetchrow("SELECT report_id FROM reports WHERE report_id = $1", report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Deletar report
    await conn.execute("DELETE FROM reports WHERE report_id = $1", report_id)
    
    return {"message": "Report deleted successfully"}

@router.get("/admin/stats", response_model=dict)
async def get_report_stats(conn=Depends(get_connection)):
    """Obter estatísticas de reports (admin)"""
    total = await conn.fetchval("SELECT COUNT(*) FROM reports")
    
    recent = await conn.fetchval("""
        SELECT COUNT(*) FROM reports 
        WHERE created_at >= NOW() - INTERVAL '7 days'
    """)
    
    most_reported = await conn.fetchrow("""
        SELECT reported_id, COUNT(*) as report_count
        FROM reports
        GROUP BY reported_id
        ORDER BY report_count DESC
        LIMIT 1
    """)
    
    return {
        "total_reports": total,
        "recent_reports_7d": recent,
        "most_reported_user": dict(most_reported) if most_reported else None
    }
