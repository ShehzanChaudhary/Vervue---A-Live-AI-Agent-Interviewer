from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.adapters.parser.file_parser import FileParseError
from app.adapters.logger.logger import logger
from app.repositories.report_repository import report_repository
from app.schemas.api import AnswerRequest, AnswerResponse, StartInterviewResponse, ViolationResponse, ViolationRequest
from app.schemas.report import InterviewReport
from app.services.interview_service import (
    InterviewCompletedError,
    InterviewNotFoundError,
    interview_service,
)

router = APIRouter(prefix="/interviews", tags=["interviews"])

@router.post("", response_model=StartInterviewResponse)
async def start_interview(name: str = Form(...), email: str = Form(...), jd_text: str = Form(...), max_questions: int = Form(6, ge=1, le=15), resume: UploadFile = File(...)):
    content = await resume.read()
    if not content:
        raise HTTPException(status_code=400, detail="Resume file is empty")

    logger.info(f"POST /interviews, resume file: {resume.filename}")

    try:
        return await interview_service.start(
            name=name,
            email=email,
            resume_content=content,
            resume_filename=resume.filename or "",
            jd_text=jd_text,
            max_questions=max_questions,
        )
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
async def report_violation(interview_id: int, body: ViolationRequest):
    try:
        return await interview_service.record_violation(interview_id, body.type)
    except InterviewNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InterviewCompletedError as e:
        raise HTTPException(status_code=409, detail=str(e))

@router.get("/{interview_id}/report", response_model=InterviewReport)
async def get_report(interview_id: int):
    report = await report_repository.get_by_interview(interview_id)
    if report is None:
        raise HTTPException(
            status_code=404,
            detail="Report not found, interview may still be in progress",
        )
    return report

