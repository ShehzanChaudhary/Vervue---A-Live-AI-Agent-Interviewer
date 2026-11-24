import base64
import httpx
from pathlib import PurePosixPath

from app.adapters.logger.logger import logger
from app.core.config import settings

GITHUB_API = "https://api.github.com"

README_MAX_CHARS = 3000
FILE_MAX_LINES = 200
FILE_MAX_CHARS = 8000
FILE_MAX_BYTES = 200_000
MAX_LIST_ITEMS = 50

SKIP_FOLDERS = {
    "node_modules", ".git", ".venv", "venv", "env", "__pycache__",
    "dist", "build", ".next", "site-packages",
}
CODE_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".rs", ".cs",
    ".cpp", ".c", ".sql", ".jinja2", ".yaml", ".yml", ".toml", ".md",
}
MAX_TREE_FILES = 150

class GitHubError(Exception):
    pass

class GitHubClient:
    def __init__(self):
        self.headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if settings.github_token:
            self.headers["Authorization"] = f"Bearer {settings.github_token}"
        else:
            logger.warning("GITHUB_TOKEN not set, GitHub API limit is only 60 requests/hour")

    async def _get(self, path: str, params: dict | None = None):
        url = f"{GITHUB_API}{path}"
        try:
            async with httpx.AsyncClient(headers=self.headers, timeout=10) as client:
                response = await client.get(url, params=params)
        except httpx.HTTPError as e:
            logger.error(f"GitHub request failed for {path}: {e}")
            raise GitHubError("Could not reach GitHub") from e

        if response.status_code == 404:
            logger.warning(f"GitHub 404 for {path}")
            raise GitHubError("Not found on GitHub (wrong name, wrong path or a private repo)")
        if response.status_code in (403, 429):
            logger.error(f"GitHub rate limit or access denied for {path}")
            raise GitHubError("GitHub rate limit reached or access denied")
        if response.is_error:
            logger.error(f"GitHub error {response.status_code} for {path}")
            raise GitHubError(f"GitHub returned an error ({response.status_code})")

        return response.json()

    def parse_username(self, profile_url: str) -> str:
        parts = profile_url.replace("https://", "").replace("http://", "").strip("/").split("/")
        if len(parts) < 2 or parts[0] not in ("github.com", "www.github.com"):
            raise GitHubError(f"Not a valid GitHub profile URL: {profile_url}")
        return parts[1]

    def parse_repo_url(self, repo_url: str) -> tuple[str, str]:
        parts = repo_url.replace("https://", "").replace("http://", "").strip("/").split("/")
        if len(parts) < 3 or parts[0] not in ("github.com", "www.github.com"):
            raise GitHubError(f"Not a valid GitHub repo URL: {repo_url}")
        return parts[1], parts[2].removesuffix(".git")

    async def list_user_repos(self, username: str) -> list[dict]:
        logger.info(f"Listing repos of GitHub user: {username}")
        data = await self._get(
            f"/users/{username}/repos", params={"per_page": 100, "sort": "updated"}
        )
        repos = [
            {
                "name": repo["name"],
                "description": repo.get("description"),
                "language": repo.get("language"),
                "url": repo["html_url"],
            }
            for repo in data
            if not repo.get("fork")
        ]
        logger.info(f"Found {len(repos)} original repos for {username}")
        return repos

    async def get_repo_overview(self, owner: str, repo: str) -> dict:
        logger.info(f"Getting overview of {owner}/{repo}")
        info = await self._get(f"/repos/{owner}/{repo}")
        languages = await self._get(f"/repos/{owner}/{repo}/languages")

        try:
            readme_data = await self._get(f"/repos/{owner}/{repo}/readme")
            readme = base64.b64decode(readme_data["content"]).decode("utf-8", errors="replace")
        except GitHubError:
            logger.info(f"No README found for {owner}/{repo}")
            readme = ""

        files = await self.list_files(owner, repo)

        return {
            "name": info["name"],
            "description": info.get("description"),
            "languages": list(languages.keys()),
            "readme": readme[:README_MAX_CHARS],
            "top_level_files": files,
        }

    async def list_tree(self, owner: str, repo: str) -> dict:
        logger.info(f"Getting file tree of {owner}/{repo}")
        data = await self._get(
            f"/repos/{owner}/{repo}/git/trees/HEAD", params={"recursive": 1}
        )

        paths = []
        for item in data.get("tree", []):
            if item["type"] != "blob":
                continue

            path = item["path"]
            folders = path.split("/")[:-1]

            if any(folder in SKIP_FOLDERS for folder in folders):
                continue
            if PurePosixPath(path).suffix.lower() not in CODE_EXTENSIONS:
                continue
            if item.get("size", 0) > FILE_MAX_BYTES:
                continue

            paths.append(path)

        logger.info(f"Found {len(paths)} code files in {owner}/{repo}")
        return {
            "files": paths[:MAX_TREE_FILES],
            "total_code_files": len(paths),
            "truncated": data.get("truncated", False) or len(paths) > MAX_TREE_FILES,
        }

    async def list_files(self, owner: str, repo: str, path: str = "") -> list[dict]:
        logger.info(f"Listing files in {owner}/{repo}/{path}")
        data = await self._get(f"/repos/{owner}/{repo}/contents/{path}")
        if not isinstance(data, list):
            raise GitHubError(f"'{path}' is a file, not a folder")
        return [
            {"path": item["path"], "type": item["type"]}
            for item in data[:MAX_LIST_ITEMS]
        ]

    async def read_file(self, owner: str, repo: str, path: str) -> str:
        logger.info(f"Reading file {owner}/{repo}/{path}")
        data = await self._get(f"/repos/{owner}/{repo}/contents/{path}")
        if isinstance(data, list):
            raise GitHubError(f"'{path}' is a folder, not a file")
        if data.get("size", 0) > FILE_MAX_BYTES:
            raise GitHubError(f"'{path}' is too large to read")

        text = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
        if "\x00" in text:
            raise GitHubError(f"'{path}' looks like a binary file")

        lines = text.splitlines()[:FILE_MAX_LINES]
        return "\n".join(lines)[:FILE_MAX_CHARS]

github_client = GitHubClient()