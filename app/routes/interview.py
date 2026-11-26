from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, BackgroundTasks

from app.adapters.parser.file_parser import FileParseError
from app.adapters.logger.logger import logger
from app.routes.auth import get_current_hr
from app.repositories.report_repository import report_repository
from app.repositories.interview_repository import interview_repository
from app.schemas.api import AnswerRequest, AnswerResponse, StartInterviewResponse, ViolationResponse, ViolationRequest
from app.schemas.report import InterviewReport
from app.services.interview_service import (
    InterviewCompletedError,
    InterviewNotFoundError,
    interview_service,
)
from app.services.job_service import JobNotFoundError, JobInactiveError, job_service

router = APIRouter(prefix="/interviews", tags=["interviews"])

@router.post("", response_model=StartInterviewResponse)
async def start_interview(name: str = Form(...), email: str = Form(...), public_id: str = Form(...), resume: UploadFile = File(...)):
    content = await resume.read()
    if not content:
        raise HTTPException(status_code=400, detail="Resume file is empty")

    logger.info(f"POST /interviews, resume file: {resume.filename}")

    try:
        job = await job_service.get_active_job_by_public_id(public_id)
        return await interview_service.start(
            name=name,
            email=email,
            resume_content=content,
            resume_filename=resume.filename or "",
            job_id=job.id,
        )
    except JobNotFoundError:
        raise HTTPException(status_code=404, detail="Job not found")
    except JobInactiveError:
        raise HTTPException(status_code=409, detail="This job is not accepting interviews")
    except FileParseError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{interview_id}/answer", response_model=AnswerResponse)
async def submit_answer(interview_id: int, body: AnswerRequest):
    try:
        return await interview_service.answer(interview_id, body.answer)
    except InterviewNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InterviewCompletedError as e:
        raise HTTPException(status_code=409, detail=str(e))

@router.post("/{interview_id}/violations", response_model=ViolationResponse)
async def report_violation(interview_id: int, body: ViolationRequest, background_tasks: BackgroundTasks):
    try:
        response = await interview_service.record_violation(interview_id, body.type)
    except InterviewNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InterviewCompletedError as e:
        raise HTTPException(status_code=409, detail=str(e))

    if response.status == "ended_by_proctoring":
        background_tasks.add_task(interview_service.save_partial_report, interview_id)

    return response

@router.get("/{interview_id}/report", response_model=InterviewReport, dependencies=[Depends(get_current_hr)])
async def get_report(interview_id: int):
    interview = await interview_repository.get(interview_id)
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")

    report = await report_repository.get_by_interview(interview_id)
    if report is None:
        if interview.status == "in_progress":
            raise HTTPException(status_code=404, detail="Interview is still in progress")
        raise HTTPException(status_code=404, detail="Report is not ready yet")

    return report