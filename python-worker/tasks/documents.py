"""
Document Processing Tasks
Parse, extract, analyze, and summarize documents (PDF, DOCX, TXT, etc.)
"""

from celery import Task
from typing import List, Dict, Any, Optional
import logging
from pathlib import Path
import PyPDF2
import docx
from bs4 import BeautifulSoup
import json

from python_worker.worker import app
from python_worker.services.llm_client import llm_client
from python_worker.services.vector_store import vector_store
from python_worker.config import settings

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Handles various document formats"""

    @staticmethod
    def read_pdf(file_path: str) -> Dict[str, Any]:
        """Extract text from PDF"""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                num_pages = len(pdf_reader.pages)

                text_pages = []
                for page_num, page in enumerate(pdf_reader.pages):
                    text = page.extract_text()
                    text_pages.append({
                        "page": page_num + 1,
                        "text": text.strip()
                    })

                full_text = "\n\n".join([p["text"] for p in text_pages])

                return {
                    "status": "success",
                    "format": "pdf",
                    "pages": num_pages,
                    "text": full_text,
                    "pages_data": text_pages
                }
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            return {"status": "error", "error": str(e)}

    @staticmethod
    def read_docx(file_path: str) -> Dict[str, Any]:
        """Extract text from DOCX"""
        try:
            doc = docx.Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            full_text = "\n\n".join(paragraphs)

            return {
                "status": "success",
                "format": "docx",
                "paragraphs": len(paragraphs),
                "text": full_text
            }
        except Exception as e:
            logger.error(f"DOCX extraction failed: {e}")
            return {"status": "error", "error": str(e)}

    @staticmethod
    def read_txt(file_path: str) -> Dict[str, Any]:
        """Read plain text file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()

            return {
                "status": "success",
                "format": "txt",
                "text": text
            }
        except Exception as e:
            logger.error(f"TXT reading failed: {e}")
            return {"status": "error", "error": str(e)}

    @staticmethod
    def read_html(file_path: str) -> Dict[str, Any]:
        """Extract text from HTML"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                soup = BeautifulSoup(file.read(), 'html.parser')
                text = soup.get_text(separator='\n', strip=True)

            return {
                "status": "success",
                "format": "html",
                "text": text
            }
        except Exception as e:
            logger.error(f"HTML extraction failed: {e}")
            return {"status": "error", "error": str(e)}


@app.task(bind=True, name="documents.parse")
def parse_document(
    self: Task,
    file_path: str,
    auto_detect: bool = True
) -> Dict[str, Any]:
    """
    Parse a document and extract text

    Args:
        file_path: Path to document file
        auto_detect: Auto-detect file format from extension

    Returns:
        Dict with extracted text and metadata
    """
    try:
        path = Path(file_path)

        if not path.exists():
            return {
                "status": "error",
                "task_id": self.request.id,
                "error": f"File not found: {file_path}"
            }

        # Check file size
        size_mb = path.stat().st_size / (1024 * 1024)
        if size_mb > settings.max_document_size_mb:
            return {
                "status": "error",
                "task_id": self.request.id,
                "error": f"File too large: {size_mb:.1f}MB (max: {settings.max_document_size_mb}MB)"
            }

        logger.info(f"Parsing document: {path.name} ({size_mb:.1f}MB)")

        # Process based on extension
        extension = path.suffix.lower()
        processor = DocumentProcessor()

        if extension == '.pdf':
            result = processor.read_pdf(str(path))
        elif extension in ['.docx', '.doc']:
            result = processor.read_docx(str(path))
        elif extension in ['.txt', '.md']:
            result = processor.read_txt(str(path))
        elif extension in ['.html', '.htm']:
            result = processor.read_html(str(path))
        else:
            return {
                "status": "error",
                "task_id": self.request.id,
                "error": f"Unsupported file format: {extension}"
            }

        if result["status"] == "error":
            return {
                "status": "error",
                "task_id": self.request.id,
                "error": result["error"]
            }

        return {
            "status": "success",
            "task_id": self.request.id,
            "file_name": path.name,
            "file_size_mb": round(size_mb, 2),
            "format": result["format"],
            "text": result["text"],
            "metadata": {k: v for k, v in result.items() if k not in ["status", "text"]}
        }

    except Exception as e:
        logger.error(f"Document parsing failed: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="documents.summarize")
def summarize_document(
    self: Task,
    text: str,
    style: str = "concise",
    max_length: Optional[int] = None
) -> Dict[str, Any]:
    """
    Summarize document text using Claude

    Args:
        text: Document text to summarize
        style: Summary style (concise, detailed, bullets)
        max_length: Maximum summary length in words

    Returns:
        Dict with summary
    """
    try:
        logger.info(f"Summarizing document ({len(text)} chars)")

        style_prompts = {
            "concise": "Provide a concise 2-3 paragraph summary.",
            "detailed": "Provide a detailed summary covering all major points.",
            "bullets": "Provide a bullet-point summary of key points."
        }

        style_instruction = style_prompts.get(style, style_prompts["concise"])

        prompt = f"{style_instruction}\n\nDocument:\n{text}"
        if max_length:
            prompt = f"{style_instruction} Keep it under {max_length} words.\n\nDocument:\n{text}"

        response = llm_client.generate(
            prompt=prompt,
            system="You are an expert at summarizing documents clearly and accurately.",
            temperature=0.5
        )

        return {
            "status": "success",
            "task_id": self.request.id,
            "summary": response["text"],
            "style": style,
            "original_length": len(text),
            "summary_length": len(response["text"]),
            "usage": response["usage"]
        }

    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="documents.extract_entities")
def extract_entities(
    self: Task,
    text: str,
    entity_types: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Extract named entities from document

    Args:
        text: Document text
        entity_types: Types to extract (people, organizations, locations, dates, etc.)

    Returns:
        Dict with extracted entities
    """
    try:
        logger.info("Extracting entities from document")

        if entity_types is None:
            entity_types = ["people", "organizations", "locations", "dates", "key_terms"]

        prompt = f"""Extract the following types of entities from the text and return as JSON:
{', '.join(entity_types)}

Format:
{{
  "people": [...],
  "organizations": [...],
  "locations": [...],
  "dates": [...],
  "key_terms": [...]
}}

Text:
{text[:5000]}"""  # Limit to first 5000 chars for entity extraction

        response = llm_client.generate(
            prompt=prompt,
            system="You are an expert at extracting structured information. Respond only with valid JSON.",
            temperature=0.3
        )

        # Parse JSON response
        try:
            entities = json.loads(response["text"])
        except json.JSONDecodeError:
            logger.warning("Failed to parse entities as JSON, returning raw text")
            entities = {"raw": response["text"]}

        return {
            "status": "success",
            "task_id": self.request.id,
            "entities": entities,
            "usage": response["usage"]
        }

    except Exception as e:
        logger.error(f"Entity extraction failed: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="documents.chunk_and_index")
def chunk_and_index(
    self: Task,
    file_path: str,
    collection_name: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200
) -> Dict[str, Any]:
    """
    Parse document, chunk it, and index to vector store

    Args:
        file_path: Path to document
        collection_name: Vector store collection name
        chunk_size: Size of each text chunk
        chunk_overlap: Overlap between chunks

    Returns:
        Dict with indexing results
    """
    try:
        logger.info(f"Chunking and indexing: {file_path}")

        # Parse document
        parse_result = parse_document(file_path=file_path)
        if parse_result["status"] == "error":
            return parse_result

        text = parse_result["text"]

        # Chunk text
        chunks = []
        metadatas = []

        for i in range(0, len(text), chunk_size - chunk_overlap):
            chunk = text[i:i + chunk_size]
            if chunk.strip():
                chunks.append(chunk)
                metadatas.append({
                    "source": parse_result["file_name"],
                    "chunk_index": len(chunks),
                    "format": parse_result["format"]
                })

        logger.info(f"Created {len(chunks)} chunks")

        # Index to vector store
        index_result = vector_store.add_documents(
            collection_name=collection_name,
            documents=chunks,
            metadatas=metadatas
        )

        return {
            "status": "success",
            "task_id": self.request.id,
            "file_name": parse_result["file_name"],
            "chunks_created": len(chunks),
            "indexed_to": collection_name,
            "index_result": index_result
        }

    except Exception as e:
        logger.error(f"Chunk and index failed: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }
