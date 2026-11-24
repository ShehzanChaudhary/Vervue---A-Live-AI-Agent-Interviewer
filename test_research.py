import asyncio

from app.services.repo_research import run_repo_research  
from app.schemas.job_description import JDProfile
from app.schemas.resume import Project, ResumeProfile

resume = ResumeProfile(
    github_url="https://github.com/ShehzanChaudhary",
    projects=[Project(name="AI Powered Loan Origination System")],  
)
jd = JDProfile.model_construct(job_title="AI Engineer", company=None)

notes = asyncio.run(run_repo_research(resume, jd))
print(notes)