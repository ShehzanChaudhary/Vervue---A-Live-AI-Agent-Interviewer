from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

class CreateJobRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=200, description="Requisition title")
    department: str | None = Field(default=None, max_length=100)
    level: Literal["Entry Level", "Mid-Level", "Senior", "Staff/Principal", "Manager/Director"]
    jd_text: str = Field(min_length=1, description="Raw job description pasted by HR")
    max_questions: int = Field(ge=2, le=15, description="Number of interview questions")

    @field_validator("department")
    @classmethod
    def empty_department_to_none(cls, value: str | None) -> str | None:
        return value or None

class JobStatusRequest(BaseModel):
    is_active: bool

class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    title: str
    department: str | None
    level: str
    jd_text: str
    max_questions: int
    is_active: bool
    created_at: datetime

class PublicJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str
    department: str | None