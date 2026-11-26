from app.adapters.logger.logger import logger
from app.models.job import Job
from app.repositories.job_repository import job_repository
from app.schemas.job import CreateJobRequest
from app.services.profile_service import profile_service
from app.repositories.interview_repository import interview_repository
from app.schemas.candidate import CandidateRow

class JobNotFoundError(Exception):
    pass

class JobInactiveError(Exception):
    pass

class JobService:
    async def create_job(self, body: CreateJobRequest) -> Job:
        logger.info(f"Creating job: {body.title}")

        # JD is parsed once here, every interview of the job uses it
        jd = await profile_service.parse_jd(body.jd_text)

        return await job_repository.create(
            title=body.title,
            department=body.department,
            level=body.level,
            jd_text=body.jd_text,
            jd=jd,
            max_questions=body.max_questions
        )

    async def list_jobs(self) -> list[Job]:
        return await job_repository.list_all()

    async def get_job(self, job_id: int) -> Job:
        job = await job_repository.get(job_id)
        if job is None:
            raise JobNotFoundError(f"Job {job_id} not found")
        return job

    async def get_active_job(self, job_id: int) -> Job:
        job = await self.get_job(job_id)
        if not job.is_active:
            raise JobInactiveError(f"Job {job_id} is not accepting interviews")
        return job

    async def get_active_job_by_public_id(self, public_id: str) -> Job:
        job = await job_repository.get_by_public_id(public_id)
        if job is None:
            raise JobNotFoundError("Job not found for this apply link")
        if not job.is_active:
            raise JobInactiveError(f"Job {job.id} is not accepting interviews")
        return job

    async def set_active(self, job_id: int, is_active: bool) -> Job:
        updated = await job_repository.set_active(job_id, is_active)
        if not updated:
            raise JobNotFoundError(f"Job {job_id} not found")
        return await self.get_job(job_id)

    async def list_candidates(self, job_id: int) -> list[CandidateRow]:
        await self.get_job(job_id)
        return await interview_repository.list_candidates_by_job(job_id)

job_service = JobService()