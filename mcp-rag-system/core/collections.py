# Core ChromaDB Collection Manager
from typing import Dict, List, Optional, Any
import chromadb
from chromadb.utils import embedding_functions
import os
from datetime import datetime
import logging

from config.settings import config

logger = logging.getLogger(__name__)

class ChromaCollectionManager:
    """Manages ChromaDB collections for different content namespaces"""
    
    def __init__(self, client: chromadb.PersistentClient):
        self.client = client
        self.embedding_function = self._setup_embedding_function()
        self.collections = self._initialize_collections()
        logger.info("ChromaDB Collection Manager initialized")
    
    def _setup_embedding_function(self):
        """Setup embedding function based on configuration"""
        if config.OPENAI_API_KEY:
            logger.info(f"Using OpenAI embeddings: {config.EMBEDDING_MODEL}")
            return embedding_functions.OpenAIEmbeddingFunction(
                api_key=config.OPENAI_API_KEY,
                model_name=config.EMBEDDING_MODEL
            )
        else:
            logger.info(f"Using local embeddings: {config.LOCAL_EMBEDDING_MODEL}")
            return embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name=config.LOCAL_EMBEDDING_MODEL
            )
    
    def _initialize_collections(self) -> Dict[str, chromadb.Collection]:
        """Initialize all collections with proper metadata"""
        collections = {}
        
        collection_configs = [
            {
                "name": "roadmap_data",
                "key": "roadmap",
                "description": "User learning paths, skill assessments, and personalized roadmaps"
            },
            {
                "name": "study_pdfs", 
                "key": "pdfs",
                "description": "PDF content chunks with subject metadata and page references"
            },
            {
                "name": "reference_books",
                "key": "books", 
                "description": "Reference book summaries, chapters, and academic content"
            },
            {
                "name": "tutorial_videos",
                "key": "videos",
                "description": "Tutorial video transcripts, metadata, and learning sequences"
            }
        ]
        
        for collection_config in collection_configs:
            try:
                collection = self.client.get_or_create_collection(
                    name=collection_config["name"],
                    embedding_function=self.embedding_function,
                    metadata={
                        "description": collection_config["description"],
                        "namespace": collection_config["key"],
                        "created_at": datetime.utcnow().isoformat(),
                        "version": "1.0"
                    }
                )
                collections[collection_config["key"]] = collection
                logger.info(f"Collection '{collection_config['name']}' initialized")
                
            except Exception as e:
                logger.error(f"Failed to initialize collection {collection_config['name']}: {e}")
                raise
        
        return collections
    
    def get_collection(self, namespace: str) -> chromadb.Collection:
        """Get collection by namespace"""
        collection_map = {
            "roadmap": "roadmap",
            "pdf": "pdfs", 
            "books": "books",
            "videos": "videos"
        }
        
        if namespace not in collection_map:
            raise ValueError(f"Unknown namespace: {namespace}")
        
        return self.collections[collection_map[namespace]]
    
    def add_documents(self, namespace: str, documents: List[Dict[str, Any]]) -> int:
        """Add documents to specific collection"""
        try:
            collection = self.get_collection(namespace)
            
            if not documents:
                logger.warning(f"No documents provided for namespace: {namespace}")
                return 0
            
            # Extract components for ChromaDB
            ids = []
            texts = []
            metadatas = []
            
            for doc in documents:
                if not all(key in doc for key in ["id", "text", "metadata"]):
                    logger.error(f"Document missing required fields: {doc}")
                    continue
                
                ids.append(str(doc["id"]))
                texts.append(str(doc["text"]))
                
                # Ensure metadata is JSON serializable
                metadata = doc["metadata"].copy()
                metadata["added_at"] = datetime.utcnow().isoformat()
                metadatas.append(metadata)
            
            if not ids:
                logger.warning(f"No valid documents to add for namespace: {namespace}")
                return 0
            
            # Add to collection
            collection.add(
                ids=ids,
                documents=texts,
                metadatas=metadatas
            )
            
            logger.info(f"Added {len(ids)} documents to {namespace} collection")
            return len(ids)
            
        except Exception as e:
            logger.error(f"Error adding documents to {namespace}: {e}")
            raise
    
    def search_documents(self, 
                        namespace: str, 
                        query: str, 
                        n_results: int = 5,
                        where: Optional[Dict] = None,
                        where_document: Optional[Dict] = None) -> Dict[str, Any]:
        """Search documents in specific collection"""
        try:
            collection = self.get_collection(namespace)
            
            # Validate n_results
            n_results = min(max(1, n_results), config.MAX_SEARCH_RESULTS)
            
            # Perform search
            results = collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where,
                where_document=where_document
            )
            
            # Format results
            formatted_results = {
                "documents": results["documents"][0] if results["documents"] else [],
                "metadatas": results["metadatas"][0] if results["metadatas"] else [],
                "distances": results["distances"][0] if results["distances"] else [],
                "ids": results["ids"][0] if results["ids"] else [],
                "namespace": namespace,
                "query": query,
                "total_results": len(results["documents"][0]) if results["documents"] else 0
            }
            
            logger.info(f"Search in {namespace} returned {formatted_results['total_results']} results")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching in {namespace}: {e}")
            raise
    
    def delete_documents(self, namespace: str, document_ids: List[str]) -> int:
        """Delete documents from collection"""
        try:
            collection = self.get_collection(namespace)
            
            # Convert to strings
            ids_to_delete = [str(doc_id) for doc_id in document_ids]
            
            collection.delete(ids=ids_to_delete)
            
            logger.info(f"Deleted {len(ids_to_delete)} documents from {namespace}")
            return len(ids_to_delete)
            
        except Exception as e:
            logger.error(f"Error deleting documents from {namespace}: {e}")
            raise
    
    def update_documents(self, namespace: str, documents: List[Dict[str, Any]]) -> int:
        """Update existing documents in collection"""
        try:
            collection = self.get_collection(namespace)
            
            ids = []
            texts = []
            metadatas = []
            
            for doc in documents:
                if not all(key in doc for key in ["id", "text", "metadata"]):
                    logger.error(f"Document missing required fields: {doc}")
                    continue
                
                ids.append(str(doc["id"]))
                texts.append(str(doc["text"]))
                
                metadata = doc["metadata"].copy()
                metadata["updated_at"] = datetime.utcnow().isoformat()
                metadatas.append(metadata)
            
            if not ids:
                return 0
            
            collection.update(
                ids=ids,
                documents=texts,
                metadatas=metadatas
            )
            
            logger.info(f"Updated {len(ids)} documents in {namespace}")
            return len(ids)
            
        except Exception as e:
            logger.error(f"Error updating documents in {namespace}: {e}")
            raise
    
    def get_collection_stats(self, namespace: str) -> Dict[str, Any]:
        """Get statistics for a collection"""
        try:
            collection = self.get_collection(namespace)
            count = collection.count()
            
            # Get sample metadata to understand structure
            sample_results = collection.peek(limit=1)
            sample_metadata = sample_results["metadatas"][0] if sample_results["metadatas"] else {}
            
            stats = {
                "namespace": namespace,
                "collection_name": collection.name,
                "document_count": count,
                "sample_metadata_keys": list(sample_metadata.keys()) if sample_metadata else [],
                "embedding_function": type(self.embedding_function).__name__
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting stats for {namespace}: {e}")
            return {
                "namespace": namespace,
                "document_count": 0,
                "error": str(e)
            }
    
    def list_all_collections(self) -> List[Dict[str, Any]]:
        """List all collections with their stats"""
        all_stats = []
        for namespace in self.collections.keys():
            stats = self.get_collection_stats(namespace)
            all_stats.append(stats)
        return all_stats
    
    def reset_collection(self, namespace: str) -> bool:
        """Reset (delete all documents) from a collection"""
        try:
            collection = self.get_collection(namespace)
            
            # Get all document IDs
            all_docs = collection.get()
            if all_docs["ids"]:
                collection.delete(ids=all_docs["ids"])
                logger.info(f"Reset collection {namespace}: deleted {len(all_docs['ids'])} documents")
            else:
                logger.info(f"Collection {namespace} was already empty")
            
            return True
            
        except Exception as e:
            logger.error(f"Error resetting collection {namespace}: {e}")
            return False
