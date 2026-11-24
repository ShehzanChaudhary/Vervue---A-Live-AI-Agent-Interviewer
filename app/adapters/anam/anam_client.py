import httpx

from app.adapters.logger.logger import logger
from app.core.config import settings

ANAM_API = "https://api.anam.ai"

# Bypassing the ANAM LLM, and using our own
CUSTOM_LLM_ID = "CUSTOMER_CLIENT_V1"

class AnamError(Exception):
    pass

class AnamClient:
    def __init__(self):
        self.headers = {"Content-type": "application/json"}
        if settings.anam_api_key:
            self.headers["Authorization"] = f"Bearer {settings.anam_api_key}"
        else:
            logger.warning("ANAM_API_KEY not set, avatar sessions will not work")

    async def create_session_token(self) -> str:
        if not (settings.anam_api_key and settings.anam_avatar_id and settings.anam_voice_id):
            raise AnamError(
                "ANAM_API_KEY, ANAM_AVATAR_ID and ANAM_VOICE_ID must be set in .env"
            )

        body = {
            "personaConfig": {
                "avatarId": settings.anam_avatar_id,
                "voiceId": settings.anam_voice_id,
                "llmId": CUSTOM_LLM_ID,
            }
        }
        url = f"{ANAM_API}/v1/auth/session-token"
        logger.info("Creating Anam session token")

        try:
            async with httpx.AsyncClient(headers=self.headers, timeout=15) as client:
                response = await client.post(url, json=body)
        except httpx.HTTPError as e:
            logger.error(f"Anam request failed: {e}")
            raise AnamError("Could not reach Anam") from e

        if response.status_code in (401, 403):
            logger.error("Anam rejected the API key")
            raise AnamError("Anam API key is invalid or has no access")
        if response.is_error:
            logger.error(f"Anam error {response.status_code}: {response.text}")
            raise AnamError(f"Anam returned an error ({response.status_code})")

        return response.json()["sessionToken"]

anam_client = AnamClient()