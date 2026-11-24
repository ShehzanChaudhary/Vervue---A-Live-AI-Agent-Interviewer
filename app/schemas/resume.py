from pydantic import BaseModel, Field

class Experience(BaseModel):
    company: str = Field(description="Company name")
    role: str = Field(description="Job title or role")
    duration: str | None = Field(default=None, description="e.g. 'Jan 2023 - Present'")
    responsibilities: list[str] = Field(
        default_factory=list, description="Key work done in this role"
    )
    technologies: list[str] = Field(
        default_factory=list, description="Tools and technologies used in this role"
    )

class Project(BaseModel):
    name: str = Field(description="Project name")
    description: str | None = Field(default=None, description="What the project does")
    repo_url: str | None = Field(
        default=None,
        description="GitHub repository URL of this project, only if the resume text or the links section clearly shows it belongs to this project",
    )
    technologies: list[str] = Field(
        default_factory=list, description="Tech stack used in the project"
    )
    highlights: list[str] = Field(
        default_factory=list, description="Notable results, features or impact"
    )

class Education(BaseModel):
    institution: str = Field(description="College or university name")
    degree: str | None = Field(default=None, description="Degree and branch")
    year: str | None = Field(default=None, description="Graduation year or duration")

class ResumeProfile(BaseModel):
    name: str | None = Field(default=None, description="Candidate's full name")
    github_url: str | None = Field(
        default=None,
        description="Candidate's GitHub profile URL, only if it is written in the resume or listed in the links section",
    )
    summary: str | None = Field(
        default=None, description="2-3 line summary of the candidate's profile"
    )
    skills: list[str] = Field(
        default_factory=list, description="All technical and soft skills mentioned"
    )
    experience: list[Experience] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    total_experience_years: float | None = Field(
        default=None, description="Total years of work experience, 0 for freshers"
    )