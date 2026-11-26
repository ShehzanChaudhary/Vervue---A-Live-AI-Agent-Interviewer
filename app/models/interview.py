from datetime import datetime
from sqlalchemy import JSON, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.adapters.db.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), index=True)
    job_title: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default="in_progress")
    violations: Mapped[list] = mapped_column(JSON, default=list)
    max_questions: Mapped[int] = mapped_column()
    resume_json: Mapped[dict] = mapped_column(JSON)
    jd_json: Mapped[dict] = mapped_column(JSON)
    gap_json: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )