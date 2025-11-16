"""
LangGraph Multi-Agent System
============================

This module implements the complete multi-agent RAG system using LangGraph.
Includes all agents for roadmap generation, search, and educational content management.
"""

from typing import Dict, List, Any, Optional, TypedDict, Annotated
from datetime import datetime, timedelta
import json
import logging
import uuid

from langgraph.graph import StateGraph, END, START
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

from core.ollama_service import ollama_service
from core.vector_db import VectorDBManager
from core.embeddings import EmbeddingManager
from config.database import db_manager
from config.settings import Settings
from schemas.mongodb_collections import initialize_collections
from agents.system_prompts import SystemPrompts, PromptBuilder

logger = logging.getLogger(__name__)

# State definition for LangGraph
class RagState(TypedDict):
    """State object that flows through the agent graph"""
    # Input
    query: str
    user_id: str
    intent: str
    
    # Processing
    context_chunks: List[Dict[str, Any]]
    search_results: List[Dict[str, Any]]
    
    # Roadmap specific
    roadmap_session_id: Optional[str]
    interview_answers: List[Dict[str, str]]
    skill_evaluation: Dict[str, Any]
    concept_gaps: List[Dict[str, Any]]
    ranked_materials: Dict[str, List[Dict[str, Any]]]
    phases: Dict[str, Dict[str, Any]]
    prerequisite_graph: Dict[str, Any]
    difficulty_scores: List[Dict[str, Any]]
    quizzes: List[Dict[str, Any]]
    projects: List[Dict[str, Any]]
    schedule: List[Dict[str, Any]]
    progress: Dict[str, Any]
    
    # Output
    response: str
    metadata: Dict[str, Any]
    
    # Messages for conversation
    messages: Annotated[List[BaseMessage], add_messages]

class MultiAgentRagSystem:
    """Main orchestrator for the multi-agent RAG system"""
    
    def __init__(self):
        self.vector_db = VectorDBManager()
        self.embedding_manager = EmbeddingManager()
        self.db = db_manager.get_database()  # Fixed: use get_database method
        
        # Initialize collections
        initialize_collections(self.db)
        
        # Initialize the graph
        self.graph = self._build_graph()
    
    def _build_graph(self):
        """Build the complete LangGraph workflow"""
        
        # Create the graph
        workflow = StateGraph(RagState)
        
        # Add nodes
        workflow.add_node("query_router", self.query_router_node)
        workflow.add_node("pdf_search", self.pdf_search_node)
        workflow.add_node("book_search", self.book_search_node)
        workflow.add_node("video_search", self.video_search_node)
        workflow.add_node("roadmap_entry", self.roadmap_entry_node)
        workflow.add_node("interview_agent", self.interview_agent_node)
        workflow.add_node("skill_evaluator", self.skill_evaluator_node)
        workflow.add_node("concept_gap_detector", self.concept_gap_detector_node)
        workflow.add_node("prerequisite_graph_engine", self.prerequisite_graph_engine_node)
        workflow.add_node("document_quality_ranker", self.document_quality_ranker_node)
        workflow.add_node("difficulty_estimator", self.difficulty_estimator_node)
        workflow.add_node("roadmap_builder", self.roadmap_builder_node)
        workflow.add_node("quiz_generator", self.quiz_generator_node)
        workflow.add_node("project_generator", self.project_generator_node)
        workflow.add_node("time_planner", self.time_planner_node)
        workflow.add_node("progress_tracker", self.progress_tracker_node)
        workflow.add_node("response_generator", self.response_generator_node)
        
        # Set entry point
        workflow.set_entry_point("query_router")
        
        # Add conditional edges from query router
        workflow.add_conditional_edges(
            "query_router",
            self._route_query,
            {
                "pdf_search": "pdf_search",
                "book_search": "book_search", 
                "video_search": "video_search",
                "roadmap": "roadmap_entry"
            }
        )
        
        # Search paths lead to response
        workflow.add_edge("pdf_search", "response_generator")
        workflow.add_edge("book_search", "response_generator")
        workflow.add_edge("video_search", "response_generator")
        
        # Roadmap subgraph
        workflow.add_edge("roadmap_entry", "interview_agent")
        workflow.add_edge("interview_agent", "skill_evaluator")
        workflow.add_edge("skill_evaluator", "concept_gap_detector")
        workflow.add_edge("concept_gap_detector", "prerequisite_graph_engine")
        workflow.add_edge("prerequisite_graph_engine", "document_quality_ranker")
        workflow.add_edge("document_quality_ranker", "difficulty_estimator")
        workflow.add_edge("difficulty_estimator", "roadmap_builder")
        workflow.add_edge("roadmap_builder", "quiz_generator")
        workflow.add_edge("quiz_generator", "project_generator")
        workflow.add_edge("project_generator", "time_planner")
        workflow.add_edge("time_planner", "progress_tracker")
        workflow.add_edge("progress_tracker", "response_generator")
        
        # End
        workflow.add_edge("response_generator", END)
        
        return workflow.compile()
    
    def _route_query(self, state: RagState) -> str:
        """Route queries based on intent"""
        return state["intent"]
    
    # ============================================================================
    # CORE AGENTS
    # ============================================================================
    
    async def query_router_node(self, state: RagState) -> RagState:
        """Route queries to appropriate agents"""
        query = state["query"].lower()
        
        # Determine intent
        if any(keyword in query for keyword in ["roadmap", "learning path", "study plan", "curriculum"]):
            state["intent"] = "roadmap"
        elif any(keyword in query for keyword in ["book", "reference", "textbook"]):
            state["intent"] = "book_search"
        elif any(keyword in query for keyword in ["video", "tutorial", "lecture"]):
            state["intent"] = "video_search"
        else:
            state["intent"] = "pdf_search"
        
        logger.info(f"Query routed to: {state['intent']}")
        return state
    
    async def pdf_search_node(self, state: RagState) -> RagState:
        """Search PES materials and PDFs"""
        try:
            # Search in materials collection using the corrected method
            results = self.vector_db.search_similar(
                collection_key="materials",
                query=state["query"],
                n_results=10
            )
            
            # Fetch metadata from MongoDB
            search_results = []
            for result in results:
                material_id = result.get("id", "")
                if self.db:
                    material = self.db[Settings.MATERIALS_COLLECTION].find_one({"_id": material_id})
                    if material:
                        search_results.append({
                            "id": material_id,
                            "title": material.get("title", ""),
                            "file_url": material.get("file_url", ""),
                            "snippet": result.get("document", "")[:300],
                            "score": result.get("score", 0),
                            "metadata": material
                        })
            
            state["search_results"] = search_results
            state["context_chunks"] = [{"text": r["snippet"], "source": r["title"]} for r in search_results[:5]]
            
        except Exception as e:
            logger.error(f"PDF search error: {e}")
            state["search_results"] = []
            state["context_chunks"] = []
        
        return state
    
    async def book_search_node(self, state: RagState) -> RagState:
        """Search reference books"""
        try:
            # Generate embedding for query
            query_embedding = self.embedding_manager.encode_text(state["query"])
            
            # Search in books collection
            results = self.vector_db.search_similar(
                collection_key="books",
                query_vector=query_embedding,
                n_results=10
            )
            
            # Fetch metadata from MongoDB
            search_results = []
            for result in results:
                book_id = result.get("id", "")
                book = self.db[Settings.BOOKS_COLLECTION].find_one({"_id": book_id})
                if book:
                    search_results.append({
                        "id": book_id,
                        "title": book.get("title", ""),
                        "author": book.get("author", ""),
                        "summary": book.get("summary", ""),
                        "key_concepts": book.get("key_concepts", []),
                        "difficulty": book.get("difficulty", ""),
                        "score": result.get("distance", 0),
                        "file_url": book.get("file_url", "")
                    })
            
            state["search_results"] = search_results
            state["context_chunks"] = [r["summary"] for r in search_results[:5] if r.get("summary")]
            
        except Exception as e:
            logger.error(f"Book search error: {e}")
            state["search_results"] = []
            state["context_chunks"] = []
        
        return state
    
    async def video_search_node(self, state: RagState) -> RagState:
        """Search tutorial videos"""
        try:
            # Generate embedding for query
            query_embedding = self.embedding_manager.encode_text(state["query"])
            
            # Search in videos collection  
            results = self.vector_db.search_similar(
                collection_key="videos",
                query_vector=query_embedding,
                n_results=10
            )
            
            # Fetch metadata from MongoDB
            search_results = []
            for result in results:
                video_id = result.get("id", "")
                video = self.db[Settings.VIDEOS_COLLECTION].find_one({"_id": video_id})
                if video:
                    search_results.append({
                        "id": video_id,
                        "title": video.get("title", ""),
                        "video_url": video.get("video_url", ""),
                        "channel": video.get("channel", ""),
                        "duration": video.get("duration_seconds", 0),
                        "topic_tags": video.get("topic_tags", []),
                        "score": result.get("distance", 0)
                    })
            
            state["search_results"] = search_results
            state["context_chunks"] = [r["title"] for r in search_results[:5]]
            
        except Exception as e:
            logger.error(f"Video search error: {e}")
            state["search_results"] = []
            state["context_chunks"] = []
        
        return state
    
    # ============================================================================
    # ROADMAP AGENTS
    # ============================================================================
    
    async def roadmap_entry_node(self, state: RagState) -> RagState:
        """Entry point for roadmap generation"""
        # Create or retrieve roadmap session
        session_id = state.get("roadmap_session_id")
        if not session_id:
            session_data = {
                "_id": f"roadmap_{datetime.now().isoformat()}",
                "user_id": state["user_id"],
                "createdAt": datetime.now(),
                "status": "in_progress",
                "interview": {"answers": []},
                "query": state["query"]
            }
            self.db[Settings.ROADMAPS_COLLECTION].insert_one(session_data)
            session_id = session_data["_id"]
            state["roadmap_session_id"] = session_id
        
        return state
    
    async def interview_agent_node(self, state: RagState) -> RagState:
        """Conduct interview to assess user needs"""
        system_prompt = """You are an expert educational interviewer. Your job is to ask 3-5 strategic questions to understand:
1. User's current knowledge level
2. Learning goals and timeline  
3. Preferred learning style
4. Available time commitment
5. Specific subjects or skills of interest

Ask ONE question at a time. Be conversational and encouraging. Focus on gathering information that will help create a personalized learning roadmap."""
        
        # Check if this is continuation of existing interview
        session = self.db[Settings.ROADMAPS_COLLECTION].find_one({"_id": state["roadmap_session_id"]})
        existing_answers = session.get("interview", {}).get("answers", [])
        
        if len(existing_answers) < 5:
            # Generate next question based on previous answers
            context = f"Previous answers: {existing_answers}" if existing_answers else "This is the first question."
            
            prompt = f"""Based on the user's query: "{state['query']}" and {context}
            
Generate the next appropriate interview question to understand their learning needs better."""
            
            question = await ollama_service.generate_response(
                prompt=prompt,
                system_prompt=system_prompt
            )
            
            state["response"] = question
            
            # Store the question in session
            self.db[Settings.ROADMAPS_COLLECTION].update_one(
                {"_id": state["roadmap_session_id"]},
                {"$push": {"interview.questions": question}}
            )
        else:
            # Interview complete, move to next stage
            state["interview_answers"] = existing_answers
        
        return state
    
    async def skill_evaluator_node(self, state: RagState) -> RagState:
        """Evaluate user skills based on interview responses"""
        system_prompt = """You are an expert skill evaluator. Analyze the user's interview responses and create a comprehensive skill assessment.

Return your analysis in JSON format:
{
  "skill_breakdown": {
    "subject_name": 0.1-1.0,
    "another_subject": 0.1-1.0
  },
  "overall_level": "beginner|intermediate|advanced",
  "confidence_score": 0.1-1.0,
  "learning_style": "visual|auditory|kinesthetic|mixed",
  "time_availability": "low|medium|high"
}"""
        
        answers = state.get("interview_answers", [])
        prompt = f"Analyze these interview responses and provide skill evaluation: {json.dumps(answers)}"
        
        evaluation = await ollama_service.generate_structured_output(
            prompt=prompt,
            system_prompt=system_prompt,
            output_format={
                "skill_breakdown": {},
                "overall_level": "beginner",
                "confidence_score": 0.5,
                "learning_style": "mixed",
                "time_availability": "medium"
            }
        )
        
        state["skill_evaluation"] = evaluation
        
        # Update roadmap session
        self.db[Settings.ROADMAPS_COLLECTION].update_one(
            {"_id": state["roadmap_session_id"]},
            {"$set": {"skill_evaluation": evaluation}}
        )
        
        return state
    
    async def concept_gap_detector_node(self, state: RagState) -> RagState:
        """Detect knowledge gaps and missing concepts"""
        system_prompt = """You are a concept gap detection expert. Analyze the user's skill evaluation and learning goals to identify critical knowledge gaps.

Return gaps in JSON format:
{
  "concept_gaps": [
    {
      "concept": "linear_algebra",
      "severity": "high|medium|low", 
      "explanation": "Why this gap is important",
      "estimated_learning_time": "hours"
    }
  ]
}"""
        
        skill_eval = state.get("skill_evaluation", {})
        query = state.get("query", "")
        
        prompt = f"""
User's learning goal: {query}
Current skill assessment: {json.dumps(skill_eval)}

Identify the most critical knowledge gaps that need to be addressed."""
        
        gaps = await ollama_service.generate_structured_output(
            prompt=prompt,
            system_prompt=system_prompt,
            output_format={"concept_gaps": []}
        )
        
        state["concept_gaps"] = gaps.get("concept_gaps", [])
        
        # Update roadmap session
        self.db[Settings.ROADMAPS_COLLECTION].update_one(
            {"_id": state["roadmap_session_id"]},
            {"$set": {"concept_gaps": state["concept_gaps"]}}
        )
        
        return state
    
    async def prerequisite_graph_engine_node(self, state: RagState) -> RagState:
        """Build prerequisite dependency graph"""
        system_prompt = """You are a prerequisite graph builder. Create a learning dependency graph showing the optimal order for learning concepts.

Return in JSON format:
{
  "nodes": [
    {"id": "concept1", "name": "Linear Algebra", "estimated_hours": 20},
    {"id": "concept2", "name": "Probability", "estimated_hours": 15}
  ],
  "edges": [
    {"from": "concept1", "to": "concept2", "strength": "required|recommended|optional"}
  ]
}"""
        
        gaps = state.get("concept_gaps", [])
        query = state.get("query", "")
        
        prompt = f"""
Learning goal: {query}
Identified concept gaps: {json.dumps(gaps)}

Create a prerequisite graph showing the optimal learning order."""
        
        graph = await ollama_service.generate_structured_output(
            prompt=prompt,
            system_prompt=system_prompt,
            output_format={"nodes": [], "edges": []}
        )
        
        state["prerequisite_graph"] = graph
        
        # Update roadmap session
        self.db[Settings.ROADMAPS_COLLECTION].update_one(
            {"_id": state["roadmap_session_id"]},
            {"$set": {"prerequisite_graph": graph}}
        )
        
        return state
    
    async def document_quality_ranker_node(self, state: RagState) -> RagState:
        """Rank and filter materials by quality and relevance"""
        try:
            # Search for relevant materials, books, and videos
            query_embedding = self.embedding_manager.encode_text(state["query"])
            
            # Get materials
            material_results = self.vector_db.search_similar(
                collection_key="materials",
                query_vector=query_embedding,
                n_results=20
            )
            
            # Get books
            book_results = self.vector_db.search_similar(
                collection_key="books", 
                query_vector=query_embedding,
                n_results=20
            )
            
            # Get videos
            video_results = self.vector_db.search_similar(
                collection_key="videos",
                query_vector=query_embedding, 
                n_results=20
            )
            
            # Rank results using LLM
            system_prompt = """You are a document quality ranker. Rank materials based on:
1. Relevance to learning goals
2. Quality and comprehensiveness
3. Appropriate difficulty level
4. Educational value

Return JSON format:
{
  "ranked_materials": {
    "slides": [{"material_id": "id", "score": 0.95, "reason": "why ranked high"}],
    "books": [{"book_id": "id", "score": 0.90, "reason": "excellent coverage"}], 
    "videos": [{"video_id": "id", "score": 0.85, "reason": "clear explanations"}]
  }
}"""
            
            prompt = f"""
Learning goal: {state['query']}
Skill level: {state.get('skill_evaluation', {}).get('overall_level', 'intermediate')}

Material candidates: {json.dumps(material_results[:10])}
Book candidates: {json.dumps(book_results[:10])}
Video candidates: {json.dumps(video_results[:10])}

Rank these materials by quality and relevance."""
            
            ranked = await ollama_service.generate_structured_output(
                prompt=prompt,
                system_prompt=system_prompt,
                output_format={"ranked_materials": {"slides": [], "books": [], "videos": []}}
            )
            
            state["ranked_materials"] = ranked.get("ranked_materials", {})
            
            # Update roadmap session
            self.db[Settings.ROADMAPS_COLLECTION].update_one(
                {"_id": state["roadmap_session_id"]},
                {"$set": {"ranked_materials": state["ranked_materials"]}}
            )
            
        except Exception as e:
            logger.error(f"Error in document quality ranker: {e}")
            state["ranked_materials"] = {"slides": [], "books": [], "videos": []}
        
        return state
    
    async def difficulty_estimator_node(self, state: RagState) -> RagState:
        """Estimate difficulty of learning materials"""
        system_prompt = """You are a difficulty estimation expert. Analyze materials and assign difficulty scores from 0.1 (very easy) to 1.0 (very difficult).

Consider:
- Mathematical complexity
- Prerequisite knowledge required
- Conceptual abstraction level
- Technical depth

Return JSON format:
{
  "difficulty_scores": [
    {"item_id": "material_123", "difficulty": 0.7, "explanation": "requires calculus background"},
    {"item_id": "book_456", "difficulty": 0.4, "explanation": "introductory level"}
  ]
}"""
        
        materials = state.get("ranked_materials", {})
        user_level = state.get("skill_evaluation", {}).get("overall_level", "intermediate")
        
        prompt = f"""
User skill level: {user_level}
Materials to analyze: {json.dumps(materials)}

Estimate difficulty scores for these materials."""
        
        difficulty = await ollama_service.generate_structured_output(
            prompt=prompt,
            system_prompt=system_prompt,
            output_format={"difficulty_scores": []}
        )
        
        state["difficulty_scores"] = difficulty.get("difficulty_scores", [])
        
        # Update roadmap session
        self.db[Settings.ROADMAPS_COLLECTION].update_one(
            {"_id": state["roadmap_session_id"]},
            {"$set": {"difficulty_scores": state["difficulty_scores"]}}
        )
        
        return state
    
    async def roadmap_builder_node(self, state: RagState) -> RagState:
        """Build the 4-phase learning roadmap"""
        system_prompt = """You are an expert curriculum designer. Create a comprehensive 4-phase learning roadmap.

Each phase should include:
- Clear learning objectives
- Recommended materials (slides, books, videos)
- Estimated time commitment
- Prerequisites and outcomes

Return JSON format:
{
  "phases": {
    "phase_1": {
      "name": "Foundation",
      "duration_weeks": 2,
      "learning_objectives": ["objective 1", "objective 2"],
      "pes_materials": [{"material_id": "mat_123", "title": "Intro to ML", "order": 1}],
      "book_chapters": [{"book_id": "book_456", "chapter": 1, "title": "Chapter Title"}],
      "videos": [{"video_id": "vid_789", "title": "Video Title", "duration": 1800}],
      "assessments": ["quiz_id_1", "project_id_1"]
    },
    "phase_2": { ... },
    "phase_3": { ... },
    "phase_4": { ... }
  }
}"""
        
        # Gather all context
        ranked_materials = state.get("ranked_materials", {})
        concept_gaps = state.get("concept_gaps", [])
        prerequisite_graph = state.get("prerequisite_graph", {})
        skill_eval = state.get("skill_evaluation", {})
        
        prompt = f"""
Learning goal: {state['query']}
User skill level: {skill_eval.get('overall_level', 'intermediate')}
Available materials: {json.dumps(ranked_materials)}
Concept gaps to address: {json.dumps(concept_gaps)}
Learning dependencies: {json.dumps(prerequisite_graph)}

Create a comprehensive 4-phase learning roadmap that systematically builds knowledge."""
        
        roadmap = await ollama_service.generate_structured_output(
            prompt=prompt,
            system_prompt=system_prompt,
            output_format={"phases": {}}
        )
        
        state["phases"] = roadmap.get("phases", {})
        
        # Update roadmap session
        self.db[Settings.ROADMAPS_COLLECTION].update_one(
            {"_id": state["roadmap_session_id"]},
            {"$set": {"phases": state["phases"]}}
        )
        
        return state
    
    async def quiz_generator_node(self, state: RagState) -> RagState:
        """Generate quizzes for each phase"""
        system_prompt = """You are a quiz generation expert. Create educational quizzes with multiple-choice questions.

For each quiz, include:
- 10-15 questions
- 4 options per question (A, B, C, D)
- Correct answer
- Brief explanation
- Difficulty level

Return JSON format:
{
  "quizzes": [
    {
      "quiz_id": "quiz_phase1_1",
      "phase": "phase_1", 
      "title": "Foundation Quiz 1",
      "questions": [
        {
          "question": "What is machine learning?",
          "options": ["A) Option A", "B) Option B", "C) Option C", "D) Option D"],
          "correct_answer": "A",
          "explanation": "Brief explanation here",
          "difficulty": "easy"
        }
      ]
    }
  ]
}"""
        
        phases = state.get("phases", {})
        context_chunks = state.get("context_chunks", [])
        
        prompt = f"""
Learning phases: {json.dumps(phases)}
Educational content: {' '.join(context_chunks[:5])}

Generate appropriate quizzes for each learning phase."""
        
        quizzes = await ollama_service.generate_structured_output(
            prompt=prompt,
            system_prompt=system_prompt,
            output_format={"quizzes": []}
        )
        
        state["quizzes"] = quizzes.get("quizzes", [])
        
        # Store quizzes in database
        for quiz in state["quizzes"]:
            quiz["roadmap_session_id"] = state["roadmap_session_id"]
            quiz["created_at"] = datetime.now()
            self.db[Settings.QUIZZES_COLLECTION].insert_one(quiz)
        
        # Update roadmap session with quiz references
        quiz_refs = [{"quiz_id": q["quiz_id"], "phase": q["phase"]} for q in state["quizzes"]]
        self.db[Settings.ROADMAPS_COLLECTION].update_one(
            {"_id": state["roadmap_session_id"]},
            {"$set": {"quiz_references": quiz_refs}}
        )
        
        return state
    
    async def project_generator_node(self, state: RagState) -> RagState:
        """Generate practical projects for learning"""
        system_prompt = """You are a project design expert. Create hands-on projects that reinforce learning.

Each project should:
- Apply concepts from the learning phases
- Include clear requirements and steps
- Have measurable outcomes
- Be appropriate for the skill level

Return JSON format:
{
  "projects": [
    {
      "project_id": "proj_001",
      "title": "Build a Linear Regression Model",
      "phase": "phase_2",
      "description": "Implement linear regression from scratch",
      "requirements": ["Python basics", "NumPy knowledge"],
      "steps": ["Step 1: Set up environment", "Step 2: Load data"],
      "deliverables": ["Working code", "Analysis report"],
      "estimated_hours": 8
    }
  ]
}"""
        
        phases = state.get("phases", {})
        skill_level = state.get("skill_evaluation", {}).get("overall_level", "intermediate")
        
        prompt = f"""
Learning phases: {json.dumps(phases)}
User skill level: {skill_level}
Learning goal: {state['query']}

Design practical projects that reinforce the learning objectives."""
        
        projects = await ollama_service.generate_structured_output(
            prompt=prompt,
            system_prompt=system_prompt,
            output_format={"projects": []}
        )
        
        state["projects"] = projects.get("projects", [])
        
        # Update roadmap session
        self.db[Settings.ROADMAPS_COLLECTION].update_one(
            {"_id": state["roadmap_session_id"]},
            {"$set": {"projects": state["projects"]}}
        )
        
        return state
    
    async def time_planner_node(self, state: RagState) -> RagState:
        """Create detailed time schedule"""
        system_prompt = """You are a learning schedule optimizer. Create a realistic weekly schedule based on:
- User's available time
- Learning phases and materials
- Optimal pacing for retention

Return JSON format:
{
  "schedule": {
    "total_duration_weeks": 12,
    "weekly_commitment_hours": 8,
    "weeks": [
      {
        "week_number": 1,
        "phase": "phase_1",
        "tasks": [
          {"type": "material", "item_id": "mat_123", "estimated_hours": 3, "day": "Monday"},
          {"type": "quiz", "item_id": "quiz_1", "estimated_hours": 1, "day": "Wednesday"}
        ]
      }
    ]
  }
}"""
        
        phases = state.get("phases", {})
        time_availability = state.get("skill_evaluation", {}).get("time_availability", "medium")
        
        # Convert availability to hours
        time_mapping = {"low": 5, "medium": 10, "high": 20}
        weekly_hours = time_mapping.get(time_availability, 10)
        
        prompt = f"""
Learning phases: {json.dumps(phases)}
Available time per week: {weekly_hours} hours
Time availability level: {time_availability}

Create a realistic week-by-week learning schedule."""
        
        schedule = await ollama_service.generate_structured_output(
            prompt=prompt,
            system_prompt=system_prompt,
            output_format={"schedule": {}}
        )
        
        state["schedule"] = schedule.get("schedule", {})
        
        # Update roadmap session
        self.db[Settings.ROADMAPS_COLLECTION].update_one(
            {"_id": state["roadmap_session_id"]},
            {"$set": {"schedule": state["schedule"]}}
        )
        
        return state
    
    async def progress_tracker_node(self, state: RagState) -> RagState:
        """Initialize progress tracking"""
        progress_data = {
            "phase_status": {
                "phase_1": "not_started",
                "phase_2": "locked", 
                "phase_3": "locked",
                "phase_4": "locked"
            },
            "percent_complete": 0.0,
            "last_activity": datetime.now(),
            "completed_materials": [],
            "completed_quizzes": [],
            "completed_projects": []
        }
        
        state["progress"] = progress_data
        
        # Update roadmap session
        self.db[Settings.ROADMAPS_COLLECTION].update_one(
            {"_id": state["roadmap_session_id"]},
            {"$set": {
                "progress": progress_data,
                "status": "completed",
                "completed_at": datetime.now()
            }}
        )
        
        return state
    
    async def response_generator_node(self, state: RagState) -> RagState:
        """Generate final response based on processing"""
        intent = state.get("intent", "")
        
        if intent == "roadmap":
            # Generate roadmap summary
            phases = state.get("phases", {})
            schedule = state.get("schedule", {})
            
            response = f"""🎯 **Personalized Learning Roadmap Created!**

📚 **4-Phase Learning Plan:**
"""
            for phase_key, phase_data in phases.items():
                response += f"\n**{phase_data.get('name', phase_key)}** ({phase_data.get('duration_weeks', 2)} weeks)\n"
                response += f"• {len(phase_data.get('pes_materials', []))} study materials\n"
                response += f"• {len(phase_data.get('book_chapters', []))} book chapters\n"
                response += f"• {len(phase_data.get('videos', []))} video tutorials\n"
            
            total_weeks = schedule.get("total_duration_weeks", 12)
            weekly_hours = schedule.get("weekly_commitment_hours", 8)
            
            response += f"\n⏱️ **Schedule:** {total_weeks} weeks, {weekly_hours} hours/week\n"
            response += f"🎯 **Roadmap ID:** {state.get('roadmap_session_id', 'N/A')}\n"
            response += f"\n✅ Your personalized roadmap is ready! Access it anytime to track your progress."
            
        else:
            # Generate search results summary
            results = state.get("search_results", [])
            if results:
                response = f"🔍 **Found {len(results)} relevant results:**\n\n"
                for i, result in enumerate(results[:5], 1):
                    title = result.get("title", "Untitled")
                    score = result.get("score", 0)
                    response += f"{i}. **{title}** (relevance: {score:.2f})\n"
                    
                    if "author" in result:
                        response += f"   📖 Author: {result['author']}\n"
                    if "difficulty" in result:
                        response += f"   📊 Level: {result['difficulty']}\n"
                    if "snippet" in result:
                        snippet = result["snippet"][:150] + "..." if len(result["snippet"]) > 150 else result["snippet"]
                        response += f"   💭 {snippet}\n"
                    response += "\n"
            else:
                response = "❌ No relevant results found. Try refining your search query."
        
        state["response"] = response
        return state
    
    # ============================================================================
    # PUBLIC INTERFACE
    # ============================================================================
    
    async def process_query(self, query: str, user_id: str = "default_user") -> Dict[str, Any]:
        """Process a user query through the agent graph"""
        initial_state = RagState(
            query=query,
            user_id=user_id,
            intent="",
            context_chunks=[],
            search_results=[],
            roadmap_session_id=None,
            interview_answers=[],
            skill_evaluation={},
            concept_gaps=[],
            ranked_materials={},
            phases={},
            response="",
            metadata={},
            messages=[]
        )
        
        try:
            # Run the graph
            final_state = await self.graph.ainvoke(initial_state)
            
            return {
                "response": final_state["response"],
                "intent": final_state["intent"],
                "search_results": final_state.get("search_results", []),
                "roadmap_session_id": final_state.get("roadmap_session_id"),
                "metadata": final_state.get("metadata", {})
            }
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return {
                "response": f"Sorry, I encountered an error processing your request: {str(e)}",
                "intent": "error",
                "search_results": [],
                "roadmap_session_id": None,
                "metadata": {"error": str(e)}
            }
    
    async def continue_interview(self, session_id: str, answer: str) -> Dict[str, Any]:
        """Continue an interview session with user answer"""
        try:
            # Store the answer
            self.db[Settings.ROADMAPS_COLLECTION].update_one(
                {"_id": session_id},
                {"$push": {"interview.answers": {"answer": answer, "timestamp": datetime.now()}}}
            )
            
            # Get updated session
            session = self.db[Settings.ROADMAPS_COLLECTION].find_one({"_id": session_id})
            if not session:
                return {"error": "Session not found"}
            
            # Check if interview is complete (5 answers)
            answers = session.get("interview", {}).get("answers", [])
            if len(answers) >= 5:
                # Interview complete, continue with roadmap generation
                state = RagState(
                    query=session.get("query", ""),
                    user_id=session.get("user_id", ""),
                    intent="roadmap",
                    roadmap_session_id=session_id,
                    interview_answers=answers,
                    context_chunks=[],
                    search_results=[],
                    skill_evaluation={},
                    concept_gaps=[],
                    ranked_materials={},
                    phases={},
                    response="",
                    metadata={},
                    messages=[]
                )
                
                # Continue from skill evaluator
                final_state = await self.skill_evaluator_node(state)
                final_state = await self.concept_gap_detector_node(final_state)
                final_state = await self.prerequisite_graph_engine_node(final_state)
                final_state = await self.document_quality_ranker_node(final_state)
                final_state = await self.difficulty_estimator_node(final_state)
                final_state = await self.roadmap_builder_node(final_state)
                final_state = await self.quiz_generator_node(final_state)
                final_state = await self.project_generator_node(final_state)
                final_state = await self.time_planner_node(final_state)
                final_state = await self.progress_tracker_node(final_state)
                final_state = await self.response_generator_node(final_state)
                
                return {
                    "response": final_state["response"],
                    "session_complete": True,
                    "roadmap_generated": True
                }
            else:
                # Generate next question
                state = RagState(
                    query=session.get("query", ""),
                    user_id=session.get("user_id", ""),
                    intent="roadmap",
                    roadmap_session_id=session_id,
                    interview_answers=answers,
                    context_chunks=[],
                    search_results=[],
                    skill_evaluation={},
                    concept_gaps=[],
                    ranked_materials={},
                    phases={},
                    response="",
                    metadata={},
                    messages=[]
                )
                
                next_state = await self.interview_agent_node(state)
                return {
                    "response": next_state["response"],
                    "session_complete": False,
                    "question_number": len(answers) + 1
                }
                
        except Exception as e:
            logger.error(f"Error continuing interview: {e}")
            return {"error": str(e)}

# Global multi-agent system instance
multi_agent_system = MultiAgentRagSystem()
