from fastapi import APIRouter, Depends, HTTPException, status

from app.routes.auth import get_current_hr
from app.schemas.job import CreateJobRequest, JobResponse, JobStatusRequest
from app.services.job_service import JobNotFoundError, job_service

router = APIRouter(prefix="/jobs", tags=["jobs"], dependencies=[Depends(get_current_hr)])

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(body: CreateJobRequest):
    return await job_service.create_job(body)

@router.get("", response_model=list[JobResponse])
async def list_jobs():
    return await job_service.list_jobs()

@router.patch("/{job_id}/status", response_model=JobResponse)
async def set_job_status(job_id: int, body: JobStatusRequest):
    try:
        return await job_service.set_active(job_id, body.is_active)
    except JobNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))