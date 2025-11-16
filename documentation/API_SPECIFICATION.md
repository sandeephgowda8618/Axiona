# MCP RAG Educational API - Complete API Specification

## 🎯 API Overview

The MCP RAG Educational API provides 4 core services for educational content discovery and personalized learning through RESTful endpoints powered by advanced RAG technology.

**Base URL**: `http://localhost:8080`  
**API Version**: 2.0.0  
**Content-Type**: `application/json`

## 🔗 Core Service Endpoints

### 1. Personalized Roadmap Generation

Generate customized learning roadmaps based on user requirements and available educational resources.

#### `POST /mcp/generate_roadmap`

**Description**: Creates a structured learning roadmap with phases, resources, and timelines.

**Request Body**:
```json
{
    "user_id": "string",           // Required: Unique user identifier
    "domain": "string",            // Required: Learning domain (e.g., "DSA", "ML", "Web Development")
    "current_level": "string",     // Required: "beginner" | "intermediate" | "advanced"
    "time_commitment": "string",   // Required: "1-2 hours" | "3-5 hours" | "5+ hours"
    "learning_goals": ["string"],  // Required: Array of learning objectives
    "preferences": {               // Optional: Learning preferences object
        "focus": "string",         // e.g., "theory", "practical", "problem_solving"
        "style": "string"          // e.g., "visual", "hands-on", "reading"
    }
}
```

**Response**:
```json
{
    "roadmap_id": "uuid",
    "user_id": "string",
    "domain": "string",
    "phases": [
        {
            "phase_number": 1,
            "title": "string",
            "duration_days": 21,
            "videos": ["mongodb_video_id"],     // Array of MongoDB video IDs
            "pdfs": ["mongodb_book_id"],        // Array of MongoDB book/PDF IDs
            "reference_book": "mongodb_book_id", // Best reference book ID
            "quiz_topics": ["string"],
            "prerequisites": ["string"],
            "learning_outcomes": ["string"]
        }
    ],
    "total_duration_days": 84,
    "estimated_completion": "2 months 3 weeks"
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:8080/mcp/generate_roadmap" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "student123",
    "domain": "Machine Learning",
    "current_level": "intermediate",
    "time_commitment": "3-5 hours",
    "learning_goals": ["supervised learning", "neural networks", "model deployment"],
    "preferences": {"focus": "practical", "style": "hands-on"}
  }'
```

---

### 2. PDF Search & Filtering

Intelligent search and filtering of PDF documents and study materials.

#### `POST /mcp/search_pdfs`

**Description**: Searches through StudyMaterials and Books collections for relevant PDFs.

**Request Body**:
```json
{
    "query": "string",                    // Required: Search query
    "academic_level": "string",           // Optional: Filter by academic level
    "subject_filter": "string",           // Optional: Filter by subject
    "max_results": 10                     // Optional: Max results (1-50), default 10
}
```

**Response**:
```json
{
    "results": [
        {
            "mongodb_id": "string",           // MongoDB document ID
            "title": "string",
            "author": "string", 
            "relevance_score": 0.85,          // 0.0 to 1.0 relevance score
            "relevant_sections": ["string"],   // Key sections/chapters
            "description": "string",           // Why it's relevant
            "file_url": "string",             // Direct download/access URL
            "subject": "string",              // Academic subject
            "pages": 150                      // Number of pages
        }
    ],
    "query": "string",
    "total_found": 5,
    "search_timestamp": "2025-11-02T18:00:00.000Z"
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:8080/mcp/search_pdfs" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "linear algebra matrices eigenvalues",
    "academic_level": "intermediate",
    "subject_filter": "Mathematics",
    "max_results": 5
  }'
```

---

### 3. Reference Book Filtering

Smart book recommendations and filtering based on topics and criteria.

#### `POST /mcp/filter_books`

**Description**: Filters and recommends reference books with detailed metadata.

**Request Body**:
```json
{
    "query": "string",                    // Required: Topic or subject
    "academic_level": "string",           // Optional: Academic level filter
    "category": "string",                 // Optional: Book category filter
    "max_recommendations": 5              // Optional: Max recommendations (1-20), default 5
}
```

**Response**:
```json
{
    "recommendations": [
        {
            "mongodb_id": "string",
            "title": "string",
            "author": "string",
            "relevance_score": 0.92,
            "difficulty_level": "intermediate",   // Assessed difficulty
            "key_chapters": ["string"],           // Relevant chapters/sections
            "recommendation_reason": "string",    // Why recommended
            "use_case": "string",                // "primary_textbook" | "reference" | "practice"
            "file_url": "string"                 // Direct access URL
        }
    ],
    "query": "string",
    "total_recommendations": 3
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:8080/mcp/filter_books" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "computer networks protocols",
    "academic_level": "intermediate",
    "category": "Computer Science",
    "max_recommendations": 3
  }'
```

---

### 4. Tutorial Video Filtering

Intelligent video tutorial discovery and learning sequence optimization.

#### `POST /mcp/filter_videos`

**Description**: Finds and organizes video tutorials into optimal learning sequences.

**Request Body**:
```json
{
    "query": "string",                    // Required: Topic to find videos for
    "duration_preference": "string",      // Optional: "short" | "medium" | "long"
    "difficulty_level": "string",         // Optional: Difficulty filter
    "max_videos": 20                      // Optional: Max videos (1-50), default 20
}
```

**Response**:
```json
{
    "learning_sequence": {
        "beginner": [
            {
                "mongodb_id": "string",
                "title": "string",
                "description": "string",
                "duration": "25 minutes",
                "difficulty": "beginner",
                "prerequisites": ["string"],
                "learning_outcomes": ["string"],
                "sequence_position": 1,
                "url": "string"                   // Video URL if available
            }
        ],
        "intermediate": [...],
        "advanced": [...]
    },
    "total_duration": "8 hours 30 minutes",
    "recommended_schedule": "3-4 videos per week, 2-3 hours weekly",
    "learning_path_summary": "string",
    "query": "string"
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:8080/mcp/filter_videos" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "react javascript frontend",
    "duration_preference": "medium",
    "difficulty_level": "beginner",
    "max_videos": 10
  }'
```

---

## 🔧 Utility Endpoints

### Health Check

#### `GET /health`

**Description**: System health and status information.

**Response**:
```json
{
    "status": "healthy",
    "service": "MCP RAG Educational API",
    "version": "2.0.0",
    "timestamp": "2025-11-02T18:00:00.000Z",
    "chromadb_collections": {
        "studymaterials": 330,
        "videos": 94,
        "books": 118
    },
    "mongodb_collections": {
        "studymaterials": 330,
        "videos": 94,
        "books": 118
    }
}
```

### Collection Statistics

#### `GET /mcp/collections/stats`

**Description**: Detailed statistics for all ChromaDB collections.

**Response**:
```json
{
    "chromadb_collections": {
        "studymaterials": {
            "document_count": 330,
            "collection_name": "studymaterials"
        },
        "videos": {
            "document_count": 94,
            "collection_name": "videos"
        },
        "books": {
            "document_count": 118,
            "collection_name": "books"
        }
    },
    "total_collections": 3,
    "timestamp": "2025-11-02T18:00:00.000Z"
}
```

### Multi-Namespace Search

#### `POST /mcp/search/multi`

**Description**: Search across multiple collections simultaneously.

**Query Parameters**:
- `query` (required): Search query string
- `namespaces` (optional): Comma-separated collection names
- `n_results` (optional): Results per namespace (default: 5)

**Response**:
```json
{
    "query": "machine learning",
    "results": {
        "studymaterials": [
            {
                "id": "string",
                "content": "string",
                "metadata": {...},
                "relevance_score": 0.85
            }
        ],
        "videos": [...],
        "books": [...]
    },
    "namespaces_searched": ["studymaterials", "videos", "books"],
    "timestamp": "2025-11-02T18:00:00.000Z"
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:8080/mcp/search/multi?query=algorithms&n_results=3"
```

---

## 📄 API Information

#### `GET /`

**Description**: API information and available services.

**Response**:
```json
{
    "message": "MCP RAG Educational API",
    "version": "2.0.0",
    "services": [
        "Personalized Roadmap Generation",
        "PDF Search & Filtering",
        "Reference Book Recommendations", 
        "Tutorial Video Filtering"
    ],
    "status": "operational",
    "timestamp": "2025-11-02T18:00:00.000Z"
}
```

---

## 🔒 Error Handling

### Standard HTTP Status Codes

- **200 OK**: Successful request
- **400 Bad Request**: Invalid input parameters
- **404 Not Found**: Endpoint not found
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server-side errors

### Error Response Format

```json
{
    "detail": "Error description",
    "type": "error_type",
    "errors": [
        {
            "loc": ["field_name"],
            "msg": "Validation error message",
            "type": "validation_type"
        }
    ]
}
```

### Common Error Examples

#### Validation Error (422)
```json
{
    "detail": [
        {
            "type": "string_pattern_mismatch",
            "loc": ["body", "current_level"],
            "msg": "String should match pattern '^(beginner|intermediate|advanced)$'",
            "input": "expert"
        }
    ]
}
```

#### Server Error (500)
```json
{
    "detail": "Failed to generate roadmap: Database connection timeout"
}
```

---

## 🎯 Usage Patterns

### Frontend Integration

#### React Example
```javascript
// Roadmap generation
const generateRoadmap = async (roadmapData) => {
    const response = await fetch('/mcp/generate_roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roadmapData)
    });
    return await response.json();
};

// PDF search with filters
const searchPDFs = async (query, filters = {}) => {
    const response = await fetch('/mcp/search_pdfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, ...filters })
    });
    return await response.json();
};
```

#### Python Client Example
```python
import requests

class MCPClient:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
    
    def generate_roadmap(self, user_id, domain, level, commitment, goals):
        data = {
            "user_id": user_id,
            "domain": domain, 
            "current_level": level,
            "time_commitment": commitment,
            "learning_goals": goals
        }
        response = requests.post(f"{self.base_url}/mcp/generate_roadmap", json=data)
        return response.json()
    
    def search_pdfs(self, query, max_results=10):
        data = {"query": query, "max_results": max_results}
        response = requests.post(f"{self.base_url}/mcp/search_pdfs", json=data)
        return response.json()
```

### Batch Processing

For processing multiple queries efficiently:

```python
import asyncio
import aiohttp

async def batch_search(queries):
    async with aiohttp.ClientSession() as session:
        tasks = []
        for query in queries:
            task = session.post(
                'http://localhost:8080/mcp/search_pdfs',
                json={"query": query, "max_results": 5}
            )
            tasks.append(task)
        
        responses = await asyncio.gather(*tasks)
        return [await r.json() for r in responses]
```

---

## 📊 Rate Limiting & Performance

### Current Limits
- **No rate limiting** implemented (development phase)
- **Concurrent requests**: Limited by server resources
- **Timeout**: 30 seconds per request
- **Max payload**: 10MB

### Performance Guidelines
- **Simple searches**: < 500ms response time
- **Complex roadmaps**: < 2s response time
- **Batch operations**: Use async/await patterns
- **Large result sets**: Implement pagination

### Optimization Tips
1. **Use specific queries** for better relevance
2. **Apply filters** to reduce search space
3. **Cache frequent queries** on client side
4. **Limit max_results** for faster responses

---

## 🔍 Interactive API Documentation

### Swagger UI
Access interactive API documentation at: `http://localhost:8080/docs`

### ReDoc
Alternative documentation interface: `http://localhost:8080/redoc`

### OpenAPI Schema
Raw OpenAPI 3.0 schema: `http://localhost:8080/openapi.json`

---

**API Version**: 2.0.0  
**Last Updated**: November 2, 2025  
**Documentation Status**: Complete  
**Support**: StudyPES Development Team
