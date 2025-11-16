"""
Complete Multi-Agent RAG System with LangGraph
==============================================

This is the fully implemented multi-agent system with proper Ollama integration,
MongoDB schemas, and system prompts.
"""

from typing import Dict, List, Any, Optional, TypedDict, Annotated
from datetime import datetime, timedelta
import json
import logging
import uuid
import asyncio

from langgraph.graph import StateGraph, END, START
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

from core.ollama_service import ollama_service
from core.vector_db import VectorDBManager
from core.embeddings import EmbeddingManager
from core.metadata_builder import MetadataBuilder
from config.database import db_manager
from config.settings import Settings
from schemas.mongodb_collections import initialize_collections
from agents.system_prompts import SystemPrompts, PromptBuilder

logger = logging.getLogger(__name__)

# State definition for LangGraph
class RagState(TypedDict):
    """Complete state object for the multi-agent system"""
    # Core fields
    query: str
    user_id: str
    intent: str
    
    # Processing
    context_chunks: List[str]
    search_results: List[Dict[str, Any]]
    
    # Roadmap specific
    roadmap_session_id: Optional[str]
    interview_answers: List[Dict[str, str]]
    skill_evaluation: Dict[str, Any]
    concept_gaps: List[Dict[str, Any]]
    ranked_materials: Dict[str, List[Dict[str, Any]]]
    prerequisite_graph: Dict[str, Any]
    difficulty_scores: List[Dict[str, Any]]
    phases: Dict[str, Dict[str, Any]]
    quizzes: List[Dict[str, Any]]
    projects: List[Dict[str, Any]]
    schedule: Dict[str, Any]
    progress: Dict[str, Any]
    
    # Output
    response: str
    metadata: Dict[str, Any]

class MultiAgentRagSystem:
    """Complete multi-agent RAG system with LangGraph orchestration"""
    
    def __init__(self):
        self.vector_db = VectorDBManager()
        self.embedding_manager = EmbeddingManager()
        self.db = db_manager.get_database()
        
        # Initialize collections
        initialize_collections(self.db)
        
        # Initialize the graph
        self.graph = self._build_graph()
    
    def _build_graph(self):
        """Build the complete LangGraph workflow"""
        workflow = StateGraph(RagState)
        
        # Add all nodes
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
        
        # Roadmap subgraph - complete agent chain
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
    # CORE SEARCH AGENTS
    # ============================================================================
    
    async def query_router_node(self, state: RagState) -> RagState:
        """Route queries to appropriate agents"""
        query = state["query"].lower()
        
        # Use Ollama to determine intent
        intent_prompt = f"""Analyze this query and determine the user's intent: "{state['query']}"
        
        Return only one of these intents:
        - roadmap: For creating learning paths, study plans, or curriculum
        - book_search: For finding reference books or textbooks
        - video_search: For finding tutorial videos or lectures  
        - pdf_search: For finding course materials, PDFs, or documents
        
        Intent:"""
        
        try:
            intent_response = await ollama_service.generate_response(
                prompt=intent_prompt,
                system_prompt=SystemPrompts.QUERY_ROUTER
            )
            
            # Extract intent from response
            intent = intent_response.strip().lower()
            if intent in ["roadmap", "book_search", "video_search", "pdf_search"]:
                state["intent"] = intent
            else:
                # Fallback to keyword matching
                if any(keyword in query for keyword in ["roadmap", "learning path", "study plan"]):
                    state["intent"] = "roadmap"
                elif any(keyword in query for keyword in ["book", "reference", "textbook"]):
                    state["intent"] = "book_search"
                elif any(keyword in query for keyword in ["video", "tutorial", "lecture"]):
                    state["intent"] = "video_search"
                else:
                    state["intent"] = "pdf_search"
        
        except Exception as e:
            logger.error(f"Intent detection error: {e}")
            # Fallback to simple keyword matching
            if "roadmap" in query or "plan" in query:
                state["intent"] = "roadmap"
            elif "book" in query:
                state["intent"] = "book_search"
            elif "video" in query:
                state["intent"] = "video_search"
            else:
                state["intent"] = "pdf_search"
        
        logger.info(f"Query routed to: {state['intent']}")
        return state
    
    async def pdf_search_node(self, state: RagState) -> RagState:
        """Search PES materials and PDFs - returns standardized JSON format"""
        try:
            # Search in both pes_materials and reference_books with content_type filter
            search_results = []
            
            # Search PES materials  
            pes_results = self.vector_db.search_documents(
                collection_name="educational_content",
                query_text=state["query"],
                n_results=5
            )
            
            # Search reference books
            book_results = self.vector_db.search_documents(
                collection_name="educational_content", 
                query_text=state["query"],
                n_results=5
            )
            
            # Process PES materials
            if pes_results.get("documents"):
                for i, doc_text in enumerate(pes_results["documents"][0]):
                    metadata = pes_results["metadatas"][0][i] if pes_results.get("metadatas") else {}
                    source_id = metadata.get("source_id", "")
                    
                    # Filter for pes_material content_type
                    if metadata.get("content_type") == "pes_material":
                        material = self.db[Settings.MATERIALS_COLLECTION].find_one({"_id": source_id})
                        if material:
                            semantic_score = 1.0 - (pes_results["distances"][0][i] if pes_results.get("distances") else 0.0)
                            relevance_score = MetadataBuilder.calculate_relevance_score(
                                semantic_score=semantic_score,
                                pedagogical_score=0.8,  # PES materials are high quality
                                recency_score=0.5
                            )
                            
                            metadata_obj = MetadataBuilder.build_document_metadata(
                                mongo_doc=material,
                                semantic_score=semantic_score,
                                relevance_score=relevance_score,
                                snippet=doc_text[:200] + "..." if len(doc_text) > 200 else doc_text
                            )
                            search_results.append(metadata_obj)
            
            # Process reference books
            if book_results.get("documents"):
                for i, doc_text in enumerate(book_results["documents"][0]):
                    metadata = book_results["metadatas"][0][i] if book_results.get("metadatas") else {}
                    source_id = metadata.get("source_id", "")
                    
                    # Filter for reference_book content_type
                    if metadata.get("content_type") == "reference_book":
                        book = self.db[Settings.BOOKS_COLLECTION].find_one({"_id": source_id})
                        if book:
                            semantic_score = 1.0 - (book_results["distances"][0][i] if book_results.get("distances") else 0.0)
                            relevance_score = MetadataBuilder.calculate_relevance_score(
                                semantic_score=semantic_score,
                                pedagogical_score=0.9,  # Books are high quality
                                recency_score=0.3
                            )
                            
                            metadata_obj = MetadataBuilder.build_document_metadata(
                                mongo_doc=book,
                                semantic_score=semantic_score,
                                relevance_score=relevance_score,
                                snippet=doc_text[:200] + "..." if len(doc_text) > 200 else doc_text
                            )
                            search_results.append(metadata_obj)
            
            # Sort by relevance score and limit to top 10
            search_results.sort(key=lambda x: x["relevance_score"], reverse=True)
            search_results = search_results[:10]
            
            # Build standardized response envelope
            response = MetadataBuilder.build_search_response(
                results=search_results,
                query=state["query"],
                search_type="pdf_search",
                top_k=10
            )
            
            state["search_results"] = response["results"]
            state["context_chunks"] = [r["snippet"] for r in search_results[:5]]
            
        except Exception as e:
            logger.error(f"PDF search error: {e}")
            response = MetadataBuilder.build_search_response(
                results=[],
                query=state["query"],
                search_type="pdf_search",
                top_k=10
            )
            state["search_results"] = []
            state["context_chunks"] = []
        
        return state
    
    async def book_search_node(self, state: RagState) -> RagState:
        """Search reference books"""
        try:
            # Search in books collection
            results = self.vector_db.search_similar(
                collection_key="books",
                query=state["query"],
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
                        "score": result.get("score", 0),
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
            # Search in videos collection  
            results = self.vector_db.search_similar(
                collection_key="videos",
                query=state["query"],
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
                        "score": result.get("score", 0)
                    })
            
            state["search_results"] = search_results
            state["context_chunks"] = [r["title"] for r in search_results[:5]]
            
        except Exception as e:
            logger.error(f"Video search error: {e}")
            state["search_results"] = []
            state["context_chunks"] = []
        
        return state
    
    # ============================================================================
    # ROADMAP GENERATION AGENTS
    # ============================================================================
    
    async def roadmap_entry_node(self, state: RagState) -> RagState:
        """Entry point for roadmap generation"""
        # Create new roadmap session
        session_id = f"roadmap_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        session_data = {
            "_id": session_id,
            "user_id": state["user_id"],
            "createdAt": datetime.now(),
            "status": "in_progress",
            "session_type": "full_roadmap",
            "query": state["query"],
            "interview": {
                "questions": [],
                "answers": [],
                "completed": False
            }
        }
        
        try:
            self.db[Settings.ROADMAPS_COLLECTION].insert_one(session_data)
            state["roadmap_session_id"] = session_id
            logger.info(f"Created roadmap session: {session_id}")
        except Exception as e:
            logger.error(f"Failed to create roadmap session: {e}")
            
        return state
    
    async def interview_agent_node(self, state: RagState) -> RagState:
        """Conduct interview to assess user needs"""
        try:
            # Get session data
            session = self.db[Settings.ROADMAPS_COLLECTION].find_one({"_id": state["roadmap_session_id"]})
            if not session:
                state["response"] = "Session not found. Please start a new roadmap request."
                return state
            
            existing_answers = session.get("interview", {}).get("answers", [])
            
            if len(existing_answers) < 5:
                # Generate next question
                question_prompt = PromptBuilder.build_interview_prompt(
                    len(existing_answers) + 1,
                    existing_answers,
                    state["query"]
                )
                
                question = await ollama_service.generate_response(
                    prompt=question_prompt,
                    system_prompt=SystemPrompts.INTERVIEW_AGENT
                )
                
                state["response"] = question
                
                # Store question in session
                self.db[Settings.ROADMAPS_COLLECTION].update_one(
                    {"_id": state["roadmap_session_id"]},
                    {"$push": {"interview.questions": question}}
                )
            else:
                # Interview complete
                state["interview_answers"] = existing_answers
                # Mark interview as complete
                self.db[Settings.ROADMAPS_COLLECTION].update_one(
                    {"_id": state["roadmap_session_id"]},
                    {"$set": {"interview.completed": True}}
                )
                
        except Exception as e:
            logger.error(f"Interview agent error: {e}")
            state["response"] = "There was an error conducting the interview."
            
        return state
    
    async def skill_evaluator_node(self, state: RagState) -> RagState:
        """Evaluate user skills based on interview responses"""
        try:
            answers = state.get("interview_answers", [])
            if not answers:
                # Get answers from session if not in state
                session = self.db[Settings.ROADMAPS_COLLECTION].find_one({"_id": state["roadmap_session_id"]})
                answers = session.get("interview", {}).get("answers", []) if session else []
            
            evaluation_prompt = PromptBuilder.build_skill_evaluation_prompt(answers, state["query"])
            
            evaluation = await ollama_service.generate_structured_output(
                prompt=evaluation_prompt,
                system_prompt=SystemPrompts.SKILL_EVALUATOR,
                output_format={
                    "skill_breakdown": {},
                    "overall_level": "beginner",
                    "confidence_score": 0.5,
                    "learning_style": "mixed",
                    "time_availability": "medium",
                    "strengths": [],
                    "weaknesses": []
                }
            )
            
            state["skill_evaluation"] = evaluation
            
            # Update roadmap session
            self.db[Settings.ROADMAPS_COLLECTION].update_one(
                {"_id": state["roadmap_session_id"]},
                {"$set": {"skill_evaluation": evaluation}}
            )
            
        except Exception as e:
            logger.error(f"Skill evaluation error: {e}")
            state["skill_evaluation"] = {}
        
        return state
    
    async def concept_gap_detector_node(self, state: RagState) -> RagState:
        """Detect knowledge gaps and missing concepts"""
        try:
            skill_eval = state.get("skill_evaluation", {})
            gap_prompt = PromptBuilder.build_concept_gap_prompt(skill_eval, state["query"])
            
            gaps = await ollama_service.generate_structured_output(
                prompt=gap_prompt,
                system_prompt=SystemPrompts.CONCEPT_GAP_DETECTOR,
                output_format={
                    "concept_gaps": [
                        {
                            "concept": "example_concept",
                            "severity": "high",
                            "explanation": "Why this gap matters",
                            "estimated_learning_time": "10",
                            "prerequisites": []
                        }
                    ]
                }
            )
            
            state["concept_gaps"] = gaps.get("concept_gaps", [])
            
            # Update roadmap session
            self.db[Settings.ROADMAPS_COLLECTION].update_one(
                {"_id": state["roadmap_session_id"]},
                {"$set": {"concept_gaps": state["concept_gaps"]}}
            )
            
        except Exception as e:
            logger.error(f"Concept gap detection error: {e}")
            state["concept_gaps"] = []
        
        return state
    
    async def prerequisite_graph_engine_node(self, state: RagState) -> RagState:
        """Create prerequisite learning graph"""
        try:
            concept_gaps = state.get("concept_gaps", [])
            
            graph_prompt = f"""
            Based on these concept gaps: {json.dumps(concept_gaps)}
            
            Create a prerequisite learning graph with nodes and edges:
            {{
                "nodes": [
                    {{"id": "node1", "concept": "basic_concept", "estimated_hours": 5}},
                    {{"id": "node2", "concept": "advanced_concept", "estimated_hours": 8}}
                ],
                "edges": [
                    {{"from": "node1", "to": "node2", "relationship": "prerequisite"}}
                ]
            }}
            """
            
            graph = await ollama_service.generate_structured_output(
                prompt=graph_prompt,
                system_prompt=SystemPrompts.PREREQUISITE_GRAPH_ENGINE,
                output_format={"nodes": [], "edges": []}
            )
            
            state["prerequisite_graph"] = graph
            
            # Update roadmap session
            self.db[Settings.ROADMAPS_COLLECTION].update_one(
                {"_id": state["roadmap_session_id"]},
                {"$set": {"prerequisite_graph": graph}}
            )
            
        except Exception as e:
            logger.error(f"Prerequisite graph generation error: {e}")
            state["prerequisite_graph"] = {"nodes": [], "edges": []}
        
        return state
    
    async def document_quality_ranker_node(self, state: RagState) -> RagState:
        """Rank educational materials by quality and relevance"""
        try:
            query = state["query"]
            
            # Search for relevant materials across all collections
            material_results = self.vector_db.search_similar(
                collection_key="materials",
                query=query,
                n_results=20
            )
            
            book_results = self.vector_db.search_similar(
                collection_key="books", 
                query=query,
                n_results=20
            )
            
            video_results = self.vector_db.search_similar(
                collection_key="videos",
                query=query,
                n_results=20
            )
            
            # Rank materials using LLM
            ranking_prompt = f"""
            Rank these educational materials for the learning goal: "{query}"
            
            Materials: {json.dumps(material_results[:10])}
            Books: {json.dumps(book_results[:10])}
            Videos: {json.dumps(video_results[:10])}
            
            Return ranked results with scores:
            """
            
            ranked = await ollama_service.generate_structured_output(
                prompt=ranking_prompt,
                system_prompt=SystemPrompts.DOCUMENT_QUALITY_RANKER,
                output_format={
                    "materials": [],
                    "books": [],
                    "videos": []
                }
            )
            
            state["ranked_materials"] = ranked
            
            # Update roadmap session
            self.db[Settings.ROADMAPS_COLLECTION].update_one(
                {"_id": state["roadmap_session_id"]},
                {"$set": {"ranked_materials": ranked}}
            )
            
        except Exception as e:
            logger.error(f"Document ranking error: {e}")
            state["ranked_materials"] = {"materials": [], "books": [], "videos": []}
        
        return state
    
    async def difficulty_estimator_node(self, state: RagState) -> RagState:
        """Estimate difficulty of materials for this learner"""
        try:
            skill_eval = state.get("skill_evaluation", {})
            ranked_materials = state.get("ranked_materials", {})
            
            difficulty_prompt = f"""
            User skill level: {json.dumps(skill_eval)}
            Materials: {json.dumps(ranked_materials)}
            
            Estimate difficulty scores (0.1-1.0) for each material relative to this learner:
            """
            
            difficulty = await ollama_service.generate_structured_output(
                prompt=difficulty_prompt,
                system_prompt=SystemPrompts.DIFFICULTY_ESTIMATOR,
                output_format={"difficulty_scores": []}
            )
            
            state["difficulty_scores"] = difficulty.get("difficulty_scores", [])
            
            # Update roadmap session
            self.db[Settings.ROADMAPS_COLLECTION].update_one(
                {"_id": state["roadmap_session_id"]},
                {"$set": {"difficulty_scores": state["difficulty_scores"]}}
            )
            
        except Exception as e:
            logger.error(f"Difficulty estimation error: {e}")
            state["difficulty_scores"] = []
        
        return state
    
    async def roadmap_builder_node(self, state: RagState) -> RagState:
        """Build comprehensive learning roadmap"""
        try:
            # Gather all context
            skill_eval = state.get("skill_evaluation", {})
            concept_gaps = state.get("concept_gaps", [])
            ranked_materials = state.get("ranked_materials", {})
            
            roadmap_prompt = f"""
            Create a 4-phase learning roadmap for: "{state['query']}"
            
            User skills: {json.dumps(skill_eval)}
            Knowledge gaps: {json.dumps(concept_gaps)}
            Available materials: {json.dumps(ranked_materials)}
            
            Create phases with materials, timeline, and objectives:
            """
            
            roadmap = await ollama_service.generate_structured_output(
                prompt=roadmap_prompt,
                system_prompt=SystemPrompts.ROADMAP_BUILDER,
                output_format={
                    "phases": [
                        {
                            "phase_number": 1,
                            "title": "Foundation",
                            "description": "Build basic understanding",
                            "estimated_duration": 20,
                            "concepts": [],
                            "materials": [],
                            "learning_objectives": []
                        }
                    ]
                }
            )
            
            state["phases"] = {f"phase_{p['phase_number']}": p for p in roadmap.get("phases", [])}
            
            # Update roadmap session
            self.db[Settings.ROADMAPS_COLLECTION].update_one(
                {"_id": state["roadmap_session_id"]},
                {"$set": {"roadmap": {"phases": list(state["phases"].values())}}}
            )
            
        except Exception as e:
            logger.error(f"Roadmap building error: {e}")
            state["phases"] = {}
        
        return state
    
    async def quiz_generator_node(self, state: RagState) -> RagState:
        """Generate quizzes for each phase"""
        try:
            phases = state.get("phases", {})
            context_chunks = state.get("context_chunks", [])
            
            quiz_prompt = f"""
            Generate quizzes for these learning phases using this content as reference:
            Phases: {json.dumps(phases)}
            Educational content: {json.dumps(context_chunks[:5])}
            
            Create 2 quizzes per phase with 5-10 questions each:
            """
            
            quizzes = await ollama_service.generate_structured_output(
                prompt=quiz_prompt,
                system_prompt=SystemPrompts.QUIZ_GENERATOR,
                output_format={"quizzes": []}
            )
            
            state["quizzes"] = quizzes.get("quizzes", [])
            
            # Store quizzes in database
            for quiz in state["quizzes"]:
                quiz["roadmap_session_id"] = state["roadmap_session_id"]
                quiz["_id"] = f"quiz_{uuid.uuid4().hex[:8]}"
                self.db[Settings.QUIZZES_COLLECTION].insert_one(quiz)
            
            # Update roadmap session with quiz references
            quiz_ids = [q["_id"] for q in state["quizzes"]]
            self.db[Settings.ROADMAPS_COLLECTION].update_one(
                {"_id": state["roadmap_session_id"]},
                {"$set": {"quiz_ids": quiz_ids}}
            )
            
        except Exception as e:
            logger.error(f"Quiz generation error: {e}")
            state["quizzes"] = []
        
        return state
    
    async def project_generator_node(self, state: RagState) -> RagState:
        """Generate hands-on projects"""
        try:
            phases = state.get("phases", {})
            skill_eval = state.get("skill_evaluation", {})
            
            project_prompt = f"""
            Create practical projects for these learning phases:
            Phases: {json.dumps(phases)}
            User skills: {json.dumps(skill_eval)}
            
            Generate 1-2 projects per phase that apply the concepts:
            """
            
            projects = await ollama_service.generate_structured_output(
                prompt=project_prompt,
                system_prompt=SystemPrompts.PROJECT_GENERATOR,
                output_format={
                    "projects": [
                        {
                            "project_id": "proj_1",
                            "title": "Project Title",
                            "phase": "phase_1",
                            "objectives": [],
                            "requirements": [],
                            "estimated_time": 10
                        }
                    ]
                }
            )
            
            state["projects"] = projects.get("projects", [])
            
            # Update roadmap session
            self.db[Settings.ROADMAPS_COLLECTION].update_one(
                {"_id": state["roadmap_session_id"]},
                {"$set": {"projects": state["projects"]}}
            )
            
        except Exception as e:
            logger.error(f"Project generation error: {e}")
            state["projects"] = []
        
        return state
    
    async def time_planner_node(self, state: RagState) -> RagState:
        """Create detailed time schedule"""
        try:
            phases = state.get("phases", {})
            skill_eval = state.get("skill_evaluation", {})
            time_availability = skill_eval.get("time_availability", "medium")
            
            # Map time availability to hours per week
            weekly_hours = {"low": 5, "medium": 10, "high": 20}.get(time_availability, 10)
            
            schedule_prompt = f"""
            Create a detailed learning schedule for these phases:
            Phases: {json.dumps(phases)}
            Available time: {weekly_hours} hours per week
            
            Break down into weekly goals and daily tasks:
            """
            
            schedule_response = await ollama_service.generate_structured_output(
                prompt=schedule_prompt,
                system_prompt=SystemPrompts.TIME_PLANNER,
                output_format={
                    "total_duration_weeks": 12,
                    "weekly_commitment_hours": weekly_hours,
                    "weekly_schedule": []
                }
            )
            
            state["schedule"] = schedule_response
            
            # Update roadmap session
            self.db[Settings.ROADMAPS_COLLECTION].update_one(
                {"_id": state["roadmap_session_id"]},
                {"$set": {"schedule": schedule_response}}
            )
            
        except Exception as e:
            logger.error(f"Time planning error: {e}")
            state["schedule"] = {"weekly_schedule": []}
        
        return state
    
    async def progress_tracker_node(self, state: RagState) -> RagState:
        """Initialize progress tracking"""
        try:
            phases = state.get("phases", {})
            
            progress = {
                "current_phase": 1,
                "completed_materials": [],
                "quiz_scores": [],
                "project_completions": [],
                "time_spent": 0,
                "completion_percentage": 0.0,
                "last_activity": datetime.now(),
                "milestones_achieved": []
            }
            
            state["progress"] = progress
            
            # Update roadmap session
            self.db[Settings.ROADMAPS_COLLECTION].update_one(
                {"_id": state["roadmap_session_id"]},
                {"$set": {
                    "progress": progress,
                    "status": "completed",
                    "updatedAt": datetime.now()
                }}
            )
            
        except Exception as e:
            logger.error(f"Progress tracking initialization error: {e}")
            state["progress"] = {}
        
        return state
    
    async def response_generator_node(self, state: RagState) -> RagState:
        """Generate final response to user"""
        try:
            intent = state.get("intent", "")
            
            if intent == "roadmap":
                # Generate comprehensive roadmap response
                roadmap_data = {
                    "phases": state.get("phases", {}),
                    "schedule": state.get("schedule", {}),
                    "projects": state.get("projects", []),
                    "quizzes": len(state.get("quizzes", [])),
                    "estimated_duration": state.get("schedule", {}).get("total_duration_weeks", 12)
                }
                
                response_prompt = PromptBuilder.build_roadmap_response_prompt(roadmap_data, state["query"])
                response = await ollama_service.generate_response(
                    prompt=response_prompt,
                    system_prompt=SystemPrompts.RESPONSE_GENERATOR
                )
                
            else:
                # Generate search response
                search_results = state.get("search_results", [])
                response_prompt = PromptBuilder.build_search_response_prompt(
                    state["query"], search_results, intent
                )
                response = await ollama_service.generate_response(
                    prompt=response_prompt,
                    system_prompt=SystemPrompts.RESPONSE_GENERATOR
                )
            
            state["response"] = response
            state["metadata"] = {
                "intent": intent,
                "results_count": len(state.get("search_results", [])),
                "session_id": state.get("roadmap_session_id"),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Response generation error: {e}")
            state["response"] = "I apologize, but I encountered an error generating your response."
        
        return state
    
    # ============================================================================
    # PUBLIC API METHODS
    # ============================================================================
    
    async def process_query(self, query: str, user_id: str = "anonymous") -> Dict[str, Any]:
        """Process a user query through the complete agent system"""
        try:
            # Create initial state
            initial_state = {
                "query": query,
                "user_id": user_id,
                "intent": "",
                "context_chunks": [],
                "search_results": [],
                "roadmap_session_id": None,
                "interview_answers": [],
                "skill_evaluation": {},
                "concept_gaps": [],
                "ranked_materials": {},
                "prerequisite_graph": {},
                "difficulty_scores": [],
                "phases": {},
                "quizzes": [],
                "projects": [],
                "schedule": {},
                "progress": {},
                "response": "",
                "metadata": {}
            }
            
            # Run through the graph
            result = await self.graph.ainvoke(initial_state)
            
            return {
                "response": result.get("response", ""),
                "intent": result.get("intent", ""),
                "metadata": result.get("metadata", {}),
                "session_id": result.get("roadmap_session_id"),
                "search_results": result.get("search_results", [])
            }
            
        except Exception as e:
            logger.error(f"Query processing error: {e}")
            return {
                "response": "I apologize, but I encountered an error processing your request.",
                "error": str(e)
            }
    
    async def continue_roadmap_interview(self, session_id: str, user_response: str) -> Dict[str, Any]:
        """Continue an ongoing roadmap interview"""
        try:
            # Get session
            session = self.db[Settings.ROADMAPS_COLLECTION].find_one({"_id": session_id})
            if not session:
                return {"response": "Session not found."}
            
            # Add user response to answers
            answer = {
                "question": session.get("interview", {}).get("questions", [])[-1],
                "answer": user_response,
                "timestamp": datetime.now()
            }
            
            self.db[Settings.ROADMAPS_COLLECTION].update_one(
                {"_id": session_id},
                {"$push": {"interview.answers": answer}}
            )
            
            # Continue with interview agent
            state = {
                "query": session.get("query", ""),
                "user_id": session.get("user_id", ""),
                "intent": "roadmap",
                "roadmap_session_id": session_id,
                "interview_answers": session.get("interview", {}).get("answers", []),
                "skill_evaluation": {},
                "concept_gaps": [],
                "ranked_materials": {},
                "prerequisite_graph": {},
                "difficulty_scores": [],
                "phases": {},
                "quizzes": [],
                "projects": [],
                "schedule": {},
                "progress": {},
                "response": "",
                "metadata": {},
                "context_chunks": [],
                "search_results": []
            }
            
            # Run interview agent
            result = await self.interview_agent_node(state)
            
            return {
                "response": result.get("response", ""),
                "session_id": session_id,
                "completed": len(result.get("interview_answers", [])) >= 5
            }
            
        except Exception as e:
            logger.error(f"Interview continuation error: {e}")
            return {"response": "Error continuing interview."}
    
    async def finalize_roadmap(self, session_id: str) -> Dict[str, Any]:
        """Complete roadmap generation for a session"""
        try:
            # Get session
            session = self.db[Settings.ROADMAPS_COLLECTION].find_one({"_id": session_id})
            if not session:
                return {"response": "Session not found."}
            
            # Create state from session
            state = {
                "query": session.get("query", ""),
                "user_id": session.get("user_id", ""),
                "intent": "roadmap",
                "roadmap_session_id": session_id,
                "interview_answers": session.get("interview", {}).get("answers", []),
                "skill_evaluation": {},
                "concept_gaps": [],
                "ranked_materials": {},
                "prerequisite_graph": {},
                "difficulty_scores": [],
                "phases": {},
                "quizzes": [],
                "projects": [],
                "schedule": {},
                "progress": {},
                "response": "",
                "metadata": {},
                "context_chunks": [],
                "search_results": []
            }
            
            # Run through the complete roadmap pipeline
            state = await self.skill_evaluator_node(state)
            state = await self.concept_gap_detector_node(state)
            state = await self.prerequisite_graph_engine_node(state)
            state = await self.document_quality_ranker_node(state)
            state = await self.difficulty_estimator_node(state)
            state = await self.roadmap_builder_node(state)
            state = await self.quiz_generator_node(state)
            state = await self.project_generator_node(state)
            state = await self.time_planner_node(state)
            state = await self.progress_tracker_node(state)
            state = await self.response_generator_node(state)
            
            return {
                "response": state.get("response", ""),
                "roadmap": {
                    "phases": state.get("phases", {}),
                    "schedule": state.get("schedule", {}),
                    "projects": state.get("projects", []),
                    "quiz_count": len(state.get("quizzes", []))
                },
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"Roadmap finalization error: {e}")
            return {"response": "Error finalizing roadmap."}

# Global instance
multi_agent_system = MultiAgentRagSystem()
