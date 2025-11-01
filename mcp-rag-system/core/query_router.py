# Smart Query Router for MCP RAG System
from typing import Dict, List, Optional, Tuple
import re
import logging
from datetime import datetime

from core.collections import ChromaCollectionManager
from config.settings import config

logger = logging.getLogger(__name__)

class QueryRouter:
    """Routes queries to appropriate collections and enhances results"""
    
    def __init__(self, collection_manager: ChromaCollectionManager):
        self.collection_manager = collection_manager
        self.query_patterns = self._initialize_query_patterns()
        self.namespace_weights = {
            "roadmap": 1.0,
            "pdf": 1.2,     # Slightly prefer PDFs for academic content
            "books": 1.1,   # Books are authoritative
            "videos": 0.9   # Videos are supplementary
        }
    
    def _initialize_query_patterns(self) -> Dict[str, List[str]]:
        """Initialize regex patterns for query classification"""
        return {
            "roadmap": [
                r"learning path", r"roadmap", r"study plan", r"curriculum",
                r"how to learn", r"progression", r"beginner to", r"career path",
                r"skill development", r"learning journey", r"study guide",
                r"prerequisite", r"foundation", r"step by step"
            ],
            "pdf": [
                r"textbook", r"reference", r"chapter", r"page \d+",
                r"definition", r"concept", r"theory", r"academic",
                r"research paper", r"scholarly", r"pdf", r"document",
                r"formula", r"equation", r"proof", r"theorem"
            ],
            "books": [
                r"book recommendation", r"best books", r"reading list",
                r"bibliography", r"author", r"publication", r"edition",
                r"recommended reading", r"textbook", r"manual",
                r"handbook", r"guide book", r"comprehensive"
            ],
            "videos": [
                r"tutorial", r"video", r"watch", r"course", r"lecture",
                r"demonstration", r"how-?to", r"walkthrough", r"screencast",
                r"webinar", r"presentation", r"visual", r"animated",
                r"step-by-step", r"hands-on", r"practical"
            ]
        }
    
    def detect_query_type(self, query: str) -> Tuple[str, float]:
        """Detect the most appropriate collection for a query"""
        query_lower = query.lower()
        scores = {}
        
        # Calculate pattern match scores
        for namespace, patterns in self.query_patterns.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, query_lower))
                score += matches
            
            # Apply namespace weights
            weighted_score = score * self.namespace_weights.get(namespace, 1.0)
            scores[namespace] = weighted_score
        
        # Return the namespace with highest score
        if not any(scores.values()):
            return "pdf", 0.5  # Default to PDF with low confidence
        
        best_namespace = max(scores.items(), key=lambda x: x[1])
        confidence = min(best_namespace[1] / max(sum(scores.values()), 1), 1.0)
        
        logger.info(f"Query type detection: '{query[:50]}...' -> {best_namespace[0]} (confidence: {confidence:.2f})")
        return best_namespace[0], confidence
    
    async def smart_search(self, 
                          query: str, 
                          namespace: Optional[str] = None,
                          filters: Optional[Dict] = None,
                          n_results: Optional[int] = None,
                          user_context: Optional[Dict] = None) -> Dict:
        """Perform smart search with automatic namespace detection"""
        
        # Use provided namespace or detect automatically
        if not namespace:
            detected_namespace, confidence = self.detect_query_type(query)
            namespace = detected_namespace
            auto_detected = True
        else:
            confidence = 1.0
            auto_detected = False
        
        # Use config default if n_results not specified
        if n_results is None:
            n_results = config.DEFAULT_SEARCH_RESULTS
        
        # Build ChromaDB where clause from filters
        where_clause = self._build_where_clause(filters, user_context) if filters or user_context else None
        
        # Perform search
        try:
            results = self.collection_manager.search_documents(
                namespace=namespace,
                query=query,
                n_results=n_results,
                where=where_clause
            )
            
            # Enhance results with formatting and metadata
            enhanced_results = self._enhance_results(results, namespace, query)
            
            search_result = {
                "namespace": namespace,
                "query": query,
                "results": enhanced_results,
                "total_found": len(enhanced_results),
                "auto_detected": auto_detected,
                "detection_confidence": confidence,
                "filters_applied": where_clause,
                "search_timestamp": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Smart search completed: {len(enhanced_results)} results from {namespace}")
            return search_result
            
        except Exception as e:
            logger.error(f"Smart search failed for query '{query}' in namespace '{namespace}': {e}")
            raise
    
    async def multi_namespace_search(self,
                                   query: str,
                                   namespaces: Optional[List[str]] = None,
                                   n_results_per_namespace: int = 3,
                                   filters: Optional[Dict] = None) -> Dict:
        """Search across multiple namespaces and merge results"""
        
        if not namespaces:
            namespaces = ["pdf", "books", "videos", "roadmap"]
        
        all_results = []
        namespace_results = {}
        
        for namespace in namespaces:
            try:
                result = await self.smart_search(
                    query=query,
                    namespace=namespace,
                    filters=filters,
                    n_results=n_results_per_namespace
                )
                
                namespace_results[namespace] = result
                
                # Add namespace info to each result
                for res in result["results"]:
                    res["source_namespace"] = namespace
                    all_results.append(res)
                    
            except Exception as e:
                logger.warning(f"Failed to search in namespace {namespace}: {e}")
                namespace_results[namespace] = {"error": str(e)}
        
        # Sort all results by relevance score
        all_results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        
        return {
            "query": query,
            "multi_namespace_results": all_results,
            "namespace_breakdown": namespace_results,
            "total_results": len(all_results),
            "search_timestamp": datetime.utcnow().isoformat()
        }
    
    def _build_where_clause(self, filters: Optional[Dict] = None, user_context: Optional[Dict] = None) -> Optional[Dict]:
        """Convert filters and user context to ChromaDB where clause"""
        where = {}
        
        # Process explicit filters
        if filters:
            filter_mapping = {
                "subject": "subject",
                "difficulty": "difficulty", 
                "author": "author",
                "duration": "duration_formatted",
                "platform": "platform",
                "language": "language",
                "pdf_id": "pdf_id",
                "video_id": "video_id"
            }
            
            for key, value in filters.items():
                if key in filter_mapping:
                    chroma_key = filter_mapping[key]
                    
                    # Handle different value types
                    if isinstance(value, list):
                        where[chroma_key] = {"$in": value}
                    elif isinstance(value, dict):
                        where[chroma_key] = value
                    else:
                        where[chroma_key] = value
        
        # Process user context for personalization
        if user_context:
            # Add user level filtering
            if user_context.get("user_level"):
                level = user_context["user_level"]
                if level == "beginner":
                    where["difficulty"] = {"$in": ["beginner", "easy"]}
                elif level == "intermediate": 
                    where["difficulty"] = {"$in": ["beginner", "intermediate"]}
                elif level == "advanced":
                    where["difficulty"] = {"$in": ["intermediate", "advanced", "expert"]}
            
            # Add subject preferences
            if user_context.get("preferred_subjects"):
                where["subject"] = {"$in": user_context["preferred_subjects"]}
        
        return where if where else None
    
    def _enhance_results(self, results: Dict, namespace: str, original_query: str) -> List[Dict]:
        """Enhance search results with formatted data and metadata"""
        enhanced = []
        
        for i in range(len(results["documents"])):
            result = {
                "id": results["ids"][i],
                "content": results["documents"][i],
                "metadata": results["metadatas"][i],
                "relevance_score": self._calculate_relevance_score(results["distances"][i]),
                "namespace": namespace,
                "original_query": original_query
            }
            
            # Add namespace-specific enhancements
            if namespace == "pdf":
                result.update(self._enhance_pdf_result(results["metadatas"][i]))
            elif namespace == "videos":
                result.update(self._enhance_video_result(results["metadatas"][i]))
            elif namespace == "books":
                result.update(self._enhance_book_result(results["metadatas"][i]))
            elif namespace == "roadmap":
                result.update(self._enhance_roadmap_result(results["metadatas"][i]))
            
            enhanced.append(result)
        
        return enhanced
    
    def _calculate_relevance_score(self, distance: float) -> float:
        """Convert distance to relevance score (0-1, higher is better)"""
        # ChromaDB uses cosine distance, so smaller distance = higher relevance
        # Convert to 0-1 scale where 1 is most relevant
        return max(0, min(1, 1 - distance))
    
    def _enhance_pdf_result(self, metadata: Dict) -> Dict:
        """Add PDF-specific display information"""
        return {
            "display_title": metadata.get("pdf_title", "Unknown PDF"),
            "page_reference": self._format_page_reference(metadata),
            "subject": metadata.get("subject", "General"),
            "difficulty": metadata.get("difficulty", "Unknown"),
            "chunk_info": f"Chunk {metadata.get('chunk_index', '?')} of {metadata.get('total_chunks', '?')}"
        }
    
    def _enhance_video_result(self, metadata: Dict) -> Dict:
        """Add video-specific display information"""
        return {
            "display_title": metadata.get("title", "Unknown Video"),
            "duration": metadata.get("duration_formatted", "Unknown"),
            "instructor": metadata.get("instructor", "Unknown"),
            "platform": metadata.get("platform", "Unknown"),
            "url": metadata.get("url", ""),
            "difficulty": metadata.get("difficulty", "Unknown"),
            "rating": metadata.get("rating", 0)
        }
    
    def _enhance_book_result(self, metadata: Dict) -> Dict:
        """Add book-specific display information"""
        return {
            "display_title": metadata.get("title", "Unknown Book"),
            "author": metadata.get("author", "Unknown Author"),
            "chapter": metadata.get("chapter", ""),
            "subject": metadata.get("subject", "General"),
            "academic_level": metadata.get("academic_level", "Unknown")
        }
    
    def _enhance_roadmap_result(self, metadata: Dict) -> Dict:
        """Add roadmap-specific display information"""
        return {
            "display_title": metadata.get("title", "Learning Path"),
            "skill_level": metadata.get("skill_level", "Unknown"),
            "estimated_time": metadata.get("estimated_time", "Unknown"),
            "prerequisites": metadata.get("prerequisites", []),
            "learning_objectives": metadata.get("learning_objectives", [])
        }
    
    def _format_page_reference(self, metadata: Dict) -> str:
        """Format page reference for PDFs"""
        page_start = metadata.get("page_start")
        page_end = metadata.get("page_end")
        
        if page_start and page_end:
            if page_start == page_end:
                return f"Page {page_start}"
            else:
                return f"Pages {page_start}-{page_end}"
        elif page_start:
            return f"Page {page_start}"
        else:
            return "Page unknown"
