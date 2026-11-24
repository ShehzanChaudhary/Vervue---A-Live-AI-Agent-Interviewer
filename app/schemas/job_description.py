from pydantic import BaseModel, Field

class JDProfile(BaseModel):
    job_title: str | None = Field(default=None, description="Title of the role")
    company: str | None = Field(default=None, description="Company name if mentioned")
    seniority: str | None = Field(
        default=None,
        description="Level of the role, e.g. 'intern', 'junior', 'mid', 'senior', 'lead'",
    )
    min_experience_years: float | None = Field(
        default=None,
        description="Minimum years of experience required, 0 if freshers are welcome",
    )
    required_skills: list[str] = Field(
        default_factory=list,
        description="Skills and technologies that are mandatory for the role",
    )
    preferred_skills: list[str] = Field(
        default_factory=list,
        description="Nice-to-have or bonus skills, not mandatory",
    )
    responsibilities: list[str] = Field(
        default_factory=list,
        description="What the person will do in this role, as short points",
    )
    domain: str | None = Field(
        default=None,
        description="Business or technical domain, e.g. 'fintech', 'GenAI', 'backend'",
    )
    summary: str | None = Field(
        default=None, description="2-3 line summary of what this role is about"
    )