# MCP RAG Roadmap Generation Integration

This document describes the integration between the 5-Phase Roadmap Generation Wizard and the MCP (Model Context Protocol) based RAG (Retrieval-Augmented Generation) system.

## Overview

The roadmap generation system combines:
- **Frontend Wizard**: 5-phase questionnaire collecting user preferences
- **MCP RAG System**: Vector-based content retrieval from multiple sources
- **Lightweight LLM**: AI model for generating personalized roadmaps
- **Structured Output**: Organized phases with resources and milestones

## Architecture

```
Frontend Wizard → API Service → MCP RAG System → LLM Generation → Structured Roadmap
     ↓              ↓              ↓                ↓               ↓
Phase 1-5     roadmapAPI.ts    core_rag.py    roadmap_generator.py  Response
Questions                      ChromaDB       DialoGPT/Llama       Phases
```

## Components

### 1. Frontend Integration

**File**: `/client/src/services/roadmapAPI.ts`
- API client for communicating with MCP RAG system
- Handles timeouts, errors, and response formatting
- Environment-based configuration

**File**: `/client/src/components/SimpleRoadmapWizard.jsx`
- Updated to use MCP RAG API instead of mock data
- Enhanced loading states with AI generation indicators
- Comprehensive error handling

### 2. MCP RAG Backend

**File**: `/mcp-rag-system/core_rag.py`
- FastAPI server with `/generate-roadmap` endpoint
- Integration with ChromaDB for vector storage
- RAG search across multiple namespaces (roadmap, pdf, books, videos)

**File**: `/mcp-rag-system/services/roadmap_generator.py`
- Lightweight LLM integration (DialoGPT-small → Llama ready)
- Enhanced RAG search with intelligent query generation
- Structured roadmap output with phases and metadata

### 3. API Models

**File**: `/mcp-rag-system/models/api_models.py`
- `RoadmapGenerationRequest`: Input from wizard
- `RoadmapGenerationResponse`: Generated roadmap structure
- `RoadmapPhase`: Individual phase structure

## Data Flow

### 1. User Input (Frontend)
```javascript
{
  phase1: { goal: "machine learning", motivation: "career_change" },
  phase2: { currentLevel: "beginner", coreStrengths: "Python" },
  phase3: { timeCommitment: "2 hours daily", weeklyDays: "5 days" },
  phase4: { challengeLevel: "intermediate", motivationFactor: "portfolio" },
  phase5: { ultimateGoal: "ML Engineer", expectedOutcome: "job_ready" }
}
```

### 2. RAG Content Retrieval
- Generate search queries from user profile
- Search across multiple namespaces:
  - `roadmap`: Structured learning paths
  - `pdf`: Academic papers and guides
  - `books`: Textbook content
  - `videos`: Tutorial transcripts
- Retrieve top 5 relevant documents

### 3. LLM Generation
- Combine user profile + RAG content
- Generate structured roadmap with:
  - Foundation Phase (Weeks 1-2)
  - Building Phase (Weeks 3-4)
  - Application Phase (Weeks 5-6)
  - Mastery Phase (Weeks 7-8)

### 4. Structured Response
```json
{
  "user_profile": "User Learning Profile summary...",
  "roadmap_content": "Generated roadmap text...",
  "phases": [
    {
      "title": "Phase 1: Foundation (Weeks 1-2)",
      "content": "Learn fundamental concepts..."
    }
  ],
  "personalization_score": 0.85,
  "relevant_resources": 5,
  "estimated_duration": "8 weeks"
}
```

## Setup Instructions

### 1. Backend Setup
```bash
cd /mcp-rag-system

# Install dependencies
pip install -r requirements.txt

# Start the server
python start_server.py
```

### 2. Frontend Setup
```bash
cd /client

# Create environment file
cp .env.example .env.local

# Edit .env.local to set:
VITE_RAG_API_URL=http://localhost:8000

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

### 3. Test Integration
```bash
cd /mcp-rag-system

# Run comprehensive integration test
python test_mcp_roadmap_integration.py
```

## Configuration

### Environment Variables

**Frontend** (`.env.local`):
```env
VITE_RAG_API_URL=http://localhost:8000
VITE_DEBUG_MODE=true
VITE_API_TIMEOUT=30000
```

**Backend** (MCP RAG System):
- ChromaDB storage: `./chromadb/`
- Default model: `microsoft/DialoGPT-small`
- API port: `8000`

## API Endpoints

### Health Check
```http
GET /health
Response: { "status": "healthy", "service": "Core RAG System" }
```

### Generate Roadmap
```http
POST /generate-roadmap
Content-Type: application/json

{
  "user_id": "optional_user_id",
  "phase1": { "goal": "machine learning" },
  "phase2": { "currentLevel": "beginner" },
  "phase3": { "timeCommitment": "2 hours daily" },
  "phase4": { "challengeLevel": "intermediate" },
  "phase5": { "ultimateGoal": "Become ML engineer" },
  "search_namespaces": ["roadmap", "pdf", "books", "videos"],
  "max_resources": 5
}
```

### Search Content
```http
POST /search
Content-Type: application/json

{
  "query": "machine learning tutorial",
  "namespace": "roadmap",
  "n_results": 5
}
```

## Model Upgrade Path

### Current: DialoGPT-small
- **Pros**: Fast, lightweight, good for development
- **Cons**: Limited generation quality, not specialized for educational content

### Target: Lightweight Llama Model
- **Model**: `meta-llama/Llama-2-7b-chat-hf` or similar
- **Fine-tuning**: Educational roadmap generation
- **Benefits**: Better quality, domain-specific knowledge

### Upgrade Process:
1. Replace model in `roadmap_generator.py`:
   ```python
   self.model_name = "meta-llama/Llama-2-7b-chat-hf"
   ```
2. Update tokenizer and generation parameters
3. Fine-tune on educational roadmap data
4. Test and validate improvements

## Performance Considerations

### Current Performance:
- RAG search: ~200ms
- LLM generation: ~2-5 seconds
- Total response time: ~5-10 seconds

### Optimization Strategies:
1. **Model Optimization**: Quantization, smaller models
2. **Caching**: Cache generated roadmaps for similar profiles
3. **Async Processing**: Background generation with status polling
4. **Hardware**: GPU acceleration for faster inference

## Testing

### Unit Tests
- `test_mcp_roadmap_integration.py`: End-to-end integration test
- Tests RAG retrieval, LLM generation, API endpoints

### Manual Testing
1. Complete wizard in frontend
2. Check browser network tab for API calls
3. Verify backend logs for RAG searches
4. Validate generated roadmap structure

## Troubleshooting

### Common Issues

**Frontend can't connect to backend:**
- Check `VITE_RAG_API_URL` in `.env.local`
- Verify backend server is running on port 8000
- Check CORS settings in `core_rag.py`

**RAG search returns no results:**
- Add sample data using `/embed` endpoint
- Check ChromaDB collections with `/collections`
- Verify namespace names match

**LLM generation fails:**
- Check model initialization in logs
- Verify transformers library version compatibility
- Try with smaller prompts

**Timeout errors:**
- Increase `VITE_API_TIMEOUT` in frontend
- Check server resources and model loading time
- Consider using a smaller/faster model

## Future Enhancements

1. **Advanced RAG**:
   - Semantic chunking of documents
   - Metadata filtering
   - Re-ranking of search results

2. **Better LLM Integration**:
   - Fine-tuned educational models
   - Streaming responses
   - Multi-turn conversations

3. **Personalization**:
   - User learning history
   - Progress tracking
   - Adaptive recommendations

4. **Content Management**:
   - Admin interface for content
   - Automated content ingestion
   - Content quality scoring

## Monitoring and Analytics

### Metrics to Track:
- Generation success rate
- Average response time
- User satisfaction scores
- RAG retrieval accuracy
- Model performance metrics

### Logging:
- User interactions
- API response times
- Error rates and types
- Resource usage patterns

---

## Support

For issues or questions:
1. Check server logs in MCP RAG system
2. Use the test script to verify integration
3. Review browser console for frontend errors
4. Ensure all dependencies are properly installed
