from sqlalchemy import select

from app.adapters.db.database import session_factory
from app.adapters.logger.logger import logger
from app.models.hr_user import HRUser

class HRUserRepository:
    async def create(self, email: str, password_hash: str) -> HRUser:
        hr = HRUser(email=email.strip().lower(), password_hash=password_hash)
        async with session_factory() as session:
            session.add(hr)
            await session.commit()
            await session.refresh(hr)

        logger.info(f"HR user {hr.id} created")
        return hr

    async def get(self, hr_id: int) -> HRUser | None:
        async with session_factory() as session:
            return await session.get(HRUser, hr_id)

    async def get_by_email(self, email: str) -> HRUser | None:
        async with session_factory() as session:
            result = await session.execute(select(HRUser).where(HRUser.email == email.strip().lower()))
            return result.scalar_one_or_none()

hr_user_repository = HRUserRepository()