import aiosqlite
from langgraph.checkpoint.serde.jsonplus import JsonPlusSerializer
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from app.adapters.logger.logger import logger
from app.core.config import settings

ALLOWED_TYPES = [
    ("app.schemas.resume", "ResumeProfile"),
    ("app.schemas.job_description", "JDProfile"),
    ("app.schemas.gap_analysis", "GapAnalysis"),
    ("app.schemas.interview", "InterviewQuestion"),
    ("app.schemas.interview", "AnswerEvaluation"),
    ("app.schemas.interview", "Turn"),
]

class Checkpointer:
    def __init__(self) -> None:
        self.conn: aiosqlite.Connection | None = None
        self.saver: AsyncSqliteSaver | None = None

    async def init(self) -> AsyncSqliteSaver:
        self.conn = await aiosqlite.connect(settings.checkpoint_db_path)
        serde = JsonPlusSerializer(allowed_msgpack_modules=ALLOWED_TYPES)
        self.saver = AsyncSqliteSaver(self.conn, serde=serde)
        await self.saver.setup()
        logger.info("Checkpointer ready")
        return self.saver

    async def close(self) -> None:
        if self.conn is not None:
            await self.conn.close()
            self.conn = None
            self.saver = None
            logger.info("Checkpointer closed")

checkpointer = Checkpointer()