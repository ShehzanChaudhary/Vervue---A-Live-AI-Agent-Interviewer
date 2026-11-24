from langchain_openai import AzureChatOpenAI

from app.adapters.logger.logger import logger
from app.core.config import settings

llm = AzureChatOpenAI(
    azure_endpoint=settings.azure_openai_endpoint,
    api_key=settings.azure_openai_api_key,
    api_version=settings.azure_openai_api_version,
    azure_deployment=settings.azure_openai_chat_deployment,
    max_retries=2,
    timeout=60,
)

logger.info(f"LLM adapter ready (deployment: {settings.azure_openai_chat_deployment})")