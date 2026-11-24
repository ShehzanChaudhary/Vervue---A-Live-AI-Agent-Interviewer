from typing import Literal

from pydantic import BaseModel, Field

class Finding(BaseModel):
    title: str = Field(description="Short label for the point, 2 to 5 words")
    text: str = Field(
        description="One or two lines, based on what the candidate actually said in the interview"
    )

class Gap(Finding):
    kind: Literal["seen_in_interview", "not_covered"] = Field(
        description=(
            "'seen_in_interview' if the candidate's answers showed this weakness. "
            "'not_covered' if this is a job requirement that was never asked, worth probing in a later round"
        )
    )

class ReportAnalysis(BaseModel):
    summary: str = Field(
        description="Short overall summary of the candidate's performance for the hiring team, 3 to 4 lines"
    )
    recommendation: Literal["Strong Hire", "Hire", "Borderline", "No Hire"] = Field(
        description="Hiring signal for the company, consistent with the overall scores and the answers"
    )
    technical_understanding: str = Field(
        description="One or two lines on the candidate's technical knowledge and depth for this role"
    )
    communication: str = Field(
        description="One or two lines on how clearly and in a structured way the candidate communicated"
    )
    strengths: list[Finding] = Field(
        default_factory=list,
        description="Main strengths shown across the whole interview",
    )
    gaps: list[Gap] = Field(
        default_factory=list,
        description="Gaps the hiring team should probe further, most important first",
    )

class ScoreSummary(BaseModel):
    questions_answered: int = Field(ge=0, description="Scored questions answered (intro excluded)")
    technical: float | None = Field(
        default=None, ge=0, le=10,
        description="Average of accuracy and depth over technical turns, 0 to 10. None if no such turn",
    )
    communication: float | None = Field(
        default=None, ge=0, le=10, description="Average communication over scored turns, 0 to 10"
    )
    coding: float | None = Field(
        default=None, ge=0, le=10, description="Average of the coding turn, 0 to 10. None if no coding turn"
    )
    overall_score: int = Field(ge=0, le=100, description="Overall interview score, 0 to 100")

class CodingResult(BaseModel):
    problem: str = Field(description="Coding problem statement shown to the candidate")
    code: str = Field(description="Code the candidate wrote in the notepad")
    explanation: str = Field(description="What the candidate said while explaining the code")
    evaluation: str = Field(description="Feedback on the coding answer")
    score: float = Field(ge=0, le=10, description="Score of the coding answer, 0 to 10")

class QuestionResult(BaseModel):
    number: int = Field(ge=1, description="Question number in the interview")
    topic: str
    question_type: str
    question: str
    answer: str
    evaluation: str = Field(description="Feedback on this answer")
    score: float = Field(ge=0, le=10, description="Average of accuracy, depth and communication")

class ProctoringSummary(BaseModel):
    tab_switches: int = Field(default=0, ge=0)
    fullscreen_exits: int = Field(default=0, ge=0)
    camera_off: int = Field(default=0, ge=0)

class InterviewReport(BaseModel):
    job_title: str | None = Field(default=None, description="Role the interview was for")
    ended_by_proctoring: bool = Field(
        default=False, description="True if the interview was cut short by proctoring violations"
    )
    scores: ScoreSummary
    analysis: ReportAnalysis
    coding: CodingResult | None = None
    proctoring: ProctoringSummary
    questions: list[QuestionResult]
    github_url: str | None = None
    repo_notes: str | None = None