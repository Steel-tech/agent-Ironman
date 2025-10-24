"""
Vector Store Service using ChromaDB
Handles embeddings and similarity search for RAG
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging

from python_worker.config import settings

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Manages vector embeddings and similarity search"""

    def __init__(self):
        """Initialize ChromaDB and embedding model"""
        # Ensure persist directory exists
        persist_dir = Path(settings.chroma_persist_directory)
        persist_dir.mkdir(parents=True, exist_ok=True)

        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=str(persist_dir),
            settings=ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )

        # Initialize embedding model (all-MiniLM-L6-v2 is fast and good quality)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("Vector store initialized with ChromaDB")

    def get_or_create_collection(self, name: str) -> chromadb.Collection:
        """Get or create a collection for storing embeddings"""
        try:
            collection = self.client.get_or_create_collection(
                name=name,
                metadata={"description": f"Collection for {name}"}
            )
            logger.info(f"Collection '{name}' ready")
            return collection
        except Exception as e:
            logger.error(f"Failed to create collection '{name}': {e}")
            raise

    def add_documents(
        self,
        collection_name: str,
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Add documents to a collection with embeddings"""
        try:
            collection = self.get_or_create_collection(collection_name)

            # Generate embeddings
            embeddings = self.embedding_model.encode(documents).tolist()

            # Generate IDs if not provided
            if ids is None:
                import uuid
                ids = [str(uuid.uuid4()) for _ in documents]

            # Add to collection
            collection.add(
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas or [{} for _ in documents],
                ids=ids
            )

            logger.info(f"Added {len(documents)} documents to '{collection_name}'")
            return {
                "status": "success",
                "collection": collection_name,
                "count": len(documents),
                "ids": ids
            }
        except Exception as e:
            logger.error(f"Failed to add documents: {e}")
            raise

    def search(
        self,
        collection_name: str,
        query: str,
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Search for similar documents in a collection"""
        try:
            collection = self.get_or_create_collection(collection_name)

            # Generate query embedding
            query_embedding = self.embedding_model.encode([query]).tolist()

            # Search
            results = collection.query(
                query_embeddings=query_embedding,
                n_results=n_results,
                where=where
            )

            logger.info(f"Search in '{collection_name}' returned {len(results['documents'][0])} results")

            return {
                "status": "success",
                "query": query,
                "results": {
                    "documents": results["documents"][0],
                    "metadatas": results["metadatas"][0],
                    "distances": results["distances"][0],
                    "ids": results["ids"][0]
                }
            }
        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise

    def delete_collection(self, collection_name: str) -> Dict[str, Any]:
        """Delete a collection"""
        try:
            self.client.delete_collection(collection_name)
            logger.info(f"Deleted collection '{collection_name}'")
            return {"status": "success", "message": f"Collection '{collection_name}' deleted"}
        except Exception as e:
            logger.error(f"Failed to delete collection: {e}")
            raise

    def list_collections(self) -> List[str]:
        """List all collections"""
        try:
            collections = self.client.list_collections()
            return [col.name for col in collections]
        except Exception as e:
            logger.error(f"Failed to list collections: {e}")
            raise


# Singleton instance
vector_store = VectorStoreService()
