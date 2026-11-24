from typing import Literal

from app.adapters.llm.azure_openai import llm
from app.adapters.logger.logger import logger
from app.prompts.loader import get_prompt_template
from app.schemas.gap_analysis import FocusArea, GapAnalysis
from app.schemas.interview import AnswerEvaluation, InterviewQuestion, Turn
from app.schemas.job_description import JDProfile
from app.schemas.resume import ResumeProfile

# How many maximum follow-ups on one question
MAX_FOLLOW_UPS = 2

class InterviewerService:
    def __init__(self):
        self.question_llm = llm.with_structured_output(InterviewQuestion)
        self.evaluation_llm = llm.with_structured_output(AnswerEvaluation)

    async def generate_question(
        self,
        resume: ResumeProfile,
        jd: JDProfile,
        gap: GapAnalysis,
        turns: list[Turn],
        question_number: int,
        max_questions: int,
        mode: Literal["intro", "topic", "follow_up", "coding"],
        focus: FocusArea | None = None,
        follow_up_focus: str | None = None,
        repo_notes: str | None = None,
    ) -> InterviewQuestion:
        logger.info(f"Generating question {question_number}/{max_questions} (mode: {mode})")

        if mode in ("topic", "coding") and focus is None:
            logger.error(f"{mode} mode needs a focus area")
            raise ValueError(f"focus is required when mode is '{mode}'")

        if mode == "follow_up" and not follow_up_focus:
            logger.error("Follow-up mode needs a follow_up_focus")
            raise ValueError("follow_up_focus is required when mode is 'follow_up'")

        prompt = get_prompt_template("interviewer.jinja2").render(
            jd=jd,
            resume_json=resume.model_dump_json(indent=2),
            jd_json=jd.model_dump_json(indent=2),
            gap_json=gap.model_dump_json(indent=2),
            repo_notes=repo_notes,
            turns=turns,
            question_number=question_number,
            max_questions=max_questions,
            mode=mode,
            focus_topic=focus.topic if focus else None,
            focus_reason=focus.reason if focus else None,
            focus_priority=focus.priority if focus else None,
            follow_up_focus=follow_up_focus,
        )

        try:
            question = await self.question_llm.ainvoke(prompt)
        except Exception as e:
            logger.error(f"Question generation failed (mode: {mode}): {e}")
            raise

        logger.info(
            f"Question generated: topic '{question.topic}', "
            f"type {question.question_type}, difficulty {question.difficulty}"
        )
        return question

    async def evaluate_answer(
        self,
        resume: ResumeProfile,
        jd: JDProfile,
        question: InterviewQuestion,
        answer: str,
        follow_up_count: int,
    ) -> AnswerEvaluation:
        logger.info(f"Evaluating answer for topic: {question.topic}")

        prompt = get_prompt_template("evaluator.jinja2").render(
            jd_json=jd.model_dump_json(indent=2),
            resume_json=resume.model_dump_json(indent=2),
            question=question,
            answer=answer,
            follow_up_count=follow_up_count,
            max_follow_ups=MAX_FOLLOW_UPS,
        )

        try:
            evaluation = await self.evaluation_llm.ainvoke(prompt)
        except Exception as e:
            logger.error(f"Answer evaluation failed for topic {question.topic}: {e}")
            raise

        logger.info(
            f"Answer evaluated: accuracy {evaluation.technical_accuracy}, "
            f"depth {evaluation.depth}, communication {evaluation.communication}, "
            f"follow up: {evaluation.should_follow_up}"
        )
        return evaluation

interviewer_service = InterviewerService()