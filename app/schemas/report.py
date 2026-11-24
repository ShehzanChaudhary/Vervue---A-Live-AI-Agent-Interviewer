from typing import Literal

from pydantic import BaseModel, Field

class TopicFeedback(BaseModel):
    topic: str = Field(description="Topic that was covered in the interview, e.g. 'RAG pipelines'")
    rating: Literal["strong", "average", "weak"] = Field(
        description="How well the candidate handled this topic overall"
    )
    comment: str = Field(
        description="One or two lines on how the candidate did on this topic, based on their answers"
    )

class ImprovementArea(BaseModel):
    area: str = Field(description="Skill or topic the candidate should improve")
    why: str = Field(description="Why this needs improvement, based on the interview answers")
    how_to_improve: str = Field(
        description="Specific and practical steps the candidate can take to improve"
    )

class ReportAnalysis(BaseModel):
    summary: str = Field(
        description="Short overall summary of the candidate's performance, 3 to 4 lines"
    )
    technical_understanding: str = Field(
        description="Assessment of the candidate's technical knowledge and depth for this role"
    )
    communication: str = Field(
        description="Assessment of how clearly and in a structured way the candidate communicated"
    )
    strengths: list[str] = Field(
        default_factory=list,
        description="Main strengths shown across the whole interview",
    )
    weaknesses: list[str] = Field(
        default_factory=list,
        description="Main weaknesses shown across the whole interview",
    )
    topic_feedback: list[TopicFeedback] = Field(
        default_factory=list,
        description="Feedback for each topic covered, in the order they were asked",
    )
    improvement_areas: list[ImprovementArea] = Field(
        default_factory=list,
        description="Areas to improve, most important first",
    )

class ScoreSummary(BaseModel):
    # Average of turns evaluation
    questions_answered: int = Field(ge=0, description="Total questions the candidate answered")
    avg_technical_accuracy: float = Field(ge=0, le=10, description="Average technical accuracy, 0 to 10")
    avg_depth: float = Field(ge=0, le=10, description="Average depth, 0 to 10")
    avg_communication: float = Field(ge=0, le=10, description="Average communication, 0 to 10")
    overall_score: int = Field(
        ge=0, le=100, description="Overall interview score from 0 to 100"
    )

class InterviewReport(BaseModel):
    job_title: str | None = Field(default=None, description="Role the interview was for")
    scores: ScoreSummary
    analysis: ReportAnalysis