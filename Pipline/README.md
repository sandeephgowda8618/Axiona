# Multi-Agent RAG Pipeline System

## Overview

This is a complete production-ready multi-agent Retrieval-Augmented Generation (RAG) system specifically designed for educational content. The system provides personalized learning roadmaps, PDF search capabilities, reference book access, and tutorial video filtering.

## Architecture

```
Pipline/
├── .env                           # Environment configuration
├── requirements.txt               # Python dependencies
├── test_ingestion.py             # Test script for ingestion pipeline
├── MULTI_AGENT_RAG_IMPLEMENTATION_GUIDE.md  # Complete technical guide
│
├── config/                        # System configuration
│   ├── settings.py               # Environment variables and settings
│   └── database.py               # MongoDB connection and setup
│
├── core/                         # Core system components
│   ├── embeddings.py             # Text embedding service
│   ├── vector_db.py              # ChromaDB vector database manager
│   └── gridfs_handler.py         # MongoDB GridFS file storage
│
├── agents/                       # AI agents for different tasks
│   ├── base_agent.py            # Base agent class
│   ├── roadmap_agent.py         # Main roadmap coordination
│   ├── interview_agent.py       # User skill assessment
│   ├── skill_evaluator_agent.py # Skill level evaluation
│   └── roadmap_builder_agent.py # Roadmap construction
│
├── api/                          # FastAPI REST endpoints
│   ├── main.py                   # FastAPI application
│   ├── search_routes.py         # Search endpoints
│   ├── roadmap_routes.py        # Roadmap generation endpoints
│   └── file_routes.py           # File streaming endpoints
│
├── ingestion/                    # Data ingestion pipeline
│   ├── source_processor.py      # Process structured book data
│   └── book_ingestion_pipeline.py # Complete ingestion pipeline
│
├── utils/                        # Utility functions
│   └── pdf_processor.py         # PDF text extraction
│
└── Data/                         # Source data
    └── Refrence_books/
        └── Refrence_books        # Structured book metadata (JSON)
```

## Features

### 1. Personalized Roadmap Generation
- **Interview Agent**: Conducts conversational interviews to assess user skills
- **Skill Evaluator**: Analyzes responses and determines proficiency levels
- **Roadmap Builder**: Creates customized learning paths based on goals and current skills

### 2. PDF Search & Filtering
- Vector-based semantic search across educational PDFs
- Metadata filtering by subject, difficulty, author
- Content preview and relevance scoring

### 3. Reference Book Search
- Structured database of computer science and technical books
- Advanced filtering by concepts, prerequisites, target audience
- Integration with GridFS for file storage

### 4. Tutorial Video Filtering
- AI-powered video content analysis
- Skill-level appropriate content recommendations
- Integration with learning roadmaps

## Database Schema

### MongoDB Collections

#### Books Collection
```json
{
  "_id": "unique_book_id",
  "title": "Book Title",
  "author": "Author Name",
  "subject": "Computer Science",
  "difficulty": "Intermediate",
  "key_concepts": ["concept1", "concept2"],
  "prerequisites": ["prereq1", "prereq2"],
  "target_audience": "Students",
  "file_id": "gridfs_file_id",
  "processed": true,
  "embeddings_created": true
}
```

#### Roadmap Sessions Collection
```json
{
  "_id": "session_id",
  "user_id": "user_identifier", 
  "session_type": "roadmap_generation",
  "status": "completed",
  "interview_data": {
    "responses": [],
    "skill_assessment": {},
    "learning_goals": []
  },
  "generated_roadmap": {
    "phases": [],
    "timeline": "3 months",
    "resources": []
  },
  "created_at": "2025-11-13T10:00:00Z"
}
```

### ChromaDB Collections

#### Books Collection
- **Purpose**: Semantic search across book content
- **Metadata**: book_id, title, subject, difficulty, concepts
- **Embeddings**: Text chunks from PDF content

#### Videos Collection
- **Purpose**: Video content search and filtering
- **Metadata**: video_id, title, duration, skill_level, topics
- **Embeddings**: Transcript and description embeddings

## Installation & Setup

### 1. Environment Setup

```bash
# Clone and navigate to the Pipeline directory
cd Pipline

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your settings
```

### 2. Environment Variables (.env)

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB_NAME=multi_agent_rag_system

# ChromaDB Configuration  
CHROMA_PERSIST_DIR=./chromadb
CHROMA_COLLECTION_PREFIX=rag_system

# Embedding Model
EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG_MODE=true

# LLM Configuration
LLM_MODEL_PATH=path/to/local/model
LLM_CONTEXT_LENGTH=4096
LLM_TEMPERATURE=0.7
```

### 3. Database Setup

```bash
# Start MongoDB (ensure it's running on the configured port)
mongod --dbpath /path/to/data

# Initialize database and collections
python -c "from config.database import init_database; init_database()"
```

### 4. Data Ingestion

```bash
# Test the ingestion pipeline
python test_ingestion.py

# Run full book ingestion (this may take time)
python -c "
from ingestion.book_ingestion_pipeline import BookIngestionPipeline
import asyncio

async def ingest():
    pipeline = BookIngestionPipeline()
    stats = await pipeline.ingest_books(limit=None)  # Process all books
    print(f'Ingestion completed: {stats}')

asyncio.run(ingest())
"
```

## Usage

### 1. Start the API Server

```bash
python api/main.py
```

The API will be available at `http://localhost:8000`

### 2. API Endpoints

#### Health Check
```bash
curl http://localhost:8000/health
```

#### Search Books
```bash
curl -X POST http://localhost:8000/api/search/books \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning algorithms",
    "filters": {
      "subject": "Computer Science",
      "difficulty": "Intermediate"
    },
    "top_k": 5
  }'
```

#### Start Roadmap Session
```bash
curl -X POST http://localhost:8000/api/roadmap/start \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "learning_goals": ["Learn Python programming", "Build web applications"]
  }'
```

#### Continue Roadmap Interview
```bash
curl -X POST http://localhost:8000/api/roadmap/sessions/{session_id}/continue \
  -H "Content-Type: application/json" \
  -d '{
    "response": "I have basic programming knowledge in Java"
  }'
```

### 3. Direct Component Usage

#### Source Data Processor
```python
from ingestion.source_processor import SourceDataProcessor

processor = SourceDataProcessor()
books = processor.load_source_data()
cs_books = processor.get_books_by_subject("Computer Science")
```

#### Vector Search
```python
from core.vector_db import VectorDBManager

vector_db = VectorDBManager()
results = vector_db.search_similar(
    collection_key="books",
    query="neural networks deep learning",
    n_results=10
)
```

#### GridFS File Access
```python
from core.gridfs_handler import GridFSHandler

gridfs = GridFSHandler()
file_info = gridfs.get_file_info(file_id)
file_stream = gridfs.get_file(file_id)
```

## Data Sources

### Current Book Collection
The system includes a curated collection of technical books covering:
- **Computer Science Fundamentals**: Algorithms, data structures, computer architecture
- **Programming Languages**: C, C++, Python, Java, JavaScript
- **Software Engineering**: Design patterns, testing, project management
- **Systems Programming**: Operating systems, networks, databases
- **Specialized Topics**: Machine learning, graphics, compilers

### Metadata Structure
Each book includes:
- Title, author, publication info
- Subject classification and difficulty level
- Key concepts and prerequisites
- Target audience and learning objectives
- File size, page count, and format info
- Quality metadata (AI-generated summaries and tags)

## Testing

### Unit Tests
```bash
# Test individual components
python test_ingestion.py

# Test specific modules
python -m pytest tests/ -v
```

### Integration Tests
```bash
# Test complete pipeline
python -c "
import asyncio
from ingestion.book_ingestion_pipeline import BookIngestionPipeline

async def test():
    pipeline = BookIngestionPipeline() 
    stats = await pipeline.ingest_books(limit=3)
    print('Test completed:', stats)

asyncio.run(test())
"
```

## Performance Optimization

### Embedding Generation
- Uses sentence-transformers for fast local embeddings
- Batch processing for multiple documents
- Configurable chunk sizes for optimal performance

### Vector Search
- ChromaDB for efficient similarity search
- Automatic indexing and persistence
- Metadata filtering for faster queries

### File Storage
- MongoDB GridFS for large file handling
- Streaming support for memory efficiency
- Automatic metadata indexing

## Production Deployment

### Docker Setup
```bash
# Build Docker image
docker build -t rag-pipeline .

# Run with docker-compose
docker-compose up -d
```

### Scalability Considerations
- Horizontal scaling with multiple API instances
- Database sharding for large document collections  
- Distributed vector search for high-throughput scenarios
- Caching layer for frequent queries

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MongoDB service status
   - Verify connection string in .env
   - Ensure database permissions

2. **ChromaDB Persistence Issues**
   - Check directory permissions
   - Verify CHROMA_PERSIST_DIR path
   - Clear and reinitialize if corrupted

3. **Embedding Model Loading**
   - Ensure internet connection for first download
   - Check available memory for model loading
   - Verify model compatibility

4. **PDF Processing Errors**
   - Check PDF file integrity
   - Ensure sufficient disk space
   - Verify PyMuPDF installation

### Logging
All components use structured logging. Check logs for detailed error information:
```bash
# View recent logs
tail -f logs/rag_pipeline.log

# Search for errors
grep ERROR logs/rag_pipeline.log
```

## Contributing

1. Follow the existing code structure and naming conventions
2. Add comprehensive docstrings and type hints  
3. Include unit tests for new functionality
4. Update documentation for API changes
5. Test with the provided data before submitting

## License

This project is licensed under the MIT License - see the LICENSE file for details.
