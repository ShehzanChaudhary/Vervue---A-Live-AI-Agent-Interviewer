from fastapi import APIRouter, HTTPException

from app.adapters.anam.anam_client import anam_client, AnamError
from app.adapters.logger.logger import logger

router = APIRouter(prefix="/anam", tags=["anam"])

@router.post("/session-token")
async def create_session_token():
    logger.info("POST /anam/session-token")
    try:
        token = await anam_client.create_session_token()
    except AnamError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {"sessionToken": token}