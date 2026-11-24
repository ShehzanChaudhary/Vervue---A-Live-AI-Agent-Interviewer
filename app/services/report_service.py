from app.adapters.llm.azure_openai import llm
from app.adapters.logger.logger import logger
from app.prompts.loader import get_prompt_template
from app.schemas.gap_analysis import GapAnalysis
from app.schemas.interview import Turn
from app.schemas.job_description import JDProfile
from app.schemas.report import (
    CodingResult,
    InterviewReport,
    ProctoringSummary,
    QuestionResult,
    ReportAnalysis,
    ScoreSummary,
)
from app.schemas.resume import ResumeProfile

# Violation type (DB mein jo string save hoti hai) -> ProctoringSummary ka field
# TODO: ye 3 strings placeholder hain, asli strings se match karni hain
VIOLATION_FIELDS = {
    "tab_switch": "tab_switches",
    "fullscreen_exit": "fullscreen_exits",
    "camera_off": "camera_off",
}

class ReportService:
    def __init__(self):
        self.analysis_llm = llm.with_structured_output(ReportAnalysis)

    def _scored_turns(self, turns: list[Turn]) -> list[Turn]:
        # Intro ka score role ki ability nahi batata, isliye bahar
        return [t for t in turns if t.question.question_type != "intro"]

    def _coding_turns(self, turns: list[Turn]) -> list[Turn]:
        return [t for t in turns if t.question.question_type == "coding"]

    def _turn_score(self, turn: Turn) -> float:
        e = turn.evaluation
        return (e.technical_accuracy + e.depth + e.communication) / 3

    def _average(self, values: list[float]) -> float | None:
        if not values:
            return None
        return round(sum(values) / len(values), 1)

    def _split_coding_answer(self, answer: str) -> tuple[str, str]:
        # Coding answer ka format: "Code:\n...\nExplanation:\n..."
        code, marker, explanation = answer.rpartition("Explanation:")
        if not marker:
            code, explanation = answer, ""

        code = code.strip()
        if code.startswith("Code:"):
            code = code[len("Code:"):].strip()

        return code, explanation.strip()

    def calculate_scores(self, turns: list[Turn]) -> ScoreSummary:
        scored = self._scored_turns(turns)
        if not scored:
            raise ValueError("no scored turns, only the introduction was answered")

        technical_turns = [t for t in scored if t.question.question_type != "coding"]
        coding_turns = self._coding_turns(scored)

        overall = sum(self._turn_score(t) for t in scored) / len(scored) * 10

        return ScoreSummary(
            questions_answered=len(scored),
            technical=self._average(
                [(t.evaluation.technical_accuracy + t.evaluation.depth) / 2 for t in technical_turns]
            ),
            communication=self._average([t.evaluation.communication for t in scored]),
            coding=self._average([self._turn_score(t) for t in coding_turns]),
            overall_score=round(overall),
        )

    def build_coding(self, turns: list[Turn]) -> CodingResult | None:
        coding_turns = self._coding_turns(turns)
        if not coding_turns:
            return None

        turn = coding_turns[0]
        code, explanation = self._split_coding_answer(turn.answer)

        return CodingResult(
            problem=turn.question.problem_statement or turn.question.question,
            code=code,
            explanation=explanation,
            evaluation=turn.evaluation.feedback,
            score=round(self._turn_score(turn), 1),
        )

    def build_questions(self, turns: list[Turn]) -> list[QuestionResult]:
        results = []

        for number, turn in enumerate(self._scored_turns(turns), start=1):
            answer = turn.answer
            if turn.question.question_type == "coding":
                # Code alag coding section mein dikhta hai, yahan sirf bola hua explanation
                _, explanation = self._split_coding_answer(turn.answer)
                answer = explanation or turn.answer

            results.append(
                QuestionResult(
                    number=number,
                    topic=turn.question.topic,
                    question_type=turn.question.question_type,
                    question=turn.question.question,
                    answer=answer,
                    evaluation=turn.evaluation.feedback,
                    score=round(self._turn_score(turn), 1),
                )
            )

        return results

    def build_proctoring(self, violations: list[dict]) -> ProctoringSummary:
        counts = {"tab_switches": 0, "fullscreen_exits": 0, "camera_off": 0}

        for violation in violations:
            field = VIOLATION_FIELDS.get(violation["type"])
            if field is None:
                logger.warning(f"Unknown violation type, not counted: {violation['type']}")
                continue
            counts[field] += 1

        return ProctoringSummary(**counts)

    async def generate_report(
        self,
        resume: ResumeProfile,
        jd: JDProfile,
        gap: GapAnalysis,
        turns: list[Turn],
        violations: list[dict],
        ended_by_proctoring: bool,
        github_url: str | None = None,
        repo_notes: str | None = None,
    ) -> InterviewReport:
        logger.info(f"Generating report for {len(turns)} turns, ended_by_proctoring={ended_by_proctoring}")

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
            ended_by_proctoring=ended_by_proctoring,
        )

        try:
            analysis = await self.analysis_llm.ainvoke(prompt)
        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            raise

        logger.info(
            f"Report generated: {analysis.recommendation}, "
            f"{len(analysis.strengths)} strengths, {len(analysis.gaps)} gaps"
        )

        return InterviewReport(
            job_title=jd.job_title,
            ended_by_proctoring=ended_by_proctoring,
            scores=scores,
            analysis=analysis,
            coding=self.build_coding(turns),
            proctoring=self.build_proctoring(violations),
            questions=self.build_questions(turns),
            github_url=github_url,
            repo_notes=repo_notes,
        )

report_service = ReportService()