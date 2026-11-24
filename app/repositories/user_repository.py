from sqlalchemy import select

from app.adapters.db.database import session_factory
from app.adapters.logger.logger import logger
from app.models.user import User

class UserRepository:
    async def create(self, name: str, email: str) -> User:
        user = User(name=name.strip(), email=email.strip().lower())
        async with session_factory() as session:
            session.add(user)
            await session.commit()
            await session.refresh(user)

        logger.info(f"User {user.id} created")
        return user

    async def get(self, user_id: int) -> User | None:
        async with session_factory() as session:
            return await session.get(User, user_id)

    async def get_by_email(self, email: str) -> User | None:
        async with session_factory() as session:
            result = await session.execute(
                select(User).where(User.email == email.strip().lower())
            )
            return result.scalar_one_or_none()

    async def get_or_create(self, name: str, email: str) -> User:
        user = await self.get_by_email(email)
        if user is not None:
            logger.info(f"User {user.id} already exists, reusing")
            return user
        return await self.create(name, email)

user_repository = UserRepository()