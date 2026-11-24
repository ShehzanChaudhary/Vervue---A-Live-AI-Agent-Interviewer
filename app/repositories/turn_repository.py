from sqlalchemy import select

from app.adapters.db.database import session_factory
from app.adapters.logger.logger import logger
from app.models.turn import TurnRecord
from app.schemas.interview import AnswerEvaluation, InterviewQuestion, Turn

class TurnRepository:
    async def save(self, interview_id: int, turn_number: int, turn: Turn) -> TurnRecord:
        record = TurnRecord(
            interview_id=interview_id,
            turn_number=turn_number,
            topic=turn.question.topic,
            question_type=turn.question.question_type,
            difficulty=turn.question.difficulty,
            question=turn.question.question,
            answer=turn.answer,
            technical_accuracy=turn.evaluation.technical_accuracy,
            depth=turn.evaluation.depth,
            communication=turn.evaluation.communication,
            strengths=turn.evaluation.strengths,
            weaknesses=turn.evaluation.weaknesses,
            feedback=turn.evaluation.feedback,
            should_follow_up=turn.evaluation.should_follow_up,
            follow_up_focus=turn.evaluation.follow_up_focus,
        )
        async with session_factory() as session:
            session.add(record)
            await session.commit()
            await session.refresh(record)

        logger.info(f"Turn {turn_number} saved for interview {interview_id}")
        return record

    async def list_by_interview(self, interview_id: int) -> list[Turn]:
        async with session_factory() as session:
            result = await session.execute(
                select(TurnRecord)
                .where(TurnRecord.interview_id == interview_id)
                .order_by(TurnRecord.turn_number)
            )
            records = result.scalars().all()

        return [self._to_turn(record) for record in records]

    async def count(self, interview_id: int) -> int:
        turns = await self.list_by_interview(interview_id)
        return len(turns)

    def _to_turn(self, record: TurnRecord) -> Turn:
        return Turn(
            question=InterviewQuestion(
                question=record.question,
                topic=record.topic,
                question_type=record.question_type,
                difficulty=record.difficulty,
            ),
            answer=record.answer,
            evaluation=AnswerEvaluation(
                technical_accuracy=record.technical_accuracy,
                depth=record.depth,
                communication=record.communication,
                strengths=record.strengths,
                weaknesses=record.weaknesses,
                feedback=record.feedback,
                should_follow_up=record.should_follow_up,
                follow_up_focus=record.follow_up_focus,
            ),
        )

turn_repository = TurnRepository()