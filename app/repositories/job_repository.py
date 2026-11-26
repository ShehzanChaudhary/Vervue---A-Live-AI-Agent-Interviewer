from sqlalchemy import select

from app.adapters.db.database import session_factory
from app.adapters.logger.logger import logger
from app.models.job import Job
from app.schemas.job_description import JDProfile

class JobRepository:
    async def create(
        self,
        title: str,
        department: str | None,
        level: str,
        jd_text: str,
        jd: JDProfile,
        max_questions: int,
    ) -> Job:
        job = Job(
            title=title,
            department=department,
            level=level,
            jd_text=jd_text,
            jd_json=jd.model_dump(mode="json"),
            max_questions=max_questions,
        )
        async with session_factory() as session:
            session.add(job)
            await session.commit()
            await session.refresh(job)

        logger.info(f"Job {job.id} created: {job.title}")
        return job

    async def get(self, job_id: int) -> Job | None:
        async with session_factory() as session:
            return await session.get(Job, job_id)

    async def list_all(self) -> list[Job]:
        async with session_factory() as session:
            result = await session.execute(select(Job).order_by(Job.created_at.desc()))
            return list(result.scalars().all())

    async def set_active(self, job_id: int, is_active: bool) -> bool:
        async with session_factory() as session:
            job = await session.get(Job, job_id)
            if job is None:
                logger.warning(f"Job {job_id} not found, is_active not updated")
                return False
            job.is_active = is_active
            await session.commit()

        logger.info(f"Job {job_id} is_active set to {is_active}")
        return True

job_repository = JobRepository()