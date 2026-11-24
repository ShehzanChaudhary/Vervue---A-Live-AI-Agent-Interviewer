from datetime import date

from app.adapters.llm.azure_openai import llm
from app.adapters.logger.logger import logger
from app.adapters.parser.file_parser import file_parser
from app.prompts.loader import get_prompt_template
from app.schemas.job_description import JDProfile
from app.schemas.resume import ResumeProfile
from app.schemas.gap_analysis import GapAnalysis

class ProfileService:
    def __init__(self):
        self.resume_llm = llm.with_structured_output(ResumeProfile)
        self.jd_llm = llm.with_structured_output(JDProfile)
        self.gap_llm = llm.with_structured_output(GapAnalysis)

    async def parse_resume(self, content: bytes, filename: str) -> ResumeProfile:
        logger.info(f"Parsing resume: {filename}")

        resume_text = await file_parser.extract_text(content, filename)

        prompt = get_prompt_template("resume_parser.jinja2").render(
            resume_text=resume_text,
            current_date=date.today().isoformat()
        )

        try:
            profile = await self.resume_llm.ainvoke(prompt)
        except Exception as e:
            logger.error(f"Resume parsing failed for {filename}: {e}")
            raise

        logger.info(
            f"Resume parsed: {len(profile.skills)} skills, "
            f"{len(profile.experience)} experiences, {len(profile.projects)} projects"
        )
        return profile
    
    async def parse_jd(self, jd_text: str) -> JDProfile:
        logger.info("Parsing job description")

        prompt = get_prompt_template("jd_parser.jinja2").render(jd_text=jd_text)

        try:
            profile = await self.jd_llm.ainvoke(prompt)
        except Exception as e:
            logger.error(f"JD parsing failed: {e}")
            raise

        logger.info(
            f"JD parsed: {profile.job_title}, "
            f"{len(profile.required_skills)} required skills"
        )
        return profile

    async def analyze_gap(self, resume: ResumeProfile, jd: JDProfile) -> GapAnalysis:
        logger.info("Analyzing gap between resume and job description")

        prompt = get_prompt_template("gap_analysis.jinja2").render(
            resume_json=resume.model_dump_json(indent=2),
            jd_json=jd.model_dump_json(indent=2)
        )

        try:
            analysis = await self.gap_llm.ainvoke(prompt)
        except Exception as e:
            logger.error(f"Gap analysis failed: {e}")
            raise

        logger.info(
            f"Gap analysis done: score {analysis.match_score}, "
            f"{len(analysis.missing_required_skills)} missing required skills, "
            f"{len(analysis.focus_areas)} focus areas"
        )
        return analysis

profile_service = ProfileService()