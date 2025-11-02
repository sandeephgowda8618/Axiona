#!/usr/bin/env python3
"""
Comprehensive MCP RAG API Service
Implements all 4 educational services: roadmap generation, PDF search, book filtering, video recommendations
Based on the unified RAG pipeline with MongoDB integration
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import asyncio
import os
from datetime import datetime
from typing import Optional, List, Dict, Any
import json
import uuid
import chromadb
from motor.motor_asyncio import AsyncIOMotorClient

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="MCP RAG Educational API",
    description="Unified RAG-based Model Context Protocol API for educational services",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
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
chroma_client = None
mongo_client = None
db = None

# Pydantic Models for MCP Services

from pydantic import BaseModel, Field

class RoadmapRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    domain: str = Field(..., description="Learning domain (e.g., 'DSA', 'ML', 'Web Development')")
    current_level: str = Field(..., description="Current skill level", pattern="^(beginner|intermediate|advanced)$")
    time_commitment: str = Field(..., description="Daily time commitment", pattern="^(1-2 hours|3-5 hours|5\\+ hours)$")
    learning_goals: List[str] = Field(..., description="List of learning objectives")
    preferences: Dict[str, Any] = Field(default_factory=dict, description="Learning preferences")

class PDFSearchRequest(BaseModel):
    query: str = Field(..., description="Search query for PDFs")
    academic_level: Optional[str] = Field(None, description="Academic level filter")
    subject_filter: Optional[str] = Field(None, description="Subject filter")
    max_results: int = Field(10, description="Maximum number of results", ge=1, le=50)

class BookFilterRequest(BaseModel):
    query: str = Field(..., description="Topic or subject to find books for")
    academic_level: Optional[str] = Field(None, description="Academic level filter")
    category: Optional[str] = Field(None, description="Book category filter")
    max_recommendations: int = Field(5, description="Maximum number of recommendations", ge=1, le=20)

class VideoFilterRequest(BaseModel):
    query: str = Field(..., description="Topic to find videos for")
    duration_preference: Optional[str] = Field(None, description="Duration preference", pattern="^(short|medium|long)$")
    difficulty_level: Optional[str] = Field(None, description="Difficulty level filter")
    max_videos: int = Field(20, description="Maximum number of videos", ge=1, le=50)

# Response Models

class PhaseResource(BaseModel):
    phase_number: int
    title: str
    duration_days: int
    videos: List[str] = Field(..., description="MongoDB video IDs")
    pdfs: List[str] = Field(..., description="MongoDB PDF/book IDs")
    reference_book: Optional[str] = Field(None, description="Best reference book MongoDB ID")
    quiz_topics: List[str]
    prerequisites: List[str]
    learning_outcomes: List[str]

class RoadmapResponse(BaseModel):
    roadmap_id: str
    user_id: str
    domain: str
    phases: List[PhaseResource]
    total_duration_days: int
    estimated_completion: str

class PDFResult(BaseModel):
    mongodb_id: str
    title: str
    author: str
    relevance_score: float
    relevant_sections: List[str]
    description: str
    file_url: str
    subject: Optional[str] = None
    pages: Optional[int] = None

class PDFSearchResponse(BaseModel):
    results: List[PDFResult]
    query: str
    total_found: int
    search_timestamp: str

class BookRecommendation(BaseModel):
    mongodb_id: str
    title: str
    author: str
    relevance_score: float
    difficulty_level: str
    key_chapters: List[str]
    recommendation_reason: str
    use_case: str
    file_url: str

class BookFilterResponse(BaseModel):
    recommendations: List[BookRecommendation]
    query: str
    total_recommendations: int

class VideoRecommendation(BaseModel):
    mongodb_id: str
    title: str
    description: str
    duration: str
    difficulty: str
    prerequisites: List[str]
    learning_outcomes: List[str]
    sequence_position: int
    url: Optional[str] = None

class VideoSequence(BaseModel):
    beginner: List[VideoRecommendation]
    intermediate: List[VideoRecommendation]
    advanced: List[VideoRecommendation]

class VideoFilterResponse(BaseModel):
    learning_sequence: VideoSequence
    total_duration: str
    recommended_schedule: str
    learning_path_summary: str
    query: str

# Core RAG Engine Class

class MCP_RAG_Engine:
    def __init__(self):
        self.chroma_client = None
        self.collections = {}
        
    async def initialize(self):
        """Initialize ChromaDB and collections"""
        try:
            self.chroma_client = chromadb.PersistentClient(path='./chromadb')
            
            # Get existing collections
            existing_collections = self.chroma_client.list_collections()
            for col in existing_collections:
                self.collections[col.name] = col
                
            logger.info(f"✅ RAG Engine initialized with {len(self.collections)} collections")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize RAG engine: {e}")
            return False
    
    async def retrieve_context(self, query: str, namespace: str, top_k: int = 10, filters: Dict = None) -> List[Dict]:
        """Retrieve context from vector database"""
        try:
            if namespace not in self.collections:
                logger.warning(f"Namespace '{namespace}' not found. Available: {list(self.collections.keys())}")
                return []
            
            collection = self.collections[namespace]
            
            # Perform vector search
            results = collection.query(
                query_texts=[query],
                n_results=top_k,
                where=filters
            )
            
            # Format results
            context = []
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    metadata = results['metadatas'][0][i] if results['metadatas'] and results['metadatas'][0] else {}
                    distance = results['distances'][0][i] if results['distances'] and results['distances'][0] else 1.0
                    doc_id = results['ids'][0][i] if results['ids'] and results['ids'][0] else f"doc_{i}"
                    
                    context.append({
                        'id': doc_id,
                        'content': doc,
                        'metadata': metadata,
                        'relevance_score': max(0.0, 1.0 - distance)
                    })
            
            return context
            
        except Exception as e:
            logger.error(f"Context retrieval failed for namespace '{namespace}': {e}")
            return []

# Global RAG engine
rag_engine = MCP_RAG_Engine()

@app.on_event("startup")
async def startup_event():
    """Initialize all components on startup"""
    global chroma_client, mongo_client, db
    
    try:
        logger.info("🚀 Initializing MCP RAG Educational API...")
        
        # Initialize RAG engine
        success = await rag_engine.initialize()
        if not success:
            raise Exception("Failed to initialize RAG engine")
        
        # Initialize MongoDB
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/study-ai')
        mongo_client = AsyncIOMotorClient(mongodb_uri)
        db = mongo_client['study-ai']
        await mongo_client.admin.command('ping')
        logger.info("✅ Connected to MongoDB")
        
        logger.info("🎉 MCP RAG Educational API is ready!")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "MCP RAG Educational API",
        "version": "2.0.0",
        "services": [
            "Personalized Roadmap Generation",
            "PDF Search & Filtering", 
            "Reference Book Recommendations",
            "Tutorial Video Filtering"
        ],
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check ChromaDB collections
        collections_status = {}
        for name, collection in rag_engine.collections.items():
            collections_status[name] = collection.count()
        
        # Check MongoDB
        studymaterials_count = await db.studymaterials.count_documents({})
        videos_count = await db.videos.count_documents({})
        books_count = await db.books.count_documents({})
        
        return {
            "status": "healthy",
            "service": "MCP RAG Educational API", 
            "version": "2.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "chromadb_collections": collections_status,
            "mongodb_collections": {
                "studymaterials": studymaterials_count,
                "videos": videos_count,
                "books": books_count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

# Service 1: Personalized Roadmap Generation

@app.post("/mcp/generate_roadmap", response_model=RoadmapResponse)
async def generate_roadmap(request: RoadmapRequest):
    """Generate personalized learning roadmap based on user requirements"""
    try:
        logger.info(f"🛤️ Generating roadmap for user {request.user_id}, domain: {request.domain}")
        
        # Retrieve relevant educational content
        context = await rag_engine.retrieve_context(
            query=f"comprehensive learning path for {request.domain} from {request.current_level} level {' '.join(request.learning_goals)}",
            namespace="studymaterials",
            top_k=15
        )
        
        # Get relevant videos and books from MongoDB
        videos_cursor = db.videos.find({
            "$or": [
                {"title": {"$regex": request.domain, "$options": "i"}},
                {"description": {"$regex": request.domain, "$options": "i"}},
                {"topicTags": {"$in": request.learning_goals}}
            ]
        }).limit(20)
        
        books_cursor = db.books.find({
            "$or": [
                {"title": {"$regex": request.domain, "$options": "i"}},
                {"subject": {"$regex": request.domain, "$options": "i"}},
                {"tags": {"$in": request.learning_goals}}
            ]
        }).limit(15)
        
        videos = await videos_cursor.to_list(length=20)
        books = await books_cursor.to_list(length=15)
        
        # Generate structured roadmap phases
        roadmap_id = str(uuid.uuid4())
        
        # Create phases based on learning progression
        phases = []
        total_duration = 0
        
        # Determine duration multiplier based on time commitment
        time_multipliers = {
            "1-2 hours": 1.5,
            "3-5 hours": 1.0,
            "5+ hours": 0.7
        }
        multiplier = time_multipliers.get(request.time_commitment, 1.0)
        
        # Phase 1: Fundamentals
        phase1_duration = int(21 * multiplier)
        total_duration += phase1_duration
        
        phases.append(PhaseResource(
            phase_number=1,
            title=f"{request.domain} Fundamentals",
            duration_days=phase1_duration,
            videos=[str(v["_id"]) for v in videos[:3] if "basic" in v.get("title", "").lower() or "introduction" in v.get("title", "").lower()][:2] or [str(videos[0]["_id"]), str(videos[1]["_id"])] if len(videos) >= 2 else [],
            pdfs=[str(b["_id"]) for b in books[:2]] if len(books) >= 2 else [],
            reference_book=str(books[0]["_id"]) if books else None,
            quiz_topics=[f"Basic {request.domain} concepts", "Terminology and definitions"],
            prerequisites=[],
            learning_outcomes=[f"Understand {request.domain} fundamentals", "Grasp core concepts and terminology"]
        ))
        
        # Phase 2: Intermediate Concepts
        phase2_duration = int(28 * multiplier)
        total_duration += phase2_duration
        
        phases.append(PhaseResource(
            phase_number=2,
            title=f"Intermediate {request.domain}",
            duration_days=phase2_duration,
            videos=[str(v["_id"]) for v in videos[3:6]] if len(videos) >= 6 else [str(v["_id"]) for v in videos[2:4]] if len(videos) >= 4 else [],
            pdfs=[str(b["_id"]) for b in books[2:4]] if len(books) >= 4 else [str(b["_id"]) for b in books[1:3]] if len(books) >= 3 else [],
            reference_book=str(books[1]["_id"]) if len(books) >= 2 else str(books[0]["_id"]) if books else None,
            quiz_topics=[f"Intermediate {request.domain} techniques", "Problem-solving approaches"],
            prerequisites=[f"Complete {request.domain} Fundamentals"],
            learning_outcomes=[f"Apply {request.domain} techniques", "Solve intermediate problems"]
        ))
        
        # Phase 3: Advanced Applications
        phase3_duration = int(35 * multiplier)
        total_duration += phase3_duration
        
        phases.append(PhaseResource(
            phase_number=3,
            title=f"Advanced {request.domain} & Projects",
            duration_days=phase3_duration,
            videos=[str(v["_id"]) for v in videos[6:9]] if len(videos) >= 9 else [str(v["_id"]) for v in videos[-2:]] if len(videos) >= 2 else [],
            pdfs=[str(b["_id"]) for b in books[4:6]] if len(books) >= 6 else [str(b["_id"]) for b in books[-2:]] if len(books) >= 2 else [],
            reference_book=str(books[-1]["_id"]) if books else None,
            quiz_topics=[f"Advanced {request.domain} concepts", "Real-world applications"],
            prerequisites=[f"Complete Intermediate {request.domain}"],
            learning_outcomes=[f"Master advanced {request.domain}", "Build complex projects"]
        ))
        
        return RoadmapResponse(
            roadmap_id=roadmap_id,
            user_id=request.user_id,
            domain=request.domain,
            phases=phases,
            total_duration_days=total_duration,
            estimated_completion=f"{total_duration//30} months {(total_duration%30)//7} weeks"
        )
        
    except Exception as e:
        logger.error(f"Roadmap generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate roadmap: {str(e)}")

# Service 2: PDF Search & Filtering

@app.post("/mcp/search_pdfs", response_model=PDFSearchResponse)
async def search_pdfs(request: PDFSearchRequest):
    """Search and filter PDFs based on query and criteria"""
    try:
        logger.info(f"📄 Searching PDFs for: '{request.query}'")
        
        # Build filters
        filters = {}
        if request.academic_level:
            filters["level"] = request.academic_level
        if request.subject_filter:
            filters["subject"] = request.subject_filter
            
        # Retrieve context from StudyMaterials (PDFs)
        context = await rag_engine.retrieve_context(
            query=request.query,
            namespace="studymaterials",
            top_k=request.max_results * 2,
            filters=filters if filters else None
        )
        
        # Also search in books collection
        book_context = await rag_engine.retrieve_context(
            query=request.query,
            namespace="books", 
            top_k=request.max_results,
            filters=filters if filters else None
        )
        
        # Combine and sort by relevance
        all_context = context + book_context
        all_context.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        # Format results
        results = []
        for item in all_context[:request.max_results]:
            metadata = item['metadata']
            
            result = PDFResult(
                mongodb_id=metadata.get('document_id', item['id']),
                title=metadata.get('title', 'Unknown Title'),
                author=metadata.get('author', 'Unknown Author'),
                relevance_score=round(item['relevance_score'], 3),
                relevant_sections=metadata.get('unit', '').split(',') if metadata.get('unit') else ['General Content'],
                description=f"Relevant content for '{request.query}' - {metadata.get('description', 'No description')}",
                file_url=metadata.get('file_url', ''),
                subject=metadata.get('subject'),
                pages=int(metadata.get('pages', 0)) if metadata.get('pages', '').isdigit() else None
            )
            results.append(result)
        
        return PDFSearchResponse(
            results=results,
            query=request.query,
            total_found=len(results),
            search_timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"PDF search failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF search failed: {str(e)}")

# Service 3: Reference Book Filtering

@app.post("/mcp/filter_books", response_model=BookFilterResponse)
async def filter_books(request: BookFilterRequest):
    """Filter and recommend reference books based on topic and criteria"""
    try:
        logger.info(f"📚 Filtering books for: '{request.query}'")
        
        # Build filters
        filters = {}
        if request.category:
            filters["category"] = request.category
        if request.academic_level:
            filters["level"] = request.academic_level
            
        # Retrieve context from books
        context = await rag_engine.retrieve_context(
            query=f"reference books for {request.query}",
            namespace="books",
            top_k=request.max_recommendations * 2,
            filters=filters if filters else None
        )
        
        # Format book recommendations
        recommendations = []
        for item in context[:request.max_recommendations]:
            metadata = item['metadata']
            
            # Determine difficulty level
            difficulty = metadata.get('level', 'intermediate')
            if not difficulty or difficulty == '':
                difficulty = 'intermediate'
                
            # Determine use case based on metadata
            use_case = "reference"
            if "textbook" in metadata.get('title', '').lower():
                use_case = "primary_textbook"
            elif "practice" in metadata.get('title', '').lower() or "exercise" in metadata.get('title', '').lower():
                use_case = "practice"
                
            recommendation = BookRecommendation(
                mongodb_id=metadata.get('document_id', item['id']),
                title=metadata.get('title', 'Unknown Title'),
                author=metadata.get('author', 'Unknown Author'),
                relevance_score=round(item['relevance_score'], 3),
                difficulty_level=difficulty,
                key_chapters=metadata.get('tags', '').split(',') if metadata.get('tags') else ['General Content'],
                recommendation_reason=f"Highly relevant for {request.query} with comprehensive coverage",
                use_case=use_case,
                file_url=metadata.get('file_url', '')
            )
            recommendations.append(recommendation)
        
        return BookFilterResponse(
            recommendations=recommendations,
            query=request.query,
            total_recommendations=len(recommendations)
        )
        
    except Exception as e:
        logger.error(f"Book filtering failed: {e}")
        raise HTTPException(status_code=500, detail=f"Book filtering failed: {str(e)}")

# Service 4: Tutorial Video Filtering

@app.post("/mcp/filter_videos", response_model=VideoFilterResponse)
async def filter_videos(request: VideoFilterRequest):
    """Filter and recommend tutorial videos in optimal learning sequence"""
    try:
        logger.info(f"🎥 Filtering videos for: '{request.query}'")
        
        # Build filters
        filters = {}
        if request.difficulty_level:
            filters["difficulty"] = request.difficulty_level
            
        # Retrieve context from videos
        context = await rag_engine.retrieve_context(
            query=f"tutorial videos for {request.query}",
            namespace="videos",
            top_k=request.max_videos * 2,
            filters=filters if filters else None
        )
        
        # Organize videos by difficulty
        beginner_videos = []
        intermediate_videos = []
        advanced_videos = []
        
        total_duration_minutes = 0
        
        for i, item in enumerate(context[:request.max_videos]):
            metadata = item['metadata']
            
            # Extract duration (assuming format like "25 minutes" or "1 hour 30 minutes")
            duration_str = metadata.get('duration', '30 minutes')
            try:
                if 'hour' in duration_str:
                    # Parse hours and minutes
                    hours = int(duration_str.split(' hour')[0].split()[-1]) if 'hour' in duration_str else 0
                    minutes = int(duration_str.split('hour')[1].split(' minute')[0].strip()) if 'minute' in duration_str else 0
                    total_minutes = hours * 60 + minutes
                else:
                    # Parse just minutes
                    total_minutes = int(duration_str.split(' minute')[0].split()[-1]) if 'minute' in duration_str else 30
            except:
                total_minutes = 30  # Default
                
            total_duration_minutes += total_minutes
            
            # Determine difficulty level
            title_lower = metadata.get('title', '').lower()
            difficulty = 'intermediate'  # default
            
            if any(word in title_lower for word in ['basic', 'introduction', 'beginner', 'fundamentals', 'getting started']):
                difficulty = 'beginner'
            elif any(word in title_lower for word in ['advanced', 'expert', 'master', 'deep dive', 'complex']):
                difficulty = 'advanced'
                
            video_rec = VideoRecommendation(
                mongodb_id=metadata.get('document_id', item['id']),
                title=metadata.get('title', 'Unknown Title'),
                description=metadata.get('description', 'No description available'),
                duration=duration_str,
                difficulty=difficulty,
                prerequisites=[],
                learning_outcomes=[f"Learn {request.query} concepts from this video"],
                sequence_position=i + 1,
                url=metadata.get('url', '')
            )
            
            # Categorize by difficulty
            if difficulty == 'beginner':
                beginner_videos.append(video_rec)
            elif difficulty == 'advanced':
                advanced_videos.append(video_rec)
            else:
                intermediate_videos.append(video_rec)
        
        # Calculate total duration and schedule
        total_hours = total_duration_minutes // 60
        remaining_minutes = total_duration_minutes % 60
        total_duration_str = f"{total_hours} hours {remaining_minutes} minutes"
        
        # Recommended schedule
        videos_per_week = min(4, len(context))
        weeks_needed = max(1, len(context) // videos_per_week)
        recommended_schedule = f"{videos_per_week} videos per week, {weeks_needed} weeks total"
        
        return VideoFilterResponse(
            learning_sequence=VideoSequence(
                beginner=beginner_videos,
                intermediate=intermediate_videos,
                advanced=advanced_videos
            ),
            total_duration=total_duration_str,
            recommended_schedule=recommended_schedule,
            learning_path_summary=f"Complete learning path for {request.query} with {len(context)} videos organized by difficulty level",
            query=request.query
        )
        
    except Exception as e:
        logger.error(f"Video filtering failed: {e}")
        raise HTTPException(status_code=500, detail=f"Video filtering failed: {str(e)}")

# Additional utility endpoints

@app.get("/mcp/collections/stats")
async def get_collections_stats():
    """Get statistics for all collections"""
    try:
        stats = {}
        for name, collection in rag_engine.collections.items():
            stats[name] = {
                "document_count": collection.count(),
                "collection_name": name
            }
        
        return {
            "chromadb_collections": stats,
            "total_collections": len(stats),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get collection stats: {str(e)}")

@app.post("/mcp/search/multi")
async def multi_namespace_search(query: str, namespaces: List[str] = None, n_results: int = 5):
    """Search across multiple namespaces"""
    try:
        if not namespaces:
            namespaces = list(rag_engine.collections.keys())
            
        results = {}
        for namespace in namespaces:
            if namespace in rag_engine.collections:
                context = await rag_engine.retrieve_context(
                    query=query,
                    namespace=namespace,
                    top_k=n_results
                )
                results[namespace] = context
        
        return {
            "query": query,
            "results": results,
            "namespaces_searched": namespaces,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multi-namespace search failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080, reload=True)
