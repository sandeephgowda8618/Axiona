"""
Metadata Schema Utilities
========================

Utilities for creating standardized metadata objects according to the 
canonical schema defined in the TODO specification.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import json
from utils.json_utils import stringify_ids

class MetadataBuilder:
    """Builder for standardized metadata objects"""
    
    @staticmethod
    def build_document_metadata(
        mongo_doc: Dict[str, Any],
        semantic_score: float = 0.0,
        relevance_score: float = 0.0,
        snippet: str = "",
        chunk_text: str = ""
    ) -> Dict[str, Any]:
        """
        Build standardized document metadata from MongoDB document
        
        Args:
            mongo_doc: Document from MongoDB (reference_books or pes_materials)
            semantic_score: Semantic similarity score (0.0-1.0)
            relevance_score: Combined relevance score (0.0-1.0)
            snippet: Contextual snippet from matched content
            chunk_text: Full chunk text for generating snippet if not provided
        
        Returns:
            Standardized metadata object
        """
        # Generate snippet if not provided
        if not snippet and chunk_text:
            snippet = chunk_text[:200] + "..." if len(chunk_text) > 200 else chunk_text
        
        # Base metadata structure
        metadata = {
            "id": str(mongo_doc.get("_id", "")),
            "title": mongo_doc.get("title", ""),
            "authors": mongo_doc.get("authors", mongo_doc.get("author", "").split(", ") if mongo_doc.get("author") else []),
            "content_type": mongo_doc.get("content_type", ""),
            "source": mongo_doc.get("source", ""),
            "gridfs_id": str(mongo_doc.get("gridfs_id", "")),
            "file_url": mongo_doc.get("file_url", ""),
            "pdf_path": mongo_doc.get("pdf_path", ""),
            "summary": mongo_doc.get("summary", ""),
            "key_concepts": mongo_doc.get("key_concepts", []),
            "difficulty": mongo_doc.get("difficulty", ""),
            "created_at": mongo_doc.get("created_at", datetime.now()).isoformat() if isinstance(mongo_doc.get("created_at"), datetime) else str(mongo_doc.get("created_at", "")),
            "relevance_score": round(relevance_score, 3),
            "semantic_score": round(semantic_score, 3),
            "snippet": snippet
        }
        
        # Add optional fields
        if mongo_doc.get("page_count"):
            metadata["page_count"] = mongo_doc["page_count"]
        
        # PES material specific fields
        if mongo_doc.get("semester"):
            metadata["semester"] = mongo_doc["semester"]
        if mongo_doc.get("unit"):
            metadata["unit"] = mongo_doc["unit"]
        
        # Reference book specific fields
        if mongo_doc.get("isbn"):
            metadata["isbn"] = mongo_doc["isbn"]
        if mongo_doc.get("publisher"):
            metadata["publisher"] = mongo_doc["publisher"]
        if mongo_doc.get("edition"):
            metadata["edition"] = mongo_doc["edition"]
        if mongo_doc.get("target_audience"):
            metadata["target_audience"] = mongo_doc["target_audience"]
        
        return metadata
    
    @staticmethod
    def build_video_metadata(
        mongo_doc: Dict[str, Any],
        relevance_score: float = 0.0,
        snippet: str = ""
    ) -> Dict[str, Any]:
        """
        Build standardized video metadata from MongoDB document
        
        Args:
            mongo_doc: Document from videos collection
            relevance_score: Combined relevance score (0.0-1.0)
            snippet: Contextual snippet
        
        Returns:
            Standardized video metadata object
        """
        metadata = {
            "id": str(mongo_doc.get("_id", "")),
            "title": mongo_doc.get("title", ""),
            "url": mongo_doc.get("url", mongo_doc.get("video_url", "")),
            "content_type": "youtube_video",
            "source": mongo_doc.get("source", "video_urls"),
            "created_at": mongo_doc.get("created_at", datetime.now()).isoformat() if isinstance(mongo_doc.get("created_at"), datetime) else str(mongo_doc.get("created_at", "")),
            "relevance_score": round(relevance_score, 3),
            "snippet": snippet
        }
        
        # Add optional video fields
        if mongo_doc.get("channel"):
            metadata["channel"] = mongo_doc["channel"]
        if mongo_doc.get("duration_seconds"):
            metadata["duration_seconds"] = mongo_doc["duration_seconds"]
        if mongo_doc.get("captions_available") is not None:
            metadata["captions_available"] = mongo_doc["captions_available"]
        if mongo_doc.get("timestamps"):
            metadata["timestamps"] = mongo_doc["timestamps"]
        if mongo_doc.get("thumbnail_url"):
            metadata["thumbnail_url"] = mongo_doc["thumbnail_url"]
        
        return metadata
    
    @staticmethod
    def build_search_response(
        results: List[Dict[str, Any]],
        query: str,
        search_type: str,
        top_k: int = 10
    ) -> Dict[str, Any]:
        """
        Build standardized search response envelope
        
        Args:
            results: List of metadata objects
            query: Original user query
            search_type: Type of search (pdf_search, book_search, video_search)
            top_k: Maximum number of results requested
        
        Returns:
            Standardized search response envelope
        """
        return {
            "results": results,
            "meta": {
                "query": query,
                "search_type": search_type,
                "returned": len(results),
                "top_k": top_k,
                "timestamp": datetime.now().isoformat()
            }
        }
    
    @staticmethod
    def calculate_relevance_score(
        semantic_score: float,
        pedagogical_score: float = 0.0,
        recency_score: float = 0.0,
        engagement_score: float = 0.0
    ) -> float:
        """
        Calculate combined relevance score using weighted formula
        
        Args:
            semantic_score: Semantic similarity score (0.0-1.0)
            pedagogical_score: Educational quality score (0.0-1.0)
            recency_score: Content recency score (0.0-1.0)
            engagement_score: Content engagement score (0.0-1.0)
        
        Returns:
            Combined relevance score (0.0-1.0)
        """
        # Weights from TODO specification
        w_sem = 0.6
        w_ped = 0.25
        w_recency = 0.1
        w_pop = 0.05
        
        relevance = (
            w_sem * semantic_score +
            w_ped * pedagogical_score +
            w_recency * recency_score +
            w_pop * engagement_score
        )
        
        return min(max(relevance, 0.0), 1.0)  # Ensure 0.0-1.0 range
    
    @staticmethod
    def ensure_json_safe(metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ensure a metadata object is safe for JSON serialization
        
        Args:
            metadata: Metadata dictionary that may contain ObjectIds
        
        Returns:
            JSON-safe metadata dictionary
        """
        return stringify_ids(metadata)
