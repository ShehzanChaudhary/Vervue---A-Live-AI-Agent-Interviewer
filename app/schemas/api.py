from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.interview import InterviewQuestion

class StartInterviewResponse(BaseModel):
    interview_id: int = Field(description="Use this id in all further calls for this interview")
    question: InterviewQuestion
    question_number: int
    max_questions: int

class AnswerRequest(BaseModel):
    answer: str = Field(min_length=1, description="Candidate's answer to the current question")

class AnswerResponse(BaseModel):
    status: Literal["in_progress", "completed"]
    question_number: int
    max_questions: int
    next_question: InterviewQuestion | None = Field(
        default=None, description="Next question, None when the interview is completed"
    )

class ViolationRequest(BaseModel):
    type: Literal["tab_switch", "fullscreen_exit", "camera_off"]

class ViolationResponse(BaseModel):
    status: Literal["in_progress", "ended_by_proctoring"]
    violation_count: int
    warnings_left: int