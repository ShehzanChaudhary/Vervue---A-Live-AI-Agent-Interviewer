import json

from langchain_core.tools import tool

from app.adapters.github.github_client import GitHubError, github_client
from app.adapters.logger.logger import logger

@tool
async def list_user_repos(profile_url: str) -> str:
    """List the public repositories of a candidate from their GitHub profile URL
    (like https://github.com/username). Use this when the project has no direct
    repository link, to find the repository that matches a project name."""
    try:
        username = github_client.parse_username(profile_url)
        repos = await github_client.list_user_repos(username)
        return json.dumps(repos, ensure_ascii=False)
    except GitHubError as e:
        logger.warning(f"list_user_repos tool failed: {e}")
        return f"Error: {e}"

@tool
async def get_repo_overview(repo_url: str) -> str:
    """Get an overview of a GitHub repository from its URL
    (like https://github.com/username/repo): description, languages, a short
    README and the top-level files. Use this first to understand what the project
    really is before asking about it."""
    try:
        owner, repo = github_client.parse_repo_url(repo_url)
        overview = await github_client.get_repo_overview(owner, repo)
        return json.dumps(overview, ensure_ascii=False)
    except GitHubError as e:
        logger.warning(f"get_repo_overview tool failed: {e}")
        return f"Error: {e}"

@tool
async def list_repo_tree(repo_url: str) -> str:
    """List the paths of all code files in a GitHub repository in one call
    (like https://github.com/username/repo). Use this to find the important
    files before reading any of them. Only read paths that appear in this list."""
    try:
        owner, repo = github_client.parse_repo_url(repo_url)
        tree = await github_client.list_tree(owner, repo)
        return json.dumps(tree, ensure_ascii=False)
    except GitHubError as e:
        logger.warning(f"list_repo_tree tool failed: {e}")
        return f"Error: {e}"
    
@tool
async def list_repo_files(repo_url: str, path: str = "") -> str:
    """List the files and folders inside a folder of a GitHub repository.
    Leave path empty for the top level, or give a folder path like 'app/services'.
    Use this to decide which file to open."""
    try:
        owner, repo = github_client.parse_repo_url(repo_url)
        files = await github_client.list_files(owner, repo, path)
        return json.dumps(files, ensure_ascii=False)
    except GitHubError as e:
        logger.warning(f"list_repo_files tool failed: {e}")
        return f"Error: {e}"

@tool
async def read_repo_file(repo_url: str, file_path: str) -> str:
    """Read one code file from a GitHub repository (first 200 lines only).
    Give the exact file path like 'app/services/rag_service.py'. Use this to
    ask the candidate a question about code they wrote."""
    try:
        owner, repo = github_client.parse_repo_url(repo_url)
        return await github_client.read_file(owner, repo, file_path)
    except GitHubError as e:
        logger.warning(f"read_repo_file tool failed: {e}")
        return f"Error: {e}"

github_tools = [list_user_repos, get_repo_overview, list_repo_tree, read_repo_file]