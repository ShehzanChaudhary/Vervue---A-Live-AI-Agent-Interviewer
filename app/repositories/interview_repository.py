from typing import Literal

from sqlalchemy import select

from app.adapters.db.database import session_factory
from app.adapters.logger.logger import logger
from app.models.interview import Interview
from app.models.job import Job
from app.schemas.gap_analysis import GapAnalysis
from app.schemas.resume import ResumeProfile
from app.models.report import ReportRecord
from app.models.user import User
from app.schemas.candidate import CandidateRow

class InterviewRepository:
    async def create(
        self,
        user_id: int,
        job: Job,
        resume: ResumeProfile,
        gap: GapAnalysis,
    ) -> Interview:
        interview = Interview(
            user_id=user_id,
            job_id=job.id,
            job_title=job.title,
            max_questions=job.max_questions,
            resume_json=resume.model_dump(mode="json"),
            jd_json=job.jd_json,
            gap_json=gap.model_dump(mode="json"),
        )
        async with session_factory() as session:
            session.add(interview)
            await session.commit()
            await session.refresh(interview)

        logger.info(
            f"Interview {interview.id} created for user {interview.user_id} on job {interview.job_id}"
        )
        return interview

    async def get(self, interview_id: int) -> Interview | None:
        async with session_factory() as session:
            return await session.get(Interview, interview_id)

    async def list_by_user(self, user_id: int) -> list[Interview]:
        async with session_factory() as session:
            result = await session.execute(
                select(Interview)
                .where(Interview.user_id == user_id)
                .order_by(Interview.created_at.desc())
            )
            return list(result.scalars().all())

    async def list_by_job(self, job_id: int) -> list[Interview]:
        async with session_factory() as session:
            result = await session.execute(
                select(Interview)
                .where(Interview.job_id == job_id)
                .order_by(Interview.created_at.desc())
            )
            return list(result.scalars().all())

    async def list_candidates_by_job(self, job_id: int) -> list[CandidateRow]:
        async with session_factory() as session:
            result = await session.execute(
                select(Interview, User, ReportRecord)
                .join(User, User.id == Interview.user_id)
                .outerjoin(ReportRecord, ReportRecord.interview_id == Interview.id)
                .where(Interview.job_id == job_id)
                .order_by(Interview.created_at.desc())
            )
            rows = result.all()

        return [
            CandidateRow(
                interview_id=interview.id,
                name=user.name,
                email=user.email,
                status=interview.status,
                violation_count=len(interview.violations),
                recommendation=report.analysis.get("recommendation") if report else None,
                overall_score=report.overall_score if report else None,
                started_at=interview.created_at,
                completed_at=report.created_at if report else None,
            )
            for interview, user, report in rows
        ]

    async def update_status(
        self, interview_id: int, status: Literal["in_progress", "completed", "ended_by_proctoring"],
    ) -> bool:
        async with session_factory() as session:
            interview = await session.get(Interview, interview_id)
            if interview is None:
                logger.warning(f"Interview {interview_id} not found, status not updated")
                return False
            interview.status = status
            await session.commit()

        logger.info(f"Interview {interview_id} status set to {status}")
        return True

    async def add_violation(self, interview_id: int, violation: dict) -> Interview | None:
        async with session_factory() as session:
            interview = await session.get(Interview, interview_id)
            if interview is None:
                logger.warning(f"Interview {interview_id} not found, violation not saved")
                return None
            interview.violations = [*interview.violations, violation]
            await session.commit()
            await session.refresh(interview)

        logger.info(
            f"Interview {interview_id} violation saved: "
            f"{violation.get('type')} (total {len(interview.violations)})"
        )
        return interview

interview_repository = InterviewRepository()