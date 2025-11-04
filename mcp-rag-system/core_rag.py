# Core RAG Implementation - Embedding and Vector Storage

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from core.collections_simple import ChromaCollectionManager
from config.chroma_config import chroma_client
from models.api_models import (
    QueryRequest, SearchResponse, SearchResult,
    IngestionRequest, IngestionResponse,
    HealthResponse, RoadmapGenerationRequest, RoadmapGenerationResponse,
    RoadmapPhase, RoadmapResource
)
from services.roadmap_generator import roadmap_generator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Core RAG System",
    description="Document Embedding and Vector Storage System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global components
collection_manager: Optional[ChromaCollectionManager] = None

def ensure_initialized():
    """Ensure collection manager is initialized"""
    if collection_manager is None:
        raise HTTPException(status_code=500, detail="Collection manager not initialized")
    return collection_manager

@app.on_event("startup")
async def startup_event():
    """Initialize components on startup"""
    global collection_manager
    
    try:
        logger.info("Initializing Core RAG System...")
        
        # Initialize collection manager with sentence transformers
        collection_manager = ChromaCollectionManager(chroma_client)
        
        # Initialize roadmap generator and set RAG collection manager
        await roadmap_generator.initialize()
        roadmap_generator.set_rag_collection_manager(collection_manager)
        
        logger.info("Core RAG System initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize system: {e}")
        raise

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="Core RAG System",
        version="1.0.0",
        timestamp=datetime.utcnow().isoformat()
    )

@app.get("/collections")
async def list_collections():
    """List all available collections"""
    try:
        cm = ensure_initialized()
        stats = cm.list_all_collections()
        return {"collections": stats}
    except Exception as e:
        logger.error(f"Failed to list collections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/collections/{namespace}/stats")
async def get_collection_stats(namespace: str):
    """Get statistics for a specific collection"""
    try:
        cm = ensure_initialized()
        stats = cm.get_collection_stats(namespace)
        return {"namespace": namespace, "stats": stats}
    except Exception as e:
        logger.error(f"Failed to get collection stats for {namespace}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embed", response_model=IngestionResponse)
async def embed_documents(request: IngestionRequest):
    """Process and embed documents into vector storage"""
    try:
        cm = ensure_initialized()
        
        logger.info(f"Embedding {len(request.documents)} documents into namespace '{request.namespace}'")
        
        # Process documents and convert to embeddings
        processed_docs = []
        for i, doc in enumerate(request.documents):
            processed_doc = {
                "id": doc.get("id", f"{request.namespace}_{i}"),
                "text": doc.get("text", ""),
                "metadata": {
                    **doc.get("metadata", {}),
                    "namespace": request.namespace,
                    "ingested_at": datetime.utcnow().isoformat()
                }
            }
            processed_docs.append(processed_doc)
        
        # Add to ChromaDB (this will automatically create embeddings)
        count = cm.add_documents(request.namespace, processed_docs)
        
        logger.info(f"Successfully embedded {count} documents")
        
        return IngestionResponse(
            message=f"Successfully embedded {count} documents",
            namespace=request.namespace,
            document_count=count,
            status="success",
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to embed documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search", response_model=SearchResponse)
async def search_vectors(request: QueryRequest):
    """Search documents using vector similarity"""
    try:
        cm = ensure_initialized()
        
        logger.info(f"Vector search: '{request.query[:50]}...' in namespace '{request.namespace}'")
        
        # Perform vector similarity search
        namespace = request.namespace or "documents"
        
        # Get the collection
        collection = cm.get_or_create_collection(namespace)
        
        # Query the collection
        results = collection.query(
            query_texts=[request.query],
            n_results=request.n_results,
            where=request.filters if request.filters else None
        )
        
        # Format results
        search_results = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] and results["metadatas"][0] else {}
                distance = results["distances"][0][i] if results["distances"] and results["distances"][0] else 0.0
                doc_id = results["ids"][0][i] if results["ids"] and results["ids"][0] else f"doc_{i}"
                
                # Convert distance to relevance score (closer distance = higher relevance)
                relevance_score = max(0.0, 1.0 - distance)
                
                search_result = SearchResult(
                    id=doc_id,
                    content=doc,
                    metadata=metadata,
                    relevance_score=relevance_score,
                    namespace=namespace,
                    display_title=metadata.get("title"),
                    page_reference=metadata.get("page"),
                    duration=metadata.get("duration"),
                    author=metadata.get("author"),
                    url=metadata.get("url")
                )
                search_results.append(search_result)
        
        return SearchResponse(
            namespace=namespace,
            query=request.query,
            results=search_results,
            total_found=len(search_results),
            auto_detected=False,
            detection_confidence=None,
            filters_applied=request.filters,
            search_timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search/{namespace}")
async def search_namespace(namespace: str, request: QueryRequest):
    """Search in a specific namespace"""
    # Override the namespace from URL
    request.namespace = namespace
    return await search_vectors(request)

@app.get("/embeddings/test")
async def test_embeddings():
    """Test embedding functionality with sample data"""
    try:
        cm = ensure_initialized()
        
        # Sample documents for testing
        sample_docs = [
            {
                "id": "test_1",
                "text": "Machine learning is a subset of artificial intelligence that enables computers to learn without being explicitly programmed.",
                "metadata": {"subject": "machine_learning", "type": "definition"}
            },
            {
                "id": "test_2", 
                "text": "Python is a high-level programming language known for its simplicity and readability.",
                "metadata": {"subject": "programming", "type": "definition"}
            },
            {
                "id": "test_3",
                "text": "Vector databases store high-dimensional vectors and enable fast similarity search.",
                "metadata": {"subject": "databases", "type": "definition"}
            }
        ]
        
        # Embed the sample documents
        count = cm.add_documents("test", sample_docs)
        
        # Test search
        collection = cm.get_or_create_collection("test")
        results = collection.query(
            query_texts=["What is machine learning?"],
            n_results=2
        )
        
        return {
            "embedded_documents": count,
            "test_search_results": {
                "query": "What is machine learning?",
                "documents": results["documents"][0] if results["documents"] else [],
                "distances": results["distances"][0] if results["distances"] else [],
                "metadata": results["metadatas"][0] if results["metadatas"] else []
            }
        }
        
    except Exception as e:
        logger.error(f"Embedding test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def get_system_status():
    """Get system status"""
    try:
        cm = ensure_initialized()
        
        # Get collection statistics
        stats = cm.list_all_collections()
        
        return {
            "status": "operational",
            "timestamp": datetime.utcnow().isoformat(),
            "collections": stats,
            "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
            "vector_database": "ChromaDB",
            "components": {
                "collection_manager": "initialized",
                "vector_storage": "ready"
            }
        }
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-roadmap", response_model=RoadmapGenerationResponse)
async def generate_roadmap(request: RoadmapGenerationRequest):
    """Generate a personalized learning roadmap using comprehensive MCP RAG + Fine-tuned LLM"""
    try:
        cm = ensure_initialized()
        
        logger.info(f"🚀 Starting comprehensive roadmap generation for user: {request.user_id}")
        logger.info(f"📊 Request data: Phase1={bool(request.phase1)}, Phase2={bool(request.phase2)}, Phase3={bool(request.phase3)}, Phase4={bool(request.phase4)}, Phase5={bool(request.phase5)}")
        
        # Extract comprehensive user's learning context for intelligent RAG queries
        user_context = {}
        if request.phase1:
            user_context.update(request.phase1)
        if request.phase2:
            user_context.update(request.phase2)
        if request.phase3:
            user_context.update(request.phase3)
        if request.phase4:
            user_context.update(request.phase4)
        if request.phase5:
            user_context.update(request.phase5)
        
        # Extract key learning parameters
        domain = (user_context.get('domain') or user_context.get('ultimate_goal') or 'general learning')
        current_level = user_context.get('current_level', 'beginner')
        learning_style = user_context.get('learning_style', 'balanced')
        time_commitment = user_context.get('time_commitment', '1-2 hours')
        motivation = user_context.get('motivation', 'personal_interest')
        ultimate_goal = user_context.get('ultimate_goal', '')
        
        logger.info(f"🎯 Learning profile: Domain={domain}, Level={current_level}, Style={learning_style}")
        logger.info(f"⏰ Time commitment: {time_commitment}, Motivation: {motivation}")
        
        # Build comprehensive search queries using ALL user data
        search_queries = []
        
        # 1. Primary domain and level queries
        if domain != 'general learning':
            search_queries.extend([
                f"{domain} learning roadmap for {current_level}",
                f"how to learn {domain} {current_level} level step by step",
                f"{domain} curriculum {current_level} structured path",
                f"complete {domain} study guide {current_level}"
            ])
        
        # 2. Learning style and preference based queries
        material_preference = user_context.get('material_preference', '')
        if material_preference:
            search_queries.extend([
                f"{domain} {material_preference} resources",
                f"best {material_preference} for {domain} learning",
                f"{domain} {material_preference} {current_level}"
            ])
        
        # 3. Skill assessment and strength-based queries
        core_strengths = user_context.get('core_strengths', [])
        if core_strengths:
            strengths_str = ', '.join(core_strengths[:3])  # Top 3 strengths
            search_queries.extend([
                f"{domain} advanced topics for {strengths_str}",
                f"next steps after {strengths_str} in {domain}",
                f"{domain} projects using {strengths_str}"
            ])
        
        # 4. Struggle areas and improvement queries
        struggle_areas = user_context.get('struggle_areas', [])
        if struggle_areas:
            struggles_str = ', '.join(struggle_areas[:2])  # Top 2 struggle areas
            search_queries.extend([
                f"how to improve {struggles_str} in {domain}",
                f"{domain} resources for {struggles_str}",
                f"overcoming {struggles_str} {domain} tutorials"
            ])
        
        # 5. Goal-specific queries
        if ultimate_goal and len(ultimate_goal) > 10:
            search_queries.extend([
                f"{domain} roadmap for {ultimate_goal}",
                f"how to achieve {ultimate_goal} through {domain}",
                f"{ultimate_goal} preparation {domain}"
            ])
        
        # 6. Time and commitment based queries
        weekly_days = user_context.get('weekly_days', '')
        if weekly_days:
            search_queries.extend([
                f"{domain} study plan {weekly_days} days per week",
                f"{time_commitment} daily {domain} learning schedule"
            ])
        
        # 7. Challenge level and engagement queries
        challenge_level = user_context.get('challenge_level', '')
        if challenge_level:
            search_queries.extend([
                f"{challenge_level} {domain} learning path",
                f"{domain} {challenge_level} difficulty projects"
            ])
        
        # 8. Exam preparation specific queries
        exam_preparation = user_context.get('exam_preparation', '')
        if exam_preparation and exam_preparation.lower() not in ['no', 'none', '']:
            search_queries.extend([
                f"{domain} preparation for {exam_preparation}",
                f"{exam_preparation} {domain} study materials",
                f"how to prepare {exam_preparation} with {domain}"
            ])
        
        logger.info(f"🔍 Generated {len(search_queries)} intelligent search queries from user data")
        logger.info(f"📝 Sample queries: {search_queries[:3]}")
        
        # Perform comprehensive RAG search across all specified namespaces
        relevant_content = []
        content_sources = {}
        namespaces = request.search_namespaces or ["studymaterials", "books", "videos"]
        
        logger.info(f"🔍 Searching across namespaces: {namespaces}")
        
        total_results = 0
        for namespace in namespaces:
            namespace_results = 0
            content_sources[namespace] = []
            
            # Use top queries for each namespace, prioritizing different types
            queries_for_namespace = search_queries[:6]  # Use more queries for better coverage
            
            for query in queries_for_namespace:
                try:
                    # Get the collection for this namespace
                    collection = cm.get_or_create_collection(namespace)
                    
                    # Perform semantic search without restrictive filters to find most relevant content
                    results = collection.query(
                        query_texts=[query],
                        n_results=min(3, request.max_resources),  # Increased results per query
                        where=None  # Let semantic search find the best matches regardless of metadata filters
                    )
                    
                    # Extract relevant content with metadata
                    if results["documents"] and results["documents"][0]:
                        for i, doc in enumerate(results["documents"][0]):
                            if len(doc) > 50:  # Include more varied content
                                # Get metadata if available
                                metadata = {}
                                if results.get("metadatas") and len(results["metadatas"][0]) > i:
                                    metadata = results["metadatas"][0][i] or {}
                                
                                # Create rich content entry with all available metadata for frontend use
                                content_entry = {
                                    "content": doc[:800],  # Increased content size
                                    "source": namespace,
                                    "query": query,
                                    "metadata": metadata,
                                    "relevance_score": 1.0 - (results["distances"][0][i] if results.get("distances") else 0.5),
                                    # Extract key resource information for display
                                    "title": metadata.get('title', 'Untitled Resource'),
                                    "author": metadata.get('author', 'Unknown Author'),
                                    "subject": metadata.get('subject', 'General'),
                                    "fileName": metadata.get('fileName', ''),
                                    "file_url": metadata.get('file_url', ''),
                                    "document_id": metadata.get('document_id', ''),
                                    "file_type": metadata.get('file_type', metadata.get('source_type', 'unknown')),
                                    "level": metadata.get('level', 'General'),
                                    "tags": metadata.get('tags', ''),
                                    "pages": metadata.get('pages', ''),
                                    "duration": metadata.get('duration', ''),
                                    "views": metadata.get('views', ''),
                                    "topicTags": metadata.get('topicTags', ''),
                                    "semester": metadata.get('semester', ''),
                                    "unit": metadata.get('unit', ''),
                                    "topic": metadata.get('topic', ''),
                                    "url": metadata.get('url', ''),
                                    "videoId": metadata.get('videoId', ''),
                                    "isbn": metadata.get('isbn', ''),
                                    "publisher": metadata.get('publisher', ''),
                                    "publication_year": metadata.get('publication_year', ''),
                                    "category": metadata.get('category', ''),
                                    "approved": metadata.get('approved', 'Unknown')
                                }
                                
                                relevant_content.append(content_entry)
                                content_sources[namespace].append(content_entry)
                                namespace_results += 1
                                total_results += 1
                            
                except Exception as e:
                    logger.warning(f"⚠️ Failed to search namespace {namespace} with query '{query}': {e}")
                    continue
            
            logger.info(f"📚 Found {namespace_results} results in namespace '{namespace}'")
        
        logger.info(f"📖 Total content pieces found: {total_results}")
        
        # Remove duplicates based on content similarity and rank by relevance
        unique_content = []
        seen_content_hashes = set()
        
        # Sort by relevance score first
        relevant_content.sort(key=lambda x: x.get("relevance_score", 0.5), reverse=True)
        
        for content_entry in relevant_content:
            content_hash = hash(content_entry["content"][:200])  # Hash first 200 chars
            if content_hash not in seen_content_hashes:
                seen_content_hashes.add(content_hash)
                unique_content.append(content_entry)
        
        # Limit to max resources but ensure variety across namespaces
        final_content = []
        max_per_namespace = max(1, request.max_resources // len(namespaces))
        
        for namespace in namespaces:
            namespace_content = [c for c in unique_content if c["source"] == namespace]
            final_content.extend(namespace_content[:max_per_namespace])
        
        # Fill remaining slots with highest relevance content
        remaining_slots = request.max_resources - len(final_content)
        if remaining_slots > 0:
            remaining_content = [c for c in unique_content if c not in final_content]
            final_content.extend(remaining_content[:remaining_slots])
        
        logger.info(f"📖 Using {len(final_content)} diverse, high-quality resources for roadmap generation")
        logger.info(f"🎯 Content distribution: {[(source, len([c for c in final_content if c['source'] == source])) for source in namespaces]}")
        
        # Organize content by subject units for StudyPES materials
        unit_organized_content = {}
        subject_based_phases = []
        
        # Group resources by subject and unit
        subject_units = {}
        for content in final_content:
            subject = content.get('subject', 'General')
            unit = content.get('unit', '')
            semester = content.get('semester', '')
            
            # Focus on StudyPES materials with clear unit structure
            if content.get('source') == 'studymaterials' and unit and unit.isdigit():
                unit_key = f"{subject}_Unit{unit}"
                if unit_key not in subject_units:
                    subject_units[unit_key] = {
                        'subject': subject,
                        'unit': unit,
                        'semester': semester,
                        'resources': []
                    }
                subject_units[unit_key]['resources'].append(content)
        
        logger.info(f"🏗️ Found {len(subject_units)} subject-unit combinations for phase organization")
        
        # If we have clear unit structure, organize by units (max 4 phases)
        if subject_units and len(subject_units) <= 4:
            # Sort by unit number
            sorted_units = sorted(subject_units.items(), key=lambda x: int(x[1]['unit']))
            
            for i, (unit_key, unit_data) in enumerate(sorted_units[:4], 1):
                phase_resources = unit_data['resources']
                subject_based_phases.append({
                    'phase_number': i,
                    'title': f"Phase {i}: {unit_data['subject']} - Unit {unit_data['unit']}",
                    'subject': unit_data['subject'],
                    'unit': unit_data['unit'],
                    'semester': unit_data['semester'],
                    'resources': phase_resources,
                    'resource_count': len(phase_resources)
                })
            
            logger.info(f"📚 Organized roadmap into {len(subject_based_phases)} unit-based phases")
            for phase in subject_based_phases:
                logger.info(f"   Phase {phase['phase_number']}: {phase['title']} ({phase['resource_count']} resources)")
        
        # Generate roadmap using the enhanced roadmap generator service
        # Pass all user context, the rich content, and unit organization
        roadmap_response = await roadmap_generator.generate_personalized_roadmap(
            roadmap_data={
                'phase1': request.phase1 or {},
                'phase2': request.phase2 or {},
                'phase3': request.phase3 or {},
                'phase4': request.phase4 or {},
                'phase5': request.phase5 or {},
                'user_context': user_context,  # Full user context
                'subject_based_phases': subject_based_phases,  # Unit-organized phases
                'search_summary': {
                    'total_queries': len(search_queries),
                    'content_sources': {ns: len([c for c in final_content if c['source'] == ns]) for ns in namespaces},
                    'avg_relevance': sum(c.get('relevance_score', 0.5) for c in final_content) / len(final_content) if final_content else 0,
                    'unit_organization': len(subject_based_phases) > 0
                }
            },
            relevant_content=final_content  # Rich content with metadata
        )
        
        # Format the response according to the API model
        response = RoadmapGenerationResponse(
            user_profile=roadmap_response["user_profile"],
            roadmap_content=roadmap_response["roadmap_content"],
            phases=[
                RoadmapPhase(
                    title=phase["title"],
                    content=phase["content"],
                    duration=phase.get("duration"),
                    objectives=phase.get("objectives"),
                    resources=phase.get("resources"),
                    milestones=phase.get("milestones")
                )
                for phase in roadmap_response["phases"]
            ],
            estimated_duration=roadmap_response["estimated_duration"],
            personalization_score=roadmap_response["personalization_score"],
            relevant_resources=roadmap_response["relevant_resources"],
            model_used=roadmap_response["model_used"],
            generated_at=roadmap_response["generated_at"],
            success=True,
            resource_metadata=[
                RoadmapResource(
                    title=resource.get("title", "Untitled Resource"),
                    author=resource.get("author"),
                    subject=resource.get("subject"),
                    file_name=resource.get("fileName"),
                    file_url=resource.get("file_url"),
                    document_id=resource.get("document_id"),
                    file_type=resource.get("file_type"),
                    level=resource.get("level"),
                    tags=resource.get("tags"),
                    pages=resource.get("pages"),
                    duration=resource.get("duration"),
                    views=resource.get("views"),
                    semester=resource.get("semester"),
                    unit=resource.get("unit"),
                    topic=resource.get("topic"),
                    url=resource.get("url"),
                    video_id=resource.get("videoId"),
                    isbn=resource.get("isbn"),
                    publisher=resource.get("publisher"),
                    publication_year=resource.get("publication_year"),
                    category=resource.get("category"),
                    approved=resource.get("approved"),
                    source_type=resource.get("source", "unknown"),
                    relevance_score=resource.get("relevance_score", 0.5)
                )
                for resource in final_content[:15]  # Limit to top 15 resources for frontend
            ]
        )
        
        logger.info(f"✅ Comprehensive roadmap generated successfully!")
        logger.info(f"📊 Personalization score: {roadmap_response['personalization_score']:.2f}")
        logger.info(f"📚 Content sources used: {roadmap_response['relevant_resources']} resources")
        return response
        
    except Exception as e:
        logger.error(f"❌ Failed to generate roadmap: {e}")
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")

@app.post("/advanced-search")
async def advanced_search_with_analytics(
    query: str,
    namespaces: List[str] = ["studymaterials", "videos", "books"],
    n_results: int = 5,
    min_relevance: float = 0.0
):
    """Advanced search with comprehensive analytics and monitoring"""
    try:
        cm = ensure_initialized()
        
        logger.info(f"🚀 Advanced search request: '{query}' across {namespaces}")
        
        # Use the advanced search method
        result = cm.advanced_search_with_analytics(
            query=query,
            namespaces=namespaces,
            n_results=n_results,
            min_relevance=min_relevance
        )
        
        logger.info(f"✅ Advanced search completed: {result['metrics']['total_results']} results")
        
        return {
            "success": True,
            "query": query,
            "namespaces": namespaces,
            "results": result["resources"],
            "analytics": result["metrics"],
            "search_report": result["report"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Advanced search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Advanced search failed: {str(e)}")

@app.get("/analytics/dashboard")
async def get_analytics_dashboard():
    """Get comprehensive analytics dashboard"""
    try:
        cm = ensure_initialized()
        dashboard = cm.get_analytics_dashboard()
        
        return {
            "success": True,
            "dashboard": dashboard,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Analytics dashboard failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analytics/export")
async def export_analytics():
    """Export analytics data to file"""
    try:
        cm = ensure_initialized()
        filepath = cm.export_analytics()
        
        return {
            "success": True,
            "message": "Analytics exported successfully",
            "filepath": filepath,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Analytics export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/demo/search-showcase")
async def search_showcase():
    """Demonstrate the advanced search capabilities with sample queries"""
    try:
        cm = ensure_initialized()
        
        # Sample queries for demonstration
        demo_queries = [
            "machine learning beginner tutorial",
            "web development full stack",
            "database normalization techniques",
            "python programming basics",
            "data structures algorithms"
        ]
        
        showcase_results = {}
        
        for query in demo_queries:
            try:
                result = cm.advanced_search_with_analytics(
                    query=query,
                    namespaces=["studymaterials", "videos", "books"],
                    n_results=3,
                    min_relevance=0.1
                )
                
                showcase_results[query] = {
                    "total_results": result["metrics"]["total_results"],
                    "avg_relevance": result["metrics"]["average_relevance"],
                    "top_resource": result["resources"][0] if result["resources"] else None,
                    "quality_distribution": result["metrics"]["quality_distribution"]
                }
                
            except Exception as e:
                showcase_results[query] = {"error": str(e)}
        
        return {
            "success": True,
            "message": "Search showcase completed",
            "demo_results": showcase_results,
            "system_status": "Advanced RAG workflow operational",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Search showcase failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
