from datetime import datetime

from pydantic import BaseModel

class CandidateRow(BaseModel):
    interview_id: int
    name: str
    email: str
    status: str
    violation_count: int
    recommendation: str | None = None
    overall_score: int | None = None
    started_at: datetime
    completed_at: datetime | None = None