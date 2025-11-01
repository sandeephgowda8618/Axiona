# Simplified ChromaDB Collection Manager - No OpenAI Dependency
from typing import Dict, List, Optional, Any
import chromadb
from chromadb.utils import embedding_functions
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ChromaCollectionManager:
    """Manages ChromaDB collections for different content namespaces"""
    
    def __init__(self, client):
        self.client = client
        # Use local sentence transformers embedding (no API key needed)
        self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        logger.info("ChromaDB Collection Manager initialized with local embeddings")
    
    def get_or_create_collection(self, namespace: str):
        """Get or create a collection for the given namespace"""
        try:
            collection_name = f"{namespace}_collection"
            
            # Try to get existing collection
            try:
                collection = self.client.get_collection(
                    name=collection_name,
                    embedding_function=self.embedding_function
                )
                logger.debug(f"Retrieved existing collection: {collection_name}")
            except Exception:
                # Create new collection if it doesn't exist
                collection = self.client.create_collection(
                    name=collection_name,
                    embedding_function=self.embedding_function,
                    metadata={"namespace": namespace, "created_at": datetime.utcnow().isoformat()}
                )
                logger.info(f"Created new collection: {collection_name}")
            
            return collection
            
        except Exception as e:
            logger.error(f"Failed to get/create collection for namespace '{namespace}': {e}")
            raise
    
    def add_documents(self, namespace: str, documents: List[Dict[str, Any]]) -> int:
        """Add documents to a collection"""
        try:
            collection = self.get_or_create_collection(namespace)
            
            # Prepare data for ChromaDB
            ids = []
            texts = []
            metadatas = []
            
            for doc in documents:
                doc_id = doc.get("id", f"{namespace}_{len(ids)}")
                text = doc.get("text", "")
                metadata = doc.get("metadata", {})
                
                # Ensure metadata doesn't contain None values
                clean_metadata = {k: v for k, v in metadata.items() if v is not None}
                clean_metadata["namespace"] = namespace
                clean_metadata["added_at"] = datetime.utcnow().isoformat()
                
                ids.append(str(doc_id))
                texts.append(str(text))
                metadatas.append(clean_metadata)
            
            # Add to collection (this automatically generates embeddings)
            collection.add(
                ids=ids,
                documents=texts,
                metadatas=metadatas
            )
            
            logger.info(f"Added {len(documents)} documents to {namespace} collection")
            return len(documents)
            
        except Exception as e:
            logger.error(f"Failed to add documents to {namespace}: {e}")
            raise
    
    def search_collection(self, namespace: str, query: str, n_results: int = 5, filters: Optional[Dict] = None) -> Dict[str, Any]:
        """Search in a specific collection"""
        try:
            collection = self.get_or_create_collection(namespace)
            
            # Perform query
            results = collection.query(
                query_texts=[query],
                n_results=n_results,
                where=filters if filters else None
            )
            
            return {
                "documents": results["documents"][0] if results["documents"] else [],
                "metadatas": results["metadatas"][0] if results["metadatas"] else [],
                "distances": results["distances"][0] if results["distances"] else [],
                "ids": results["ids"][0] if results["ids"] else []
            }
            
        except Exception as e:
            logger.error(f"Search failed in {namespace}: {e}")
            raise
    
    def get_collection_stats(self, namespace: str) -> Dict[str, Any]:
        """Get statistics for a collection"""
        try:
            collection = self.get_or_create_collection(namespace)
            count = collection.count()
            
            return {
                "namespace": namespace,
                "collection_name": f"{namespace}_collection",
                "document_count": count,
                "embedding_function": "all-MiniLM-L6-v2",
                "status": "active" if count > 0 else "empty"
            }
            
        except Exception as e:
            logger.error(f"Failed to get stats for {namespace}: {e}")
            return {
                "namespace": namespace,
                "error": str(e),
                "status": "error"
            }
    
    def list_all_collections(self) -> List[Dict[str, Any]]:
        """List all collections"""
        try:
            collections = self.client.list_collections()
            stats = []
            
            for collection in collections:
                # Extract namespace from collection name
                namespace = collection.name.replace("_collection", "")
                collection_stats = self.get_collection_stats(namespace)
                stats.append(collection_stats)
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to list collections: {e}")
            return []
    
    def delete_collection(self, namespace: str) -> bool:
        """Delete a collection"""
        try:
            collection_name = f"{namespace}_collection"
            self.client.delete_collection(collection_name)
            logger.info(f"Deleted collection: {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete collection {namespace}: {e}")
            return False
    
    def reset_collection(self, namespace: str) -> bool:
        """Reset a collection (delete and recreate)"""
        try:
            collection_name = f"{namespace}_collection"
            
            # Delete existing collection
            try:
                self.client.delete_collection(collection_name)
                logger.info(f"Deleted existing collection: {collection_name}")
            except Exception:
                logger.debug(f"Collection {collection_name} didn't exist")
            
            # Create new empty collection
            self.get_or_create_collection(namespace)
            logger.info(f"Reset collection: {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to reset collection {namespace}: {e}")
            return False
