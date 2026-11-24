import asyncio
from io import BytesIO
from pathlib import Path
from docx import Document
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from pypdf import PdfReader

from app.adapters.logger.logger import logger

class FileParseError(Exception):
    pass

class FileParser:
    def _add_links(self, text: str, links: list[str]) -> str:
        if not text.strip() or not links:
            return text

        logger.info(f"Found {len(links)} hyperlinks in the document")
        links_block = "\n".join(f"- {link}" for link in links)
        return f"{text}\n\nLinks found in the document:\n{links_block}"

    def _read_pdf(self, content: bytes) -> str:
        reader = PdfReader(BytesIO(content))
        pages = [page.extract_text() or "" for page in reader.pages]
        text = "\n".join(pages)

        links: list[str] = []
        for page in reader.pages:
            if "/Annots" not in page:
                continue
            for annotation in page["/Annots"]:
                annotation = annotation.get_object()
                if "/A" not in annotation:
                    continue
                action = annotation["/A"]
                if "/URI" in action and str(action["/URI"]) not in links:
                    links.append(str(action["/URI"]))

        return self._add_links(text, links)

    def _read_docx(self, content: bytes) -> str:
        document = Document(BytesIO(content))
        text = "\n".join(paragraph.text for paragraph in document.paragraphs)

        links: list[str] = []
        for relation in document.part.rels.values():
            if relation.reltype == RT.HYPERLINK and relation.target_ref not in links:
                links.append(relation.target_ref)

        return self._add_links(text, links)

    def _read_txt(self, content: bytes) -> str:
        return content.decode("utf-8", errors="ignore")

    async def extract_text(self, content: bytes, filename: str) -> str:
        extension = Path(filename).suffix.lower()

        readers = {
            ".pdf": self._read_pdf,
            ".docx": self._read_docx,
            ".txt": self._read_txt,
        }

        reader = readers.get(extension)
        if reader is None:
            logger.error(f"Unsupported file type: {extension} ({filename})")
            raise FileParseError(
                f"Unsupported file type '{extension}', upload a PDF, DOCX or TXT file"
            )

        try:
            text = await asyncio.to_thread(reader, content)
        except Exception as e:
            logger.error(f"Could not read {filename}: {e}")
            raise FileParseError(f"Could not read the file '{filename}', it may be corrupted") from e

        text = text.strip()

        if not text:
            logger.warning(f"No text extracted from {filename}")
            raise FileParseError(
                "No text could be extracted from the file, scanned PDFs are not supported"
            )

        logger.info(f"Extracted {len(text)} characters from {filename}")
        return text

file_parser = FileParser()