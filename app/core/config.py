from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # ---- App ----
    app_name: str = "AI Interview Prep"
    environment: str = "development"
    log_level: str = "INFO"

    # Azure OpenAI
    azure_openai_endpoint: str
    azure_openai_api_key: str
    azure_openai_api_version: str = "2024-10-21"
    azure_openai_chat_deployment: str

    # Database
    database_url: str = "sqlite+aiosqlite:///./interview.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Checkpointer
    checkpoint_db_path: str = "checkpoints.db"

    # GitHub
    github_token: str | None = None

    # ANAM
    anam_api_key: str | None = None
    anam_avatar_id: str | None = None
    anam_voice_id: str | None = None

    # HR auth
    hr_email: str
    hr_password: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

settings = Settings()