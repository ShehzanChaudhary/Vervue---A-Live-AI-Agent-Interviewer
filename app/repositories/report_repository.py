from sqlalchemy import select

from app.adapters.db.database import session_factory
from app.adapters.logger.logger import logger
from app.models.report import ReportRecord
from app.repositories.interview_repository import interview_repository
from app.schemas.report import InterviewReport, ReportAnalysis, ScoreSummary

class ReportRepository:
    async def save(self, interview_id: int, report: InterviewReport) -> ReportRecord:
        async with session_factory() as session:
            result = await session.execute(
                select(ReportRecord).where(ReportRecord.interview_id == interview_id)
            )
            record = result.scalar_one_or_none()

            if record is None:
                record = ReportRecord(interview_id=interview_id)
                session.add(record)
                logger.info(f"Creating report for interview {interview_id}")
            else:
                logger.info(f"Report already exists for interview {interview_id}, overwriting")

            record.overall_score = report.scores.overall_score
            record.scores = report.scores.model_dump(mode="json")
            record.analysis = report.analysis.model_dump(mode="json")
            record.details = report.model_dump(
                mode="json", exclude={"job_title", "scores", "analysis"}
            )

            await session.commit()
            await session.refresh(record)

        return record

    async def get_by_interview(self, interview_id: int) -> InterviewReport | None:
        async with session_factory() as session:
            result = await session.execute(
                select(ReportRecord).where(ReportRecord.interview_id == interview_id)
            )
            record = result.scalar_one_or_none()

        if record is None:
            return None

        interview = await interview_repository.get(interview_id)
        job_title = interview.job_title if interview else None

        return InterviewReport(
            job_title=job_title,
            scores=ScoreSummary.model_validate(record.scores),
            analysis=ReportAnalysis.model_validate(record.analysis),
            **record.details,
        )

report_repository = ReportRepository()