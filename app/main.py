from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.adapters.db.checkpointer import checkpointer
from app.adapters.db.database import close_db, init_db
from app.adapters.logger.logger import logger
from app.routes.interview import router as interview_router
from app.services.interview_service import interview_service
from app.routes.anam import router as anam_router
from pathlib import Path

from fastapi.staticfiles import StaticFiles

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting up")
    await init_db()
    saver = await checkpointer.init()
    interview_service.init(saver)
    logger.info("Startup complete")

    try:
        yield
    finally:
        logger.info("Application shutting down")
        await checkpointer.close()
        await close_db()
        logger.info("Shutdown complete")


app = FastAPI(title="AI Interview Prep Platform", lifespan=lifespan)

app.include_router(interview_router)
app.include_router(anam_router)

@app.get("/health")
async def health():
    return {"status": "ok"}

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")