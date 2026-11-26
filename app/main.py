from contextlib import asynccontextmanager
from fastapi import FastAPI
from pathlib import Path
from fastapi.staticfiles import StaticFiles

from app.adapters.db.checkpointer import checkpointer
from app.adapters.db.database import close_db, init_db
from app.adapters.logger.logger import logger
from app.routes.interview import router as interview_router
from app.services.interview_service import interview_service
from app.routes.anam import router as anam_router
from app.routes.auth import router as auth_router
from app.services.auth_service import auth_service
from app.routes.jobs import router as jobs_router
from app.routes.public import router as public_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting up")
    await init_db()
    saver = await checkpointer.init()
    interview_service.init(saver)
    await auth_service.seed_hr()
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
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(public_router)

@app.get("/health")
async def health():
    return {"status": "ok"}

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")