from app.adapters.llm.azure_openai import llm
from app.adapters.logger.logger import logger
from app.prompts.loader import get_prompt_template
from app.schemas.gap_analysis import GapAnalysis
from app.schemas.interview import Turn
from app.schemas.job_description import JDProfile
from app.schemas.report import InterviewReport, ReportAnalysis, ScoreSummary
from app.schemas.resume import ResumeProfile

class ReportService:
    def __init__(self):
        self.analysis_llm = llm.with_structured_output(ReportAnalysis)

    def calculate_scores(self, turns: list[Turn]) -> ScoreSummary:
        count = len(turns)

        avg_accuracy = sum(t.evaluation.technical_accuracy for t in turns) / count
        avg_depth = sum(t.evaluation.depth for t in turns) / count
        avg_communication = sum(t.evaluation.communication for t in turns) / count

        overall = (avg_accuracy + avg_depth + avg_communication) / 3 * 10

        return ScoreSummary(
            questions_answered=count,
            avg_technical_accuracy=round(avg_accuracy, 1),
            avg_depth=round(avg_depth, 1),
            avg_communication=round(avg_communication, 1),
            overall_score=round(overall),
        )

    async def generate_report(
        self,
        resume: ResumeProfile,
        jd: JDProfile,
        gap: GapAnalysis,
        turns: list[Turn],
    ) -> InterviewReport:
        logger.info(f"Generating report for {len(turns)} turns")

        if not turns:
            logger.error("Cannot generate report, no turns in the interview")
            raise ValueError("turns is empty, nothing to report")

        scores = self.calculate_scores(turns)
        logger.info(f"Scores calculated: overall {scores.overall_score}/100")

        prompt = get_prompt_template("report_writer.jinja2").render(
            jd_json=jd.model_dump_json(indent=2),
            resume_json=resume.model_dump_json(indent=2),
            gap_json=gap.model_dump_json(indent=2),
            turns=turns,
            scores=scores,
        )

        try:
            analysis = await self.analysis_llm.ainvoke(prompt)
        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            raise

        logger.info(
            f"Report generated: {len(analysis.strengths)} strengths, "
            f"{len(analysis.weaknesses)} weaknesses, "
            f"{len(analysis.improvement_areas)} improvement areas"
        )
        
        return InterviewReport(
            job_title=jd.job_title,
            scores=scores,
            analysis=analysis,
        )

report_service = ReportService()