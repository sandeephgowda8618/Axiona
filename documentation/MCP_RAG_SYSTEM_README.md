# RAG-Based MCP API System

A unified Retrieval-Augmented Generation (RAG) Model Context Protocol (MCP) API that serves multiple educational use cases through a single vector database and MongoDB integration.

## 🎯 Overview

This system provides a unified RAG pipeline that powers:
1. **Personalized Roadmap Generation** - Dynamic learning paths based on user skills and goals
2. **PDF Search & Filtering** - Smart document discovery in study pages
3. **Reference Book Recommendations** - AI-powered book filtering for library sections
4. **Tutorial Video Filtering** - Intelligent video recommendations for tutorials

## 📊 Current Database Status

- **MongoDB Books Collection**: 118 total books
  - 21 original library books (file_url: "N/A")
  - 97 GitHub reference PDFs with direct download URLs
- **Vector Database**: ChromaDB with book content embeddings
- **Video Collection**: ~100 tutorial videos with metadata

## 🏗️ Architecture

```
MongoDB (Source of Truth)
    ↓
standard_library_ingest.py (Standardized Ingestion)
    ↓
ChromaDB (Vector Embeddings)
    ↓
LLM (Gemini/Llama) 
    ↓
MCP API Endpoints
```

## 📚 Standardized Ingestion Pipeline

The system now uses a single, standardized ingestion script:

- **`standard_library_ingest.py`** - Complete MongoDB → ChromaDB ingestion
  - Maps all metadata fields from MongoDB to ChromaDB
  - Includes enhanced metadata (key_concepts, difficulty, target_audience, etc.)
  - Downloads and extracts full PDF content from GitHub URLs
  - Creates comprehensive searchable text with all metadata fields
  - Provides detailed statistics and error handling

## 🚀 API Endpoints

### 1. Personalized Roadmap Generation

```python
@app.post("/mcp/generate_roadmap")
async def generate_roadmap(
    user_id: str, 
    domain: str,  # e.g., "DSA", "ML", "Web Development"
    current_level: str,  # "beginner", "intermediate", "advanced"
    time_commitment: str,  # "1-2 hours", "3-5 hours", "5+ hours" daily
    learning_goals: List[str],
    preferences: Dict  # learning style, focus areas
):
    # RAG retrieval for domain-specific content
    context = await rag_engine.retrieve(
        query=f"comprehensive learning path for {domain} from {current_level} level",
        namespace="educational_content",
        top_k=20,
        filters={
            "domain": domain,
            "level": current_level,
            "content_type": ["roadmap", "curriculum", "syllabus"]
        }
    )
    
    # Generate structured roadmap
    roadmap = await llm_model.generate(
        prompt=f"""
        Based on the educational content: {context}
        
        Create a comprehensive learning roadmap for:
        - Domain: {domain}
        - Current Level: {current_level}
        - Daily Time: {time_commitment}
        - Goals: {learning_goals}
        
        Structure the roadmap with:
        1. **Phases**: 4-6 progressive learning phases
        2. **Timeline**: Realistic completion estimates based on time commitment
        3. **Resources per Phase**:
           - Minimum 2 tutorial videos (with MongoDB video IDs)
           - Minimum 2 reference PDFs (with MongoDB book IDs)
           - 1 recommended best reference book
           - Phase-specific quizzes/assessments
        4. **Prerequisites**: What's needed before each phase
        5. **Milestones**: Measurable learning outcomes
        
        Return as structured JSON with MongoDB document IDs for all resources.
        
        Example JSON structure:
        {{
            "roadmap_id": "generated_uuid",
            "phases": [
                {{
                    "phase_number": 1,
                    "title": "Fundamentals",
                    "duration_days": 14,
                    "videos": ["video_id_1", "video_id_2"],
                    "pdfs": ["book_id_1", "book_id_2"],
                    "reference_book": "book_id_best",
                    "quiz_topics": ["topic1", "topic2"],
                    "prerequisites": [],
                    "learning_outcomes": ["outcome1", "outcome2"]
                }}
            ]
        }}
        """,
        response_format="json"
    )
    
    return {"roadmap": roadmap, "user_id": user_id}
```

### 2. PDF Search & Filtering

```python
@app.post("/mcp/search_pdfs")
async def search_pdfs(
    query: str,
    academic_level: str = None,
    subject_filter: str = None,
    max_results: int = 10
):
    # RAG retrieval from vector database
    context = await rag_engine.retrieve(
        query=query,
        namespace="pdf_content",
        top_k=max_results * 2,  # Get more for filtering
        filters={
            "level": academic_level,
            "subject": subject_filter
        } if academic_level or subject_filter else None
    )
    
    # Generate filtered results with MongoDB IDs
    response = await llm_model.generate(
        prompt=f"""
        From these PDF documents: {context}
        
        For the search query: "{query}"
        Subject filter: {subject_filter or "Any"}
        Academic level: {academic_level or "Any"}
        
        Return the most relevant {max_results} documents with:
        1. MongoDB document ID
        2. Title
        3. Author
        4. Relevance score (1-10)
        5. Key sections/chapters related to query
        6. Brief description of relevance
        
        Return as JSON array:
        [
            {{
                "mongodb_id": "actual_mongodb_id",
                "title": "Document Title",
                "author": "Author Name",
                "relevance_score": 9,
                "relevant_sections": ["Chapter 1", "Section 3.2"],
                "description": "Why this document matches the query",
                "file_url": "download_or_github_url"
            }}
        ]
        """,
        response_format="json"
    )
    
    return {"results": response, "query": query, "total_found": len(response)}
```

### 3. Reference Book Filtering

```python
@app.post("/mcp/filter_books")
async def filter_books(
    query: str, 
    academic_level: str = None,
    category: str = None,
    max_recommendations: int = 5
):
    # RAG retrieval for book recommendations
    context = await rag_engine.retrieve(
        query=f"reference books for {query}",
        namespace="reference_books",
        top_k=15,
        filters={
            "category": category,
            "level": academic_level
        } if category or academic_level else None
    )
    
    response = await llm_model.generate(
        prompt=f"""
        From these reference books: {context}
        
        For the topic: "{query}"
        Category: {category or "Any"}
        Academic level: {academic_level or "Any"}
        
        Recommend the top {max_recommendations} most relevant books.
        
        For each book, provide:
        1. MongoDB document ID (for database lookup)
        2. Title and Author
        3. Relevance score (1-10)
        4. Difficulty level assessment
        5. Key chapters/sections to focus on
        6. Why it's recommended for this topic
        7. Best use case (textbook, reference, practice)
        
        Return as JSON array:
        [
            {{
                "mongodb_id": "actual_book_id",
                "title": "Book Title",
                "author": "Author Name",
                "relevance_score": 9,
                "difficulty_level": "intermediate",
                "key_chapters": ["Chapter 3: Topic X", "Chapter 7: Advanced Y"],
                "recommendation_reason": "Excellent coverage of fundamental concepts with practical examples",
                "use_case": "primary_textbook",
                "file_url": "github_or_library_url"
            }}
        ]
        """,
        response_format="json"
    )
    
    return {"recommendations": response, "query": query}
```

### 4. Tutorial Video Recommendations

```python
@app.post("/mcp/filter_videos")
async def filter_videos(
    query: str, 
    duration_preference: str = None,  # "short" (<30min), "medium" (30-60min), "long" (>60min)
    difficulty_level: str = None,
    max_videos: int = 20
):
    # RAG retrieval for video recommendations
    context = await rag_engine.retrieve(
        query=f"tutorial videos for {query}",
        namespace="tutorial_videos",
        top_k=max_videos * 2,
        filters={
            "duration_category": duration_preference,
            "difficulty": difficulty_level
        } if duration_preference or difficulty_level else None
    )
    
    response = await llm_model.generate(
        prompt=f"""
        From these tutorial videos: {context}
        
        For learning: "{query}"
        Duration preference: {duration_preference or "Any"}
        Difficulty level: {difficulty_level or "Any"}
        
        Create an optimal learning sequence with the best {max_videos} videos.
        
        Organize them into:
        1. **Beginner videos** (foundational concepts)
        2. **Intermediate videos** (building on basics)
        3. **Advanced/Project videos** (practical application)
        
        For each video provide:
        - MongoDB video ID
        - Title and description
        - Duration
        - Difficulty level
        - Prerequisites (if any)
        - Learning outcomes
        - Best position in learning sequence
        
        Also calculate:
        - Total estimated learning time
        - Recommended study schedule
        
        Return as structured JSON:
        {{
            "learning_sequence": {{
                "beginner": [
                    {{
                        "mongodb_id": "video_id",
                        "title": "Video Title",
                        "duration": "25 minutes",
                        "difficulty": "beginner",
                        "prerequisites": [],
                        "learning_outcomes": ["outcome1", "outcome2"],
                        "sequence_position": 1
                    }}
                ],
                "intermediate": [...],
                "advanced": [...]
            }},
            "total_duration": "8 hours 30 minutes",
            "recommended_schedule": "3-4 videos per week, 2-3 hours weekly",
            "learning_path_summary": "Complete learning path description"
        }}
        """,
        response_format="json"
    )
    
    return {"video_sequence": response, "query": query}
```

## 🛠️ Implementation Details

### MongoDB Collections Structure

```javascript
// Books Collection (118 documents)
{
  "_id": ObjectId,
  "title": "Book Title",
  "author": "Author Name",
  "subject": "Computer Science",
  "category": "Academic",
  "file_url": "https://github.com/...pdf" | "N/A",
  "pages": 300,
  "tags": ["algorithm", "data-structure"],
  "difficulty": "intermediate",
  "description": "Book description"
}

// Videos Collection (~100 documents)
{
  "_id": ObjectId,
  "title": "Video Title",
  "description": "Video description",
  "duration": "30 minutes",
  "difficulty": "beginner",
  "topic": "JavaScript",
  "url": "youtube_or_local_url",
  "metadata": { ... }
}
```

### ChromaDB Collections

- `pdf_content` - Chunked PDF content with metadata
- `reference_books` - Book summaries and metadata
- `tutorial_videos` - Video transcripts and metadata
- `educational_content` - Curated educational materials

### Key Features

1. **Unified RAG Pipeline**: Single vector database serving multiple use cases
2. **MongoDB Integration**: All responses include MongoDB IDs for frontend rendering
3. **Smart Filtering**: Context-aware filtering based on user preferences
4. **Structured Responses**: JSON outputs with standardized formats
5. **Educational Focus**: Designed specifically for learning platforms

## 🔧 Setup Instructions

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment** (`.env`):
   ```
   MONGODB_URI=mongodb://localhost:27017/study-ai
   CHROMA_DB_PATH=./chromadb
   GEMINI_API_KEY=your_gemini_key
   OPENAI_API_KEY=your_openai_key
   ```

3. **Initialize Vector Database**:
   ```bash
   python ingest_from_mongodb.py
   ```

4. **Start API Server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## 📝 Usage Examples

### Generate a DSA Learning Roadmap
```bash
curl -X POST "http://localhost:8000/mcp/generate_roadmap" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "domain": "DSA",
    "current_level": "beginner",
    "time_commitment": "2-3 hours",
    "learning_goals": ["crack technical interviews", "competitive programming"],
    "preferences": {"focus": "problem_solving", "style": "practical"}
  }'
```

### Search for Machine Learning PDFs
```bash
curl -X POST "http://localhost:8000/mcp/search_pdfs" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning algorithms",
    "academic_level": "intermediate",
    "subject_filter": "Computer Science",
    "max_results": 5
  }'
```

## 🎯 Benefits

1. **Consistency**: Single source of truth (MongoDB) for all content
2. **Efficiency**: Unified RAG system reduces infrastructure complexity
3. **Scalability**: Easy to add new content types and use cases
4. **User Experience**: Intelligent, context-aware recommendations
5. **Maintainability**: Centralized content management and vector indexing

## 🚀 Future Enhancements

- [ ] Real-time learning progress tracking
- [ ] Collaborative filtering based on user behavior
- [ ] Multi-language support
- [ ] Advanced analytics and recommendation tuning
- [ ] Integration with more content sources

---

**Status**: Production Ready  
**Last Updated**: November 1, 2025  
**Database**: 118 books, ~100 videos integrated