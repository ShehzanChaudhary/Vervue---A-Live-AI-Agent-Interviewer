from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.models.hr_user import HRUser
from app.repositories.hr_user_repository import hr_user_repository
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import (
    InvalidCredentialsError,
    InvalidTokenError,
    auth_service,
)

router = APIRouter(prefix="/auth", tags=["auth"])

bearer_scheme = HTTPBearer(auto_error=False)

UNAUTHORIZED_HEADERS = {"WWW-Authenticate": "Bearer"}

async def get_current_hr(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> HRUser:
    if credentials is None:
        raise HTTPException(
            status_code=401, detail="Not authenticated", headers=UNAUTHORIZED_HEADERS
        )

    try:
        hr_id = auth_service.decode_token(credentials.credentials)
    except InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=str(e), headers=UNAUTHORIZED_HEADERS)

    hr = await hr_user_repository.get(hr_id)
    if hr is None:
        raise HTTPException(
            status_code=401, detail="HR user not found", headers=UNAUTHORIZED_HEADERS
        )

    return hr

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    try:
        token = await auth_service.login(body.email, body.password)
    except InvalidCredentialsError as e:
        raise HTTPException(status_code=401, detail=str(e), headers=UNAUTHORIZED_HEADERS)

    return TokenResponse(access_token=token)