import jwt
import asyncio
from pwdlib import PasswordHash
from datetime import datetime, timezone, timedelta

from app.adapters.logger.logger import logger
from app.core.config import settings
from app.repositories.hr_user_repository import hr_user_repository

class InvalidCredentialsError(Exception):
    pass

class InvalidTokenError(Exception):
    pass

class AuthService:
    def __init__(self) -> None:
        self._hasher = PasswordHash.recommended()

    async def hash_password(self, password: str) -> str:
        return await asyncio.to_thread(self._hasher.hash, password)

    async def verify_password(self, password: str, password_hash: str) -> bool:
        return await asyncio.to_thread(self._hasher.verify, password, password_hash)

    def create_token(self, hr_id: int) -> str:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
        payload = {"sub": str(hr_id), "exp": expires_at}
        return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

    def decode_token(self, token: str) -> int:
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
            return int(payload["sub"])
        except (jwt.InvalidTokenError, KeyError, ValueError):
            raise InvalidTokenError("Invalid or expired token")

    async def login(self, email: str, password: str) -> str:
        hr = await hr_user_repository.get_by_email(email)
        if hr is None or not await self.verify_password(password, hr.password_hash):
            logger.warning("HR login failed")
            raise InvalidCredentialsError("Wrong email or password")

        logger.info(f"HR user {hr.id} logged in")
        return self.create_token(hr.id)

    async def seed_hr(self) -> None:
        existing = await hr_user_repository.get_by_email(settings.hr_email)
        if existing is not None:
            logger.info("HR account already exists, skipping seed")
            return

        password_hash = await self.hash_password(settings.hr_password)
        await hr_user_repository.create(settings.hr_email, password_hash)
        logger.info("HR account seeded from .env")

auth_service = AuthService()
