from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ReportIn(BaseModel):
    reporter_id: int
    reported_id: int
    reason: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "reporter_id": 1,
                "reported_id": 2,
                "reason": "Fake profile"
            }
        }
    )

class ReportOut(BaseModel):
    report_id: int
    reporter_id: int
    reported_id: int
    reason: str
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "report_id": 1,
                "reporter_id": 1,
                "reported_id": 2,
                "reason": "Fake profile",
                "created_at": "2025-01-10T12:00:00Z"
            }
        }
    )
