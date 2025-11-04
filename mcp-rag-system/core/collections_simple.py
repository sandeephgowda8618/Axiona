# Simplified ChromaDB Collection Manager - Enhanced with Advanced Workflow
from typing import Dict, List, Optional, Any
import chromadb
from chromadb.utils import embedding_functions
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ChromaCollectionManager:
    """Manages ChromaDB collections for different content namespaces with advanced workflow support"""
    
    def __init__(self, client):
        self.client = client
        # Use local sentence transformers embedding (no API key needed)
        self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        logger.info("ChromaDB Collection Manager initialized with local embeddings")
        
        # Initialize advanced workflow integration
        self._initialize_advanced_workflow()
    
    def _initialize_advanced_workflow(self):
        """Initialize advanced workflow if available"""
        try:
            from core.advanced_rag_workflow import initialize_advanced_workflow
            self.advanced_workflow = initialize_advanced_workflow(self.client)
            logger.info("🚀 Advanced RAG Workflow integrated successfully")
        except ImportError:
            self.advanced_workflow = None
            logger.warning("Advanced RAG Workflow not available")
    
    def get_or_create_collection(self, namespace: str):
        """Get or create a collection for the given namespace"""
        try:
            # Use the direct namespace as collection name (matching ingestion script)
            collection_name = namespace
            
            # Try to get existing collection first (without specifying embedding function to match ingestion)
            try:
                collection = self.client.get_collection(name=collection_name)
                logger.debug(f"Retrieved existing collection: {collection_name}")
                return collection
            except Exception:
                # Collection doesn't exist, create with embedding function
                try:
                    collection = self.client.create_collection(
                        name=collection_name,
                        embedding_function=self.embedding_function,
                        metadata={"namespace": namespace, "created_at": datetime.utcnow().isoformat()}
                    )
                    logger.info(f"Created new collection: {collection_name}")
                    return collection
                except Exception as create_error:
                    # If creation fails, try getting without embedding function one more time
                    logger.warning(f"Failed to create collection {collection_name}: {create_error}")
                    collection = self.client.get_collection(name=collection_name)
                    logger.info(f"Retrieved existing collection without embedding function: {collection_name}")
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
                "collection_name": namespace,  # Updated to match actual collection names
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
                # Use the collection name directly as namespace
                namespace = collection.name
                collection_stats = {
                    "namespace": namespace,
                    "collection_name": collection.name,
                    "document_count": collection.count(),
                    "embedding_function": "all-MiniLM-L6-v2",
                    "status": "active" if collection.count() > 0 else "empty"
                }
                stats.append(collection_stats)
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to list collections: {e}")
            return []
    
    def delete_collection(self, namespace: str) -> bool:
        """Delete a collection"""
        try:
            # Use direct namespace as collection name (matching get_or_create_collection)
            collection_name = namespace
            self.client.delete_collection(collection_name)
            logger.info(f"Deleted collection: {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete collection {namespace}: {e}")
            return False
    
    def reset_collection(self, namespace: str) -> bool:
        """Reset a collection (delete and recreate)"""
        try:
            # Use direct namespace as collection name (matching get_or_create_collection)
            collection_name = namespace
            
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
    
    def advanced_search_with_analytics(self, 
                                     query: str, 
                                     namespaces: List[str],
                                     n_results: int = 5,
                                     filters: Optional[Dict] = None,
                                     min_relevance: float = 0.0) -> Dict[str, Any]:
        """
        Perform advanced search with comprehensive analytics and monitoring
        """
        if self.advanced_workflow:
            try:
                # Use advanced workflow for enhanced search
                resources, metrics = self.advanced_workflow.advanced_search(
                    query=query,
                    namespaces=namespaces,
                    n_results=n_results,
                    filters=filters,
                    min_relevance=min_relevance
                )
                
                # Generate detailed report
                report = self.advanced_workflow.generate_search_report(resources, metrics)
                logger.info(f"🔍 Advanced search completed with analytics")
                logger.debug(f"Search report:\n{report}")
                
                return {
                    "resources": [
                        {
                            "title": r.title,
                            "author": r.author,
                            "subject": r.subject,
                            "document_id": r.document_id,
                            "source_type": r.source_type.value,
                            "relevance_score": r.relevance_score,
                            "file_name": r.file_name,
                            "file_url": r.file_url,
                            "file_type": r.file_type,
                            "level": r.level,
                            "tags": r.tags,
                            "pages": r.pages,
                            "duration": r.duration,
                            "views": r.views,
                            "semester": r.semester,
                            "unit": r.unit,
                            "topic": r.topic,
                            "url": r.url,
                            "video_id": r.video_id,
                            "isbn": r.isbn,
                            "publisher": r.publisher,
                            "publication_year": r.publication_year,
                            "category": r.category,
                            "approved": r.approved,
                            "content_preview": r.content_preview,
                            "quality": r.get_quality().value
                        }
                        for r in resources
                    ],
                    "metrics": {
                        "query": metrics.query,
                        "namespace": metrics.namespace,
                        "total_results": metrics.total_results,
                        "average_relevance": metrics.average_relevance,
                        "max_relevance": metrics.max_relevance,
                        "min_relevance": metrics.min_relevance,
                        "search_duration_ms": metrics.search_duration_ms,
                        "quality_distribution": metrics.quality_distribution,
                        "timestamp": metrics.timestamp
                    },
                    "report": report
                }
                
            except Exception as e:
                logger.error(f"Advanced search failed, falling back to basic search: {e}")
                
        # Fallback to basic search
        return self._basic_multi_search(query, namespaces, n_results, filters)
    
    def _basic_multi_search(self, query: str, namespaces: List[str], n_results: int, filters: Optional[Dict]) -> Dict[str, Any]:
        """Basic multi-namespace search fallback"""
        all_results = []
        
        for namespace in namespaces:
            try:
                results = self.search_collection(namespace, query, n_results, filters)
                
                if results["documents"]:
                    for i, doc in enumerate(results["documents"]):
                        metadata = results["metadatas"][i] if i < len(results["metadatas"]) else {}
                        distance = results["distances"][i] if i < len(results["distances"]) else 0.5
                        
                        all_results.append({
                            "title": metadata.get("title", "Untitled"),
                            "author": metadata.get("author", "Unknown"),
                            "subject": metadata.get("subject", "General"),
                            "document_id": metadata.get("document_id", ""),
                            "source_type": namespace,
                            "relevance_score": 1.0 - distance,
                            "content_preview": doc[:200] if doc else None,
                            **metadata
                        })
            except Exception as e:
                logger.error(f"Basic search failed for namespace {namespace}: {e}")
        
        # Sort by relevance
        all_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        return {
            "resources": all_results,
            "metrics": {
                "query": query,
                "namespace": ", ".join(namespaces),
                "total_results": len(all_results),
                "search_duration_ms": 0,
                "timestamp": datetime.utcnow().isoformat()
            },
            "report": f"Basic search completed: {len(all_results)} results found"
        }
    
    def get_analytics_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive analytics dashboard"""
        if self.advanced_workflow:
            return self.advanced_workflow.get_performance_dashboard()
        else:
            return {
                "status": "Advanced workflow not available",
                "basic_stats": {
                    "collections": self.list_all_collections(),
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
    
    def export_analytics(self, filepath: Optional[str] = None) -> str:
        """Export analytics data"""
        if self.advanced_workflow:
            return self.advanced_workflow.export_search_analytics(filepath)
        else:
            basic_data = {
                "export_timestamp": datetime.utcnow().isoformat(),
                "collections": self.list_all_collections(),
                "note": "Advanced analytics not available"
            }
            
            if not filepath:
                filepath = f"/tmp/basic_analytics_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
            
            import json
            with open(filepath, 'w') as f:
                json.dump(basic_data, f, indent=2)
                
            return filepath
