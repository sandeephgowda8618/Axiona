# 🚀 Multi-Agent RAG + Personalized Tutor Engine Implementation Guide

## 📋 System Overview

This is a complete implementation guide for building a **Multi-Agent RAG System + Personalized Tutor Engine** with 4 major capabilities:

1. **Personalized Roadmap Generation** (interactive Q&A → curriculum builder)
2. **PDF Search & Filtering** (smart PES materials search) 
3. **Reference Book Search**
4. **Tutorial Video Filtering**

## 🏗️ Final Architecture

```
                 ┌──────────────────────────────────────────────────┐
                 │                    API Layer                     │
                 │  /roadmap  /search/pdf  /search/books  /search/videos │
                 └──────────────────────────────────────────────────┘
                                   │
                          (routes call agents)
                                   │
      ┌────────────────────────────────────────────────────────────────────┐
      │                             LANGGRAPH                             │
      ├────────────────────────────────────────────────────────────────────┤
      │ 1. Query Router Agent                                             │
      │ 2. PDF Search Agent                                               │
      │ 3. Book Filtering Agent                                           │
      │ 4. Video Filtering Agent                                          │
      │ 5. Roadmap Agent → Subgraph                                       │
      │          ├─ Interview Agent                                       │
      │          ├─ Skill-Evaluator Agent                                 │
      │          ├─ Roadmap Builder Agent                                 │
      │          └─ Quiz Generator Agent                                  │
      └────────────────────────────────────────────────────────────────────┘
                                   │
                   ┌───────────────────────────────────┐
                   │     Vector DB (Chroma / Mongo)   │
                   │  - PES PDFs (chunks)             │
                   │  - Books meta + chunks           │
                   │  - Videos metadata               │
                   └───────────────────────────────────┘
                                   │
                         ┌────────────────────────┐
                         │      Local LLM         │
                         │ (Mistral 7B / Llama 3) │
                         └────────────────────────┘
```

## 🗄️ Database Collections Schema

### Core Collections

#### 1. **semesters**
```javascript
{
  "_id": "sem1",
  "semester_number": 1,
  "name": "Semester 1",
  "createdAt": "2025-11-02T12:00:00Z"
}
```

#### 2. **subjects**
```javascript
{
  "_id": "chemistry",
  "semester_id": "sem1",
  "name": "Chemistry",
  "display_name": "Chemistry",
  "createdAt": "2025-11-02T12:00:00Z"
}
```

#### 3. **materials** (PES Slides)
```javascript
{
  "_id": "mat_258",
  "title": "Phase Equilibria",
  "subject_id": "chemistry",
  "semester_id": "sem1",
  "unit": "U1",
  "topic": "Phase Equilibria",
  "file_name": "Sem1_Chemistry_U1_PhaseEquilibria.pdf",
  "file_type": "pdf",
  "pages": 45,
  "language": "English",
  "tags": ["Phase Equilibria","Thermodynamics"],
  "level": "Beginner",
  "gridfs_id": "656...",   // GridFS ObjectId
  "file_url": "/api/files/stream/mat_258",
  "createdAt": "2025-11-02T20:46:00Z",
  "updatedAt": "2025-11-02T20:46:00Z"
}
```

#### 4. **reference_books**
```javascript
{
  "_id": "pdf_001",
  "title": "Computer Organization and Architecture",
  "author": "William Stallings",
  "pages": 787,
  "language": "English",
  "summary": "...",
  "key_concepts": ["CPU Design","Pipelining","Cache"],
  "difficulty": "Intermediate",
  "tags": ["Computer Architecture","Performance"],
  "source": "GitHub",
  "file_name": "comp(1).pdf",
  "gridfs_id": "657...",
  "file_url": "/api/books/stream/pdf_001",
  "processed_at": "2025-11-01T16:39:16Z"
}
```

#### 5. **videos**
```javascript
{
  "_id": "vid_001",
  "title": "Intro to Git",
  "video_url": "https://youtu.be/irqbmMNs2Bo",
  "channel": "FreeCodeCamp",
  "playlist_id": "PLx123",
  "duration_seconds": 3600,
  "views": 123456,
  "topic_tags": ["git","version-control"],
  "transcript": "<optional-large-text>",
  "createdAt": "2025-11-02T10:00:00Z"
}
```

#### 6. **vector_chunks** (Embedding Store)
```javascript
{
  "_id": "chunk_0001",
  "source_collection": "materials",   // or "reference_books" or "videos"
  "source_id": "mat_258",
  "gridfs_id": "656...",
  "page": 12,
  "chunk_text": "Detailed paragraph ...",
  "embedding": [0.00123, -0.2234, ...],
  "createdAt": "2025-11-02T21:00:00Z"
}
```

#### 7. **roadmap_sessions** (MASTER DOCUMENT)
```javascript
{
  "_id": "roadmap_001",
  "user_id": "user_123",
  "createdAt": "2025-11-13T13:00:00Z",
  "updatedAt": "2025-11-13T13:12:00Z",
  "status": "active",
  
  // Interview Agent
  "interview": {
    "answers": [
      { "q": "What is your background?", "a": "Beginner in ML", "time": "2025-11-13T13:01:00Z" },
      { "q": "How much time per week?", "a": "8 hours" }
    ],
    "skill_self_report": {
      "math": "low",
      "python": "medium",
      "ai_knowledge": "low"
    }
  },
  
  // Skill Evaluator Agent
  "skill_evaluation": {
    "baseline_quiz_id": "quiz_987",
    "score": 0.52,
    "skill_breakdown": {
      "linear_algebra": 0.4,
      "probability": 0.5,
      "python": 0.7
    },
    "evidence_chunk_ids": ["chunk_112", "chunk_113"]
  },
  
  // Concept Gap Detector Agent
  "concept_gaps": [
    {
      "concept": "matrix calculus",
      "severity": "high",
      "explanation": "Required for optimization algorithms",
      "remediation_materials": [
        { "material_id": "mat_402", "page_start": 10, "page_end": 14 },
        { "book_id": "pdf_052", "chapter": 2 }
      ]
    }
  ],
  
  // Prerequisite Graph Engine
  "prerequisite_graph": {
    "nodes": [
      { "id": "n1", "name": "Vectors", "estimated_hours": 2 },
      { "id": "n2", "name": "Matrices", "estimated_hours": 3 }
    ],
    "edges": [
      { "from": "n1", "to": "n2" }
    ]
  },
  
  // Document Quality Ranker Agent
  "ranked_materials": {
    "slides": [
      { "material_id": "mat_258", "score": 0.93 },
      { "material_id": "mat_300", "score": 0.89 }
    ],
    "books": [
      { "book_id": "pdf_001", "chapter": 3, "score": 0.91 }
    ],
    "videos": [
      { "video_id": "vid_004", "score": 0.88 }
    ]
  },
  
  // Difficulty Estimator
  "difficulty_scores": [
    { "chunk_id": "chunk_001", "difficulty": 0.3 },
    { "chunk_id": "chunk_002", "difficulty": 0.8 }
  ],
  
  // Roadmap Builder Agent (4 Phases)
  "phases": {
    "phase_1": {
      "name": "Foundation",
      "duration_weeks": 2,
      
      "pes_materials": [
        {
          "material_id": "mat_258",
          "title": "ML U1 Linear Regression",
          "file_url": "/api/files/stream/mat_258",
          "gridfs_id": "656f92...",
          "order": 1
        }
      ],
      
      "book_chapters": [
        {
          "book_id": "pdf_001",
          "chapter": 1,
          "title": "Introduction to Linear Algebra",
          "pages": "1-22",
          "file_url": "/api/books/stream/pdf_001"
        }
      ],
      
      "playlists": [
        {
          "playlist_id": "pl_010",
          "title": "Machine Learning Full Playlist",
          "videos": [
            { "video_id": "vid_101", "title": "ML Lecture 1", "url": "https://yt...." }
          ]
        }
      ],
      
      "one_shot_videos": [
        {
          "video_id": "vid_201",
          "title": "Linear Regression in 40 Minutes",
          "url": "https://yt..."
        }
      ],
      
      "quizzes": [
        { "quiz_id": "quiz_p1_a" },
        { "quiz_id": "quiz_p1_b" }
      ],
      
      "learning_objectives": [
        "Understand basic ML terminology",
        "Learn simple linear regression",
        "Plot & fit models in Python"
      ]
    },
    
    "phase_2": { "...": "same structure" },
    "phase_3": { "...": "same structure" },
    "phase_4": { "...": "same structure" }
  },
  
  // Project Generator Agent
  "projects": [
    {
      "project_id": "proj_01",
      "title": "Linear Regression from Scratch",
      "steps": [
        "Implement gradient descent",
        "Train on dataset",
        "Evaluate MSE"
      ],
      "rubric": { "completion": 0.8 }
    }
  ],
  
  // Time Planner Agent
  "schedule": [
    {
      "week": 1,
      "tasks": [
        { "phase": "phase_1", "material_id": "mat_258", "hours": 3 },
        { "phase": "phase_1", "video_id": "vid_201", "hours": 1 }
      ]
    }
  ],
  
  // Progress Tracker Agent
  "progress": {
    "phase_status": { "phase_1": "in_progress", "phase_2": "locked" },
    "percent_complete": 0.12,
    "last_activity": "2025-11-13T13:12:00Z"
  },
  
  // Meta / Agent Logs
  "meta": {
    "version": "roadmap_v3",
    "agent_logs": [
      { "agent": "InterviewAgent", "summary": "collected 5 answers" },
      { "agent": "SkillEvaluatorAgent", "summary": "baseline score: 52%" },
      { "agent": "RoadmapBuilderAgent", "summary": "created 4 phases" }
    ]
  }
}
```

## 🚀 Implementation Phases

### PHASE 1 — FOUNDATION SETUP (DB + Storage + Collections)

#### Step 1: Create MongoDB Collections & Indexes
```bash
# Core collections
db.semesters.createIndex({ semester_number: 1 })
db.subjects.createIndex({ semester_id: 1 })
db.materials.createIndex({ semester_id: 1, subject_id: 1, unit: 1 })
db.materials.createIndex({ tags: 1 })
db.materials.createIndex({ title: "text", topic: "text" })
db.reference_books.createIndex({ key_concepts: 1, difficulty: 1 })
db.reference_books.createIndex({ title: "text", author: "text", summary: "text" })
db.videos.createIndex({ topic_tags: 1 })
db.videos.createIndex({ playlist_id: 1 })
db.vector_chunks.createIndex({ source_collection: 1, source_id: 1 })
db.roadmap_sessions.createIndex({ user_id: 1, status: 1 })
```

#### Step 2: GridFS Setup
- Store all PDFs, slides, and documents in GridFS
- Each document gets a `gridfs_id` reference
- Stream files via `/api/files/stream/{gridfs_id}` endpoints

### PHASE 2 — FILE STORAGE & CHUNKING

#### Step 3: Upload Files to GridFS
```python
# Upload pipeline
gridfs_id = fs.put(file)
metadata['gridfs_id'] = gridfs_id
metadata['file_url'] = f"/api/materials/stream/{id}"
db.materials.insert_one(metadata)
```

#### Step 4: Chunk PDFs for Vector Search
```python
# Chunking pipeline
extract_text_per_page()  # PyMuPDF
create_chunks(page_chunk_size=2, overlap=1)  # 400-600 tokens
compute_embeddings()  # sentence-transformers
store_in_vector_chunks()
push_to_chroma()
```

### PHASE 3 — VECTOR DB + SEARCH SYSTEM

#### Step 5: Configure Vector Search
- **3 Vector Collections**: studymaterials, books, videos
- **Embedding Strategy**: sentence-transformers (local) or OpenAI embeddings
- **Storage**: Chroma + MongoDB metadata

#### Step 6: Search Endpoints
```python
# /search/pdf?q=probability&semester=3&unit=U1
@app.get("/search/pdf")
def search_pdf(q: str, semester: str = None, subject: str = None):
    # 1. Embed query
    q_emb = model.encode(q)
    
    # 2. Vector search in Chroma
    results = chroma.similarity_search(q_emb, collection="studymaterials")
    
    # 3. Filter by semester/subject/unit
    # 4. Return: title, snippet, file_url, tags, semester
```

### PHASE 4 — MULTI-AGENT LANGGRAPH SYSTEM

#### Step 7: Define LangGraph State
```python
class RoadmapState(BaseModel):
    query: str
    context: List[Document] = []
    intent: str = ""
    roadmap_data: dict = {}
    session_id: str
    user_id: str
```

#### Step 8: Core Agent Implementation

**15 Agents Total:**

1. **RoadmapAgent** (orchestrator)
2. **InterviewAgent** (collect user info)
3. **SkillEvaluatorAgent** (baseline quiz)
4. **ConceptGapDetectorAgent** (missing concepts)
5. **PrerequisiteGraphEngine** (dependency DAG)
6. **DifficultyEstimatorAgent** (content difficulty)
7. **DocumentQualityRankerAgent** (best content selection)
8. **RoadmapBuilderAgent** (4-phase roadmap)
9. **QuizGeneratorAgent** (MCQ generation)
10. **EvaluationAgent** (checkpoint assessments)
11. **ProjectGeneratorAgent** (capstone projects)
12. **TimePlannerAgent** (weekly schedule)
13. **ProgressTrackerAgent** (progress monitoring)
14. **ExplanationRefinerAgent** (content simplification)
15. **StudyPatternRecommenderAgent** (learning strategies)

### PHASE 5 — ROADMAP GENERATION PIPELINE

#### Step 9: End-to-End Roadmap Flow
```
User Request: "Create ML roadmap"
    ↓
RoadmapAgent → create session
    ↓
InterviewAgent → ask 5 questions
    ↓
SkillEvaluatorAgent → baseline quiz
    ↓
ConceptGapDetectorAgent → missing concepts
    ↓
PrerequisiteGraphEngine → dependency DAG
    ↓
DocumentQualityRankerAgent → select best content
    ↓
DifficultyEstimatorAgent → rank difficulty
    ↓
RoadmapBuilderAgent → build 4 phases
    ↓
QuizGeneratorAgent → generate 15 MCQs per phase
    ↓
ProjectGeneratorAgent → create capstone projects
    ↓
TimePlannerAgent → weekly schedule
    ↓
ProgressTrackerAgent → track progress
    ↓
Return: Complete personalized roadmap
```

### PHASE 6 — API LAYER

#### Step 10: REST API Endpoints
```python
# Search endpoints
@app.get("/search/pdf")
@app.get("/search/books") 
@app.get("/search/videos")

# Roadmap endpoints
@app.post("/roadmap/start")
@app.post("/roadmap/answer")
@app.get("/roadmap/final")
@app.get("/roadmap/progress")

# File streaming
@app.get("/api/files/stream/{gridfs_id}")
@app.get("/api/materials/stream/{material_id}")
@app.get("/api/books/stream/{book_id}")
```

### PHASE 7 — INGESTION PIPELINE

#### Step 11: Automated Data Processing
```python
# ingest_materials.py
upload_pdf_to_gridfs()
insert_metadata()
chunk_and_embed()
push_to_chroma()

# ingest_books.py 
download_from_github()
upload_to_gridfs()
extract_metadata()
chunk_and_embed()

# ingest_videos.py
load_playlist_data()
fetch_transcripts()
embed_chunks()
```

## 🎯 Agent System Prompts

### 1. RoadmapAgent (Orchestrator)
```
You are RoadmapAgent — the orchestration controller. Your job: accept a /roadmap/start request and coordinate downstream agents to produce a complete roadmap document stored in roadmap_sessions.

Input: { session_id, user_id, session_context }

Steps:
1) Validate session_context
2) Call InterviewAgent → store interview answers
3) Call SkillEvaluatorAgent → attach skill_evaluation
4) Call PrerequisiteGraphEngine & ConceptGapDetectorAgent → produce missing_concepts
5) Call RoadmapBuilderAgent to build phases
6) Call TimePlannerAgent to convert phases into a schedule
7) Persist roadmap in roadmap_sessions and return status with change log

Output: JSON: { session_id, status, actions_log: [{agent, result_summary}], roadmap_version }

Constraints: Fail fast on validation errors. Use deterministic outputs for IDs. Temperature 0.0.
```

### 2. InterviewAgent
```
You are InterviewAgent. Ask 3-5 concise, targeted questions to collect goals, constraints, prior experience, and time availability. Use user's profile if available.

Input: { session_id, user_profile }
Output: { answers: [{q, a}], confidence_estimates, timestamp }

Rules: Questions must be diagnostic (prereqs, prior projects, time/week). Do not ask more than 5 questions. Save answers verbatim.
```

### 3. SkillEvaluatorAgent
```
You are SkillEvaluatorAgent. Given user answers and optionally run a short adaptive baseline quiz (3-8 MCQs).

Input: { session_id, user_profile, interview_answers }
Use RAG to select 6 context chunks for quiz generation.
Output: { baseline_quiz_id, score, per_skill_scores: {skill:score}, evidence_chunks:[content_chunk_ids] }

Constraints: Use deterministic scoring. Return numeric scores 0..1.
```

### 4. RoadmapBuilderAgent
```
You are RoadmapBuilderAgent. Input: { session_id, missing_concepts, prerequisite_dag, top_chunks_by_phase, user_context }.

Build 4 phases: Foundation, Core, Application, Projects. For each phase include:
- duration_weeks
- ordered_materials: [{chunk_id, gridfs_id, order, notes}]
- book_chapters: [{ref_id}]
- 2 quizzes: reference quiz IDs (created later)
- learning_objectives: 3-5 concise objectives

Output: { phases, rationale }

Rules: Keep phase progression coherent and aligned to prerequisites. Use DifficultyEstimator outputs to pace content.
```

## 🔧 Project Structure

```
Pipline/
├── README.md
├── requirements.txt
├── config/
│   ├── __init__.py
│   ├── settings.py
│   └── database.py
├── core/
│   ├── __init__.py
│   ├── embeddings.py
│   ├── vector_db.py
│   └── gridfs_handler.py
├── agents/
│   ├── __init__.py
│   ├── base_agent.py
│   ├── roadmap_agent.py
│   ├── interview_agent.py
│   ├── skill_evaluator_agent.py
│   ├── concept_gap_detector.py
│   ├── prerequisite_graph_engine.py
│   ├── difficulty_estimator.py
│   ├── document_quality_ranker.py
│   ├── roadmap_builder_agent.py
│   ├── quiz_generator_agent.py
│   ├── evaluation_agent.py
│   ├── project_generator_agent.py
│   ├── time_planner_agent.py
│   ├── progress_tracker_agent.py
│   ├── explanation_refiner.py
│   └── study_pattern_recommender.py
├── graph/
│   ├── __init__.py
│   ├── state.py
│   ├── nodes.py
│   └── workflow.py
├── models/
│   ├── __init__.py
│   ├── roadmap_session.py
│   ├── materials.py
│   ├── books.py
│   ├── videos.py
│   └── vector_chunks.py
├── api/
│   ├── __init__.py
│   ├── main.py
│   ├── search_routes.py
│   ├── roadmap_routes.py
│   └── file_routes.py
├── ingestion/
│   ├── __init__.py
│   ├── materials_ingester.py
│   ├── books_ingester.py
│   ├── videos_ingester.py
│   └── chunking_pipeline.py
├── utils/
│   ├── __init__.py
│   ├── pdf_processor.py
│   ├── text_chunker.py
│   └── validators.py
├── tests/
│   ├── __init__.py
│   ├── test_agents.py
│   ├── test_api.py
│   └── test_ingestion.py
└── data/
    ├── pes_slides/
    ├── reference_books/
    └── video_metadata/
```

## 🛠️ Technologies Used

- **Backend**: FastAPI
- **Database**: MongoDB + GridFS
- **Vector DB**: ChromaDB
- **Orchestration**: LangGraph
- **LLM**: Local Mistral 7B / Llama 3
- **Embeddings**: sentence-transformers
- **PDF Processing**: PyMuPDF
- **Web Framework**: FastAPI + Uvicorn

## 🚀 Getting Started

### Prerequisites
```bash
pip install fastapi uvicorn mongodb pymongo gridfs
pip install chromadb sentence-transformers
pip install langgraph langchain
pip install PyMuPDF pandas numpy
```

### Quick Start
```bash
# 1. Setup MongoDB
mongod --dbpath ./db

# 2. Install dependencies  
pip install -r requirements.txt

# 3. Run ingestion pipeline
python ingestion/materials_ingester.py
python ingestion/books_ingester.py
python ingestion/videos_ingester.py

# 4. Start API server
uvicorn api.main:app --reload

# 5. Test roadmap generation
curl -X POST "http://localhost:8000/roadmap/start" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_123", "query": "Create ML roadmap"}'
```

## 📊 Expected Outputs

### Roadmap Generation Result
```json
{
  "session_id": "roadmap_001",
  "status": "complete",
  "phases": {
    "phase_1": {
      "name": "Foundation",
      "duration_weeks": 2,
      "materials": [
        {
          "title": "ML Fundamentals - Unit 1",
          "file_url": "/api/materials/stream/mat_001",
          "type": "pes_slide"
        }
      ],
      "books": [
        {
          "title": "Introduction to Machine Learning",
          "chapter": 1,
          "file_url": "/api/books/stream/book_001"
        }
      ],
      "quizzes": ["quiz_001", "quiz_002"],
      "projects": []
    },
    "phase_2": { "...": "Core concepts" },
    "phase_3": { "...": "Applications" },
    "phase_4": { "...": "Projects" }
  },
  "schedule": [
    {
      "week": 1,
      "tasks": [
        { "material": "ML Fundamentals", "hours": 4 },
        { "quiz": "Foundation Quiz 1", "hours": 1 }
      ]
    }
  ],
  "estimated_completion": "2024-03-15"
}
```

## 🎯 Success Metrics

- **Roadmap Quality**: Coherent 4-phase progression
- **Content Relevance**: 90%+ relevant PES slides and books
- **Quiz Quality**: MCQs directly derived from content
- **API Performance**: <2s response time for search
- **User Experience**: Interactive and personalized

## 🔮 Future Enhancements

1. **Real-time Progress Tracking**
2. **Collaborative Study Rooms** 
3. **Advanced Analytics Dashboard**
4. **Mobile App Integration**
5. **Social Learning Features**
6. **AI Tutor Chat Interface**
7. **Spaced Repetition System**
8. **Gamification Elements**

---

*This implementation guide provides everything needed to build a production-ready multi-agent RAG system with personalized roadmap generation.*
