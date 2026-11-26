from fastapi import APIRouter, HTTPException

from app.schemas.job import PublicJobResponse
from app.services.job_service import JobInactiveError, JobNotFoundError, job_service

router = APIRouter(prefix="/public", tags=["public"])

@router.get("/jobs/{public_id}", response_model=PublicJobResponse)
async def get_public_job(public_id: str):
    try:
        return await job_service.get_active_job_by_public_id(public_id)
    except JobNotFoundError:
        raise HTTPException(status_code=404, detail="Job not found")
    except JobInactiveError:
        raise HTTPException(status_code=409, detail="This job is not accepting interviews")