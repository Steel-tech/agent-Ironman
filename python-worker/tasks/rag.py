"""
RAG (Retrieval Augmented Generation) Tasks
Handles document indexing, search, and context-aware responses
"""

from celery import Task
from typing import List, Dict, Any, Optional
import logging

from python_worker.worker import app
from python_worker.services.vector_store import vector_store
from python_worker.services.llm_client import llm_client

logger = logging.getLogger(__name__)


@app.task(bind=True, name="rag.index_documents")
def index_documents(
    self: Task,
    collection_name: str,
    documents: List[str],
    metadatas: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Index documents into a vector store collection

    Args:
        collection_name: Name of the collection to store documents
        documents: List of text documents to index
        metadatas: Optional metadata for each document

    Returns:
        Dict with indexing results
    """
    try:
        logger.info(f"Indexing {len(documents)} documents to '{collection_name}'")

        result = vector_store.add_documents(
            collection_name=collection_name,
            documents=documents,
            metadatas=metadatas
        )

        return {
            "status": "success",
            "task_id": self.request.id,
            "collection": collection_name,
            "indexed": len(documents),
            "result": result
        }

    except Exception as e:
        logger.error(f"Failed to index documents: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="rag.search")
def search_documents(
    self: Task,
    collection_name: str,
    query: str,
    n_results: int = 5
) -> Dict[str, Any]:
    """
    Search for similar documents in a collection

    Args:
        collection_name: Collection to search
        query: Search query
        n_results: Number of results to return

    Returns:
        Dict with search results
    """
    try:
        logger.info(f"Searching '{collection_name}' for: {query[:100]}")

        result = vector_store.search(
            collection_name=collection_name,
            query=query,
            n_results=n_results
        )

        return {
            "status": "success",
            "task_id": self.request.id,
            "query": query,
            "results": result["results"]
        }

    except Exception as e:
        logger.error(f"Search failed: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="rag.query_with_context")
def query_with_context(
    self: Task,
    collection_name: str,
    query: str,
    n_context_docs: int = 3,
    system_prompt: Optional[str] = None
) -> Dict[str, Any]:
    """
    Answer a query using RAG (search + generate)

    Args:
        collection_name: Collection to search for context
        query: User question
        n_context_docs: Number of context documents to retrieve
        system_prompt: Optional system instructions

    Returns:
        Dict with answer and sources
    """
    try:
        logger.info(f"RAG query: {query[:100]}")

        # Step 1: Search for relevant documents
        search_result = vector_store.search(
            collection_name=collection_name,
            query=query,
            n_results=n_context_docs
        )

        context_docs = search_result["results"]["documents"]
        metadatas = search_result["results"]["metadatas"]

        logger.info(f"Retrieved {len(context_docs)} context documents")

        # Step 2: Generate answer with context
        llm_response = llm_client.generate_with_context(
            prompt=query,
            context_documents=context_docs,
            system=system_prompt
        )

        return {
            "status": "success",
            "task_id": self.request.id,
            "query": query,
            "answer": llm_response["text"],
            "sources": {
                "documents": context_docs,
                "metadatas": metadatas,
                "distances": search_result["results"]["distances"]
            },
            "usage": llm_response["usage"]
        }

    except Exception as e:
        logger.error(f"RAG query failed: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="rag.delete_collection")
def delete_collection(
    self: Task,
    collection_name: str
) -> Dict[str, Any]:
    """
    Delete a vector store collection

    Args:
        collection_name: Name of collection to delete

    Returns:
        Dict with deletion result
    """
    try:
        logger.info(f"Deleting collection: {collection_name}")

        result = vector_store.delete_collection(collection_name)

        return {
            "status": "success",
            "task_id": self.request.id,
            "result": result
        }

    except Exception as e:
        logger.error(f"Failed to delete collection: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="rag.list_collections")
def list_collections(self: Task) -> Dict[str, Any]:
    """
    List all vector store collections

    Returns:
        Dict with list of collection names
    """
    try:
        collections = vector_store.list_collections()

        return {
            "status": "success",
            "task_id": self.request.id,
            "collections": collections,
            "count": len(collections)
        }

    except Exception as e:
        logger.error(f"Failed to list collections: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }
