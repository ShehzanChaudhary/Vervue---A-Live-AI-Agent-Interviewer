from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined, Template
from jinja2.exceptions import TemplateNotFound

from app.adapters.logger.logger import logger

PROMPTS_DIR = Path(__file__).parent

env = Environment(
    loader=FileSystemLoader(PROMPTS_DIR),
    undefined=StrictUndefined,
    trim_blocks=True,
    lstrip_blocks=True,
)

def get_prompt_template(name: str) -> Template:
    try:
        return env.get_template(name)
    except TemplateNotFound:
        logger.error(f"Prompt template not found: {name}")
        raise