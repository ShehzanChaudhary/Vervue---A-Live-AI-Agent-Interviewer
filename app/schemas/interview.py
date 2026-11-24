import operator
from typing import Annotated, Literal, TypedDict

from pydantic import BaseModel, Field

from app.schemas.gap_analysis import GapAnalysis
from app.schemas.job_description import JDProfile
from app.schemas.resume import ResumeProfile

class InterviewQuestion(BaseModel):
    question: str = Field(description="The question to ask the candidate, in natural spoken language")
    topic: str = Field(description="Topic this question belongs to, e.g. 'RAG pipelines'")
    question_type: Literal["intro", "technical", "project", "behavioral", "follow_up", "coding"] = Field(
        description="Kind of question"
    )
    difficulty: Literal["easy", "medium", "hard"] = Field(
        description="Difficulty of the question for this candidate"
    )
    problem_statement: str | None = Field(
        default=None,
        description="Full written coding problem shown in the notepad. Only for coding questions, otherwise None",
    )

class AnswerEvaluation(BaseModel):
    technical_accuracy: int = Field(
        ge=0, le=10, description="How correct the answer is, 0 to 10"
    )
    depth: int = Field(
        ge=0, le=10, description="How deep and detailed the understanding is, 0 to 10"
    )
    communication: int = Field(
        ge=0, le=10, description="How clear and well structured the answer is, 0 to 10"
    )
    strengths: list[str] = Field(
        default_factory=list, description="What the candidate did well in this answer"
    )
    weaknesses: list[str] = Field(
        default_factory=list, description="What was missing, wrong or unclear in this answer"
    )
    feedback: str = Field(description="One or two lines of feedback on this answer")
    should_follow_up: bool = Field(
        description="True if the interviewer should dig deeper into this answer"
    )
    follow_up_focus: str | None = Field(
        default=None,
        description="What the follow-up should dig into, if should_follow_up is true",
    )

class Turn(BaseModel):
    question: InterviewQuestion
    answer: str
    evaluation: AnswerEvaluation

class InterviewState(TypedDict):
    # Inputs, set once at the start
    resume: ResumeProfile
    jd: JDProfile
    gap: GapAnalysis
    max_questions: int

    # Notes from the candidate's GitHub repos, filled once at the start
    # None when there is no GitHub link or the research failed
    repo_notes: str | None

    # Progress
    turns: Annotated[list[Turn], operator.add]
    current_question: InterviewQuestion | None
    current_answer: str | None
    question_count: int
    follow_up_count: int
    focus_index: int
    status: Literal["in_progress", "completed"]