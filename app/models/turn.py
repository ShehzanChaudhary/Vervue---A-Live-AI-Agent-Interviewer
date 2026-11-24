from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.adapters.db.database import Base

class TurnRecord(Base):
    __tablename__ = "turns"
    __table_args__ = (
        UniqueConstraint("interview_id", "turn_number", name="uq_turn_interview_number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    interview_id: Mapped[int] = mapped_column(ForeignKey("interviews.id"), index=True)
    turn_number: Mapped[int] = mapped_column()

    topic: Mapped[str] = mapped_column(String(200))
    question_type: Mapped[str] = mapped_column(String(20))
    difficulty: Mapped[str] = mapped_column(String(20))
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)

    technical_accuracy: Mapped[int] = mapped_column()
    depth: Mapped[int] = mapped_column()
    communication: Mapped[int] = mapped_column()
    strengths: Mapped[list] = mapped_column(JSON)
    weaknesses: Mapped[list] = mapped_column(JSON)
    feedback: Mapped[str] = mapped_column(Text)
    should_follow_up: Mapped[bool] = mapped_column()
    follow_up_focus: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )