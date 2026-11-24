from typing import Literal

from pydantic import BaseModel, Field

class FocusArea(BaseModel):
    topic: str = Field(description="Topic to ask about, e.g. 'RAG pipelines' or 'Docker'")
    reason: str = Field(
        description="Why this topic matters, based on the resume and the job description"
    )
    priority: Literal["high", "medium", "low"] = Field(
        description="How important this topic is for the interview"
    )

class GapAnalysis(BaseModel):
    match_score: int = Field(
        ge=0,
        le=100,
        description="Overall fit of the candidate for this role, from 0 to 100",
    )
    matched_skills: list[str] = Field(
        default_factory=list,
        description="Skills asked in the job description that the candidate has",
    )
    missing_required_skills: list[str] = Field(
        default_factory=list,
        description="Required skills from the job description that the candidate does not show",
    )
    missing_preferred_skills: list[str] = Field(
        default_factory=list,
        description="Preferred skills from the job description that the candidate does not show",
    )
    experience_fit: Literal["below", "meets", "exceeds", "unknown"] = Field(
        description="Candidate's experience compared to the minimum experience in the job description"
    )
    experience_note: str | None = Field(
        default=None, description="One line explaining the experience comparison"
    )
    strengths: list[str] = Field(
        default_factory=list,
        description="Areas where the candidate looks strong for this role",
    )
    concerns: list[str] = Field(
        default_factory=list,
        description="Areas where the candidate looks weak or unclear for this role",
    )
    projects_to_probe: list[str] = Field(
        default_factory=list,
        description="Names of resume projects most relevant to this role, to ask deep questions on",
    )
    focus_areas: list[FocusArea] = Field(
        default_factory=list,
        description="Topics the interviewer should cover, most important first",
    )