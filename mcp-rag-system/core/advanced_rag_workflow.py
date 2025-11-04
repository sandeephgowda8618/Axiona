# Advanced RAG Workflow System - Enhanced Search, Monitoring & Resource Management

import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import json
from dataclasses import dataclass, asdict
from enum import Enum
import chromadb
from chromadb.utils import embedding_functions

logger = logging.getLogger(__name__)

class ResourceType(Enum):
    STUDYMATERIAL = "studymaterial"
    VIDEO = "video" 
    BOOK = "book"
    UNKNOWN = "unknown"

class SearchQuality(Enum):
    EXCELLENT = "excellent"  # >0.8 relevance
    GOOD = "good"           # 0.6-0.8 relevance
    FAIR = "fair"           # 0.4-0.6 relevance
    POOR = "poor"           # <0.4 relevance

@dataclass
class SearchMetrics:
    """Detailed search metrics for monitoring and optimization"""
    query: str
    namespace: str
    total_results: int
    average_relevance: float
    max_relevance: float
    min_relevance: float
    search_duration_ms: float
    quality_distribution: Dict[str, int]
    timestamp: str

@dataclass
class ResourceMetadata:
    """Rich resource metadata with validation and formatting"""
    title: str
    author: str
    subject: str
    document_id: str
    source_type: ResourceType
    relevance_score: float
    file_name: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    level: Optional[str] = None
    tags: Optional[str] = None
    pages: Optional[str] = None
    duration: Optional[str] = None
    views: Optional[str] = None
    semester: Optional[str] = None
    unit: Optional[str] = None
    topic: Optional[str] = None
    url: Optional[str] = None
    video_id: Optional[str] = None
    isbn: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[str] = None
    category: Optional[str] = None
    approved: Optional[str] = None
    content_preview: Optional[str] = None

    def __post_init__(self):
        # Validate and clean data
        self.title = self.title or "Untitled Resource"
        self.author = self.author or "Unknown Author"
        self.subject = self.subject or "General"
        self.relevance_score = max(0.0, min(1.0, self.relevance_score))
        
    def get_quality(self) -> SearchQuality:
        """Get search quality based on relevance score"""
        if self.relevance_score >= 0.8:
            return SearchQuality.EXCELLENT
        elif self.relevance_score >= 0.6:
            return SearchQuality.GOOD
        elif self.relevance_score >= 0.4:
            return SearchQuality.FAIR
        else:
            return SearchQuality.POOR
    
    def get_display_info(self) -> Dict[str, str]:
        """Get formatted info for display"""
        return {
            "📖 Title": self.title,
            "👤 Author": self.author,
            "📚 Subject": self.subject,
            "📄 Type": self.file_type or self.source_type.value,
            "🎯 Level": self.level or "General",
            "🔗 MongoDB ID": self.document_id or "No ID",
            "📁 File": self.file_name or "No file",
            "🔗 URL": self.file_url or "No URL",
            "📊 Relevance": f"{self.relevance_score:.3f}",
            "🏷️ Tags": (self.tags[:50] + "..." if self.tags and len(self.tags) > 50 else self.tags or "No tags"),
            "🌟 Quality": self.get_quality().value.upper()
        }

class AdvancedRAGWorkflow:
    """Advanced RAG workflow with comprehensive search, monitoring, and resource management"""
    
    def __init__(self, chroma_client):
        self.client = chroma_client
        self.search_history: List[SearchMetrics] = []
        self.performance_stats = {
            "total_searches": 0,
            "avg_search_time": 0.0,
            "avg_relevance": 0.0,
            "collection_stats": {}
        }
        
        # Initialize embedding function for consistency
        self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        
        logger.info("🚀 Advanced RAG Workflow initialized")
    
    def get_collection_insights(self) -> Dict[str, Any]:
        """Get comprehensive collection insights"""
        insights = {
            "collections": {},
            "total_documents": 0,
            "last_updated": datetime.utcnow().isoformat()
        }
        
        try:
            collections = self.client.list_collections()
            
            for collection in collections:
                count = collection.count()
                insights["collections"][collection.name] = {
                    "document_count": count,
                    "status": "active" if count > 0 else "empty",
                    "embedding_model": "all-MiniLM-L6-v2"
                }
                insights["total_documents"] += count
                
                # Sample metadata for insights
                if count > 0:
                    try:
                        sample = collection.get(limit=5)
                        if sample.get("metadatas"):
                            # Analyze metadata structure
                            sample_metadata = sample["metadatas"][0]
                            insights["collections"][collection.name]["metadata_fields"] = list(sample_metadata.keys())
                            insights["collections"][collection.name]["sample_subjects"] = list(set([
                                meta.get("subject", "Unknown") for meta in sample["metadatas"][:5]
                            ]))
                    except Exception as e:
                        logger.warning(f"Failed to get sample metadata for {collection.name}: {e}")
                        
        except Exception as e:
            logger.error(f"Failed to get collection insights: {e}")
            
        return insights
    
    def advanced_search(self, 
                       query: str, 
                       namespaces: List[str],
                       n_results: int = 5,
                       filters: Optional[Dict] = None,
                       min_relevance: float = 0.0) -> Tuple[List[ResourceMetadata], SearchMetrics]:
        """
        Perform advanced search with comprehensive metrics and resource extraction
        """
        start_time = datetime.utcnow()
        all_resources = []
        total_raw_results = 0
        relevance_scores = []
        
        logger.info(f"🔍 Advanced search: '{query}' across {len(namespaces)} namespaces")
        
        for namespace in namespaces:
            try:
                # Get collection
                collection = self.client.get_collection(namespace)
                
                # Perform search
                results = collection.query(
                    query_texts=[query],
                    n_results=n_results,
                    where=filters if filters else None
                )
                
                # Process results
                if results["documents"] and results["documents"][0]:
                    namespace_results = len(results["documents"][0])
                    total_raw_results += namespace_results
                    
                    for i, doc in enumerate(results["documents"][0]):
                        # Calculate relevance score
                        distance = results["distances"][0][i] if results.get("distances") else 0.5
                        relevance = 1.0 - distance
                        
                        # Skip low relevance results
                        if relevance < min_relevance:
                            continue
                            
                        relevance_scores.append(relevance)
                        
                        # Extract metadata
                        metadata = results["metadatas"][0][i] if results.get("metadatas") else {}
                        
                        # Determine resource type
                        source_type = metadata.get("source_type", "unknown")
                        resource_type = ResourceType.UNKNOWN
                        if source_type == "studymaterial":
                            resource_type = ResourceType.STUDYMATERIAL
                        elif source_type == "video":
                            resource_type = ResourceType.VIDEO
                        elif source_type == "book":
                            resource_type = ResourceType.BOOK
                        
                        # Create rich resource metadata
                        resource = ResourceMetadata(
                            title=metadata.get("title", "Untitled Resource"),
                            author=metadata.get("author", "Unknown Author"),
                            subject=metadata.get("subject", "General"),
                            document_id=metadata.get("document_id", ""),
                            source_type=resource_type,
                            relevance_score=relevance,
                            file_name=metadata.get("fileName"),
                            file_url=metadata.get("file_url"),
                            file_type=metadata.get("file_type"),
                            level=metadata.get("level"),
                            tags=metadata.get("tags"),
                            pages=metadata.get("pages"),
                            duration=metadata.get("duration"),
                            views=metadata.get("views"),
                            semester=metadata.get("semester"),
                            unit=metadata.get("unit"),
                            topic=metadata.get("topic"),
                            url=metadata.get("url"),
                            video_id=metadata.get("videoId"),
                            isbn=metadata.get("isbn"),
                            publisher=metadata.get("publisher"),
                            publication_year=metadata.get("publication_year"),
                            category=metadata.get("category"),
                            approved=metadata.get("approved"),
                            content_preview=doc[:200] if doc else None
                        )
                        
                        all_resources.append(resource)
                        
                    logger.info(f"📚 Found {namespace_results} results in '{namespace}' namespace")
                    
            except Exception as e:
                logger.error(f"❌ Search failed in namespace '{namespace}': {e}")
                continue
        
        # Calculate search metrics
        end_time = datetime.utcnow()
        duration_ms = (end_time - start_time).total_seconds() * 1000
        
        avg_relevance = sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0.0
        max_relevance = max(relevance_scores) if relevance_scores else 0.0
        min_relevance = min(relevance_scores) if relevance_scores else 0.0
        
        # Quality distribution
        quality_dist = {"excellent": 0, "good": 0, "fair": 0, "poor": 0}
        for resource in all_resources:
            quality_dist[resource.get_quality().value] += 1
        
        metrics = SearchMetrics(
            query=query,
            namespace=", ".join(namespaces),
            total_results=len(all_resources),
            average_relevance=avg_relevance,
            max_relevance=max_relevance,
            min_relevance=min_relevance,
            search_duration_ms=duration_ms,
            quality_distribution=quality_dist,
            timestamp=end_time.isoformat()
        )
        
        # Store metrics
        self.search_history.append(metrics)
        self._update_performance_stats(metrics)
        
        # Sort by relevance
        all_resources.sort(key=lambda x: x.relevance_score, reverse=True)
        
        logger.info(f"✅ Advanced search completed: {len(all_resources)} resources, avg relevance: {avg_relevance:.3f}")
        
        return all_resources, metrics
    
    def _update_performance_stats(self, metrics: SearchMetrics):
        """Update performance statistics"""
        self.performance_stats["total_searches"] += 1
        
        # Update average search time
        total_time = (self.performance_stats["avg_search_time"] * (self.performance_stats["total_searches"] - 1) + 
                     metrics.search_duration_ms)
        self.performance_stats["avg_search_time"] = total_time / self.performance_stats["total_searches"]
        
        # Update average relevance
        total_relevance = (self.performance_stats["avg_relevance"] * (self.performance_stats["total_searches"] - 1) + 
                          metrics.average_relevance)
        self.performance_stats["avg_relevance"] = total_relevance / self.performance_stats["total_searches"]
    
    def generate_search_report(self, resources: List[ResourceMetadata], metrics: SearchMetrics) -> str:
        """Generate a comprehensive search report"""
        report = f"""
🔍 ADVANCED RAG SEARCH REPORT
{'=' * 50}
📊 Query: "{metrics.query}"
🎯 Namespaces: {metrics.namespace}
⏱️ Search Duration: {metrics.search_duration_ms:.2f}ms
📈 Results Found: {metrics.total_results}

📊 RELEVANCE METRICS:
  • Average: {metrics.average_relevance:.3f}
  • Maximum: {metrics.max_relevance:.3f}
  • Minimum: {metrics.min_relevance:.3f}

🌟 QUALITY DISTRIBUTION:
  • Excellent (>0.8): {metrics.quality_distribution['excellent']} resources
  • Good (0.6-0.8): {metrics.quality_distribution['good']} resources
  • Fair (0.4-0.6): {metrics.quality_distribution['fair']} resources
  • Poor (<0.4): {metrics.quality_distribution['poor']} resources

📋 TOP RESOURCES:
"""
        
        for i, resource in enumerate(resources[:5]):
            report += f"\n📄 Result {i+1}:\n"
            display_info = resource.get_display_info()
            for key, value in display_info.items():
                report += f"  {key}: {value}\n"
            if resource.content_preview:
                report += f"  📄 Preview: {resource.content_preview}...\n"
        
        return report
    
    def get_performance_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive performance dashboard"""
        recent_searches = self.search_history[-10:] if self.search_history else []
        
        dashboard = {
            "overview": {
                "total_searches": self.performance_stats["total_searches"],
                "avg_search_time_ms": round(self.performance_stats["avg_search_time"], 2),
                "avg_relevance": round(self.performance_stats["avg_relevance"], 3),
                "last_updated": datetime.utcnow().isoformat()
            },
            "recent_searches": [asdict(search) for search in recent_searches],
            "collection_insights": self.get_collection_insights(),
            "quality_trends": self._calculate_quality_trends(),
            "recommendations": self._generate_recommendations()
        }
        
        return dashboard
    
    def _calculate_quality_trends(self) -> Dict[str, Any]:
        """Calculate quality trends from search history"""
        if not self.search_history:
            return {"status": "No data available"}
        
        recent_metrics = self.search_history[-20:] if len(self.search_history) >= 20 else self.search_history
        
        avg_relevance_trend = [m.average_relevance for m in recent_metrics]
        search_time_trend = [m.search_duration_ms for m in recent_metrics]
        
        return {
            "relevance_trend": {
                "current": avg_relevance_trend[-1] if avg_relevance_trend else 0,
                "average": sum(avg_relevance_trend) / len(avg_relevance_trend) if avg_relevance_trend else 0,
                "improving": avg_relevance_trend[-1] > avg_relevance_trend[0] if len(avg_relevance_trend) > 1 else None
            },
            "performance_trend": {
                "current_speed": search_time_trend[-1] if search_time_trend else 0,
                "average_speed": sum(search_time_trend) / len(search_time_trend) if search_time_trend else 0,
                "improving": search_time_trend[-1] < search_time_trend[0] if len(search_time_trend) > 1 else None
            }
        }
    
    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations for optimization"""
        recommendations = []
        
        if self.performance_stats["avg_relevance"] < 0.5:
            recommendations.append("📊 Consider refining search queries for better relevance")
        
        if self.performance_stats["avg_search_time"] > 1000:
            recommendations.append("⚡ Search performance could be optimized")
        
        insights = self.get_collection_insights()
        total_docs = insights.get("total_documents", 0)
        
        if total_docs < 100:
            recommendations.append("📚 Consider ingesting more documents for better coverage")
        
        if not recommendations:
            recommendations.append("✅ System is performing optimally")
        
        return recommendations

    def export_search_analytics(self, filepath: Optional[str] = None) -> str:
        """Export search analytics to JSON file"""
        if not filepath:
            filepath = f"/tmp/rag_analytics_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        
        analytics_data = {
            "export_timestamp": datetime.utcnow().isoformat(),
            "performance_stats": self.performance_stats,
            "search_history": [asdict(search) for search in self.search_history],
            "collection_insights": self.get_collection_insights()
        }
        
        with open(filepath, 'w') as f:
            json.dump(analytics_data, f, indent=2)
        
        logger.info(f"📄 Analytics exported to: {filepath}")
        return filepath

# Global instance for the advanced workflow
advanced_rag_workflow: Optional[AdvancedRAGWorkflow] = None

def initialize_advanced_workflow(chroma_client):
    """Initialize the global advanced workflow instance"""
    global advanced_rag_workflow
    advanced_rag_workflow = AdvancedRAGWorkflow(chroma_client)
    return advanced_rag_workflow

def get_advanced_workflow() -> AdvancedRAGWorkflow:
    """Get the global advanced workflow instance"""
    if advanced_rag_workflow is None:
        raise RuntimeError("Advanced RAG Workflow not initialized. Call initialize_advanced_workflow() first.")
    return advanced_rag_workflow
