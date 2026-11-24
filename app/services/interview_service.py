from datetime import datetime, timezone
from langgraph.types import Command

from app.adapters.logger.logger import logger
from app.repositories.interview_repository import interview_repository
from app.repositories.report_repository import report_repository
from app.repositories.turn_repository import turn_repository
from app.repositories.user_repository import user_repository
from app.schemas.api import AnswerResponse, StartInterviewResponse, ViolationResponse
from app.services.interview_graph import build_initial_state, build_interview_graph
from app.services.profile_service import profile_service
from app.services.report_service import report_service

MAX_WARNINGS = 2 

class InterviewNotFoundError(Exception):
    pass

class InterviewCompletedError(Exception):
    pass

class InterviewService:
    def __init__(self):
        self.graph = None

    def init(self, saver) -> None:
        # Saver initialize at the app startup (checkpointer.init()), that's why the graph is built here
        self.graph = build_interview_graph(saver)
        logger.info("Interview graph built")

    def _config(self, interview_id: int) -> dict:
        return {"configurable": {"thread_id": str(interview_id)}}

    async def start(self, name: str, email: str, resume_content: bytes, resume_filename: str, jd_text: str, max_questions: int) -> StartInterviewResponse:
        logger.info(f"Starting inteview for {email}")

        resume = await profile_service.parse_resume(resume_content, resume_filename)
        jd = await profile_service.parse_jd(jd_text)
        gap = await profile_service.analyze_gap(resume, jd)

        user = await user_repository.get_or_create(name, email)
        interview = await interview_repository.create(
            user_id=user.id,
            resume=resume, 
            jd=jd,
            gap=gap,
            max_questions=max_questions,
            job_title=jd.job_title
        )

        config = self._config(interview.id)
        initial_state = build_initial_state(resume, jd, gap, max_questions)
        await self.graph.ainvoke(initial_state, config)

        snapshot = await self.graph.aget_state(config)
        values = snapshot.values

        return StartInterviewResponse(
            interview_id=interview.id,
            question=values["current_question"],
            question_number=values["question_count"],
            max_questions=values["max_questions"]
        )

    async def answer(self, interview_id: int, answer: str) -> AnswerResponse:
        logger.info(f"Answer recieved for interview {interview_id}")

        interview = await interview_repository.get(interview_id)
        if interview is None:
            raise InterviewNotFoundError(f"Interview {interview_id} not found")

        if interview.status == "ended_by_proctoring":
            raise InterviewCompletedError(f"Interview {interview_id} was ended by proctoring")

        config = self._config(interview_id)
        snapshot = await self.graph.aget_state(config)
        if snapshot.values.get("status") == "completed":
            raise InterviewCompletedError(f"Interview {interview_id} is already completed")

        await self.graph.ainvoke(Command(resume=answer), config)

        snapshot = await self.graph.aget_state(config)
        values = snapshot.values

        # Graph keeps the new turn in checkpoint, In DB saves here
        turns = values["turns"]
        await turn_repository.save(interview_id, len(turns), turns[-1])

        if values["status"] != "completed":
            return AnswerResponse(
                status="in_progress",
                question_number=values["question_count"],
                max_questions=values["max_questions"],
                next_question=values["current_question"],
            )

        logger.info(f"Interview {interview_id} completed, generating report")
        await interview_repository.update_status(interview_id, "completed")

        report = await report_service.generate_report(
            resume=values["resume"],
            jd=values["jd"],
            gap=values["gap"],
            turns=turns,
        )
        await report_repository.save(interview_id, report)

        return AnswerResponse(
            status="completed",
            question_number=values["question_count"],
            max_questions=values["max_questions"],
            next_question=None,
            report=report,
        )

    async def record_violation(self, interview_id: int, violation_type: str) -> ViolationResponse:
        logger.info(f"Violation received for interview {interview_id}: {violation_type}")

        interview = await interview_repository.get(interview_id)
        if interview is None:
            raise InterviewNotFoundError(f"Interview {interview_id} not found")
        if interview.status != "in_progress":
            raise InterviewCompletedError(f"Interview {interview_id} is already {interview.status}")

        violation = {
            "type": violation_type,
            "count": len(interview.violations) + 1,
            "at": datetime.now(timezone.utc).isoformat(),
        }
        interview = await interview_repository.add_violation(interview_id, violation)
        count = len(interview.violations)

        if count > MAX_WARNINGS:
            await interview_repository.update_status(interview_id, "ended_by_proctoring")
            logger.info(f"Interview {interview_id} ended by proctoring after {count} violations")
            await self._save_partial_report(interview_id)
            return ViolationResponse(status="ended_by_proctoring", violation_count=count, warnings_left=0)

        return ViolationResponse(
            status="in_progress",
            violation_count=count,
            warnings_left=MAX_WARNINGS - count,
        )

    async def _save_partial_report(self, interview_id: int) -> None:
        snapshot = await self.graph.aget_state(self._config(interview_id))
        values = snapshot.values
        turns = values.get("turns", [])

        if not turns:
            logger.info(f"Interview {interview_id} has no answered questions, partial report skipped")
            return

        try:
            report = await report_service.generate_report(
                resume=values["resume"],
                jd=values["jd"],
                gap=values["gap"],
                turns=turns,
            )
            await report_repository.save(interview_id, report)
            logger.info(f"Partial report saved for interview {interview_id}")
        except Exception as e:
            logger.error(f"Partial report failed for interview {interview_id}: {e}")

interview_service = InterviewService()