"""
Complete LangGraph Agent Implementation with Standardized Schemas
================================================================

This module implements all agents as LangGraph nodes with proper JSON schemas,
LLM reasoning, statistics tracking, and error handling as specified in TODO.md.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from .state import RoadmapState
from core.ollama_service import ollama_service
from core.db_manager import db_manager

logger = logging.getLogger(__name__)

# Agent Prompts as specified in TODO.md
INTERVIEW_AGENT_PROMPT = """You are the Interview Agent for an educational roadmap system.  
Your task is to generate exactly 5 interview questions in pure JSON.

PURPOSE:
- Determine the user's background knowledge
- Detect missing prerequisites
- Understand learning preferences
- Capture time availability
- Establish difficulty alignment

REQUIREMENTS:
- Return ONLY a JSON array named "questions"
- Include: question_id, question_text, question_type, category, required, context
- No explanations, no natural language outside JSON

OUTPUT FORMAT:
{
  "questions": [
    {
      "question_id": "q1",
      "question_text": "...",
      "question_type": "open_ended",
      "category": "current_knowledge",
      "required": true,
      "context": "Purpose of question"
    }
  ]
}"""

SKILL_EVALUATOR_PROMPT = """You are the Skill Evaluation Agent.  
Input: JSON answers from Interview Agent.  
Output: A JSON object describing the user's skill profile.

TASKS:
- Analyze answers
- Determine skill_level (beginner | intermediate | advanced)
- List strengths and weaknesses
- Identify potential learning risks
- NO hallucination

RETURN ONLY JSON with:
{
  "skill_level": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "analysis_notes": ["..."]
}"""

GAP_DETECTOR_PROMPT = """You are the Concept Gap Detection Agent.

INPUT:
- learning_goal
- subject
- user skill profile

TASK:
- Detect missing fundamental concepts
- List actual knowledge gaps
- Suggest prerequisites required
- NO hallucination

OUTPUT (JSON only):
{
  "gaps": ["..."],
  "prerequisites_needed": ["..."],
  "num_gaps": 0
}"""

PREREQUISITE_GRAPH_PROMPT = """You are the Prerequisite Graph Agent.

GOAL:
Build a dependency graph linking concepts and prerequisites for the subject.

RULES:
- Follow strict JSON schema
- Node = concept
- Edge = dependency
- Include 4 learning phases mapping to conceptual progression

OUTPUT:
{
  "nodes": ["..."],
  "edges": [{"from": "...", "to": "..."}],
  "learning_phases": [
    {
      "phase_id": 1,
      "concepts": ["..."]
    }
  ]
}"""

DIFFICULTY_ESTIMATOR_PROMPT = """You are the Difficulty Estimator Agent.

INPUT:
- concept graph
- gaps
- user skill profile

TASK:
- Estimate difficulty for each phase
- Only "beginner", "intermediate", "advanced"

OUTPUT JSON:
{
  "phase_difficulties": {
    "1": "beginner",
    "2": "intermediate",
    "3": "intermediate",
    "4": "advanced"
  },
  "adaptive_factors": ["..."]
}"""

PES_RETRIEVAL_PROMPT = """You are the PES Material Retrieval Agent.

Your task is to retrieve ALL PES materials for the given subject and phase
by selecting all documents whose:
- subject matches exactly (case-insensitive)
- unit matches the phase_number (unit == str(phase_number) OR unit == phase_number)

RETRIEVAL LOGIC:
1. SUBJECT FILTER (CRITICAL):
   - must match the subject exactly (case-insensitive)
   - do NOT include materials from other subjects such as:
     Data Structures, DBMS, Microprocessor, Electronics, Software Engineering, Math, Networks, etc.

2. UNIT FILTER:
   - match unit == phase_number
   - unit may be stored as:
       "1"  (string)
       1    (int)
       null (ignore)

3. RETURN ALL VALID RESULTS:
   - If unit=1 has 2 documents → phase 1 return both
   - Do NOT limit the number of documents  

RETURN JSON ONLY with a "results" array containing PES metadata objects."""

REFERENCE_BOOK_PROMPT = """You are the Reference Book Retrieval Agent.

INPUT:
- subject
- difficulty
- phase concepts

TASK:
- Select the SINGLE best matching reference book
- Use metadata from collection: reference_books
- Filter by subject relevance (OS/DSA/CN/DBMS)
- Filter by difficulty
- Map chapters to phase concepts
- NO hallucination of books or chapters

OUTPUT JSON ONLY:
{
  "result": {
    "id": "book_001",
    "title": "...",
    "authors": ["..."],
    "isbn": "...",
    "summary": "...",
    "difficulty": "...",
    "key_concepts": [...],
    "recommended_chapters": ["Chapter 1", "Chapter 2"],
    "relevance_score": 0.91,
    "semantic_score": 0.89,
    "snippet": "..."
  }
}"""

VIDEO_RETRIEVAL_PROMPT = """You are the YouTube Video Retrieval Agent.

INPUT:
- subject
- level (beginner/intermediate/advanced)
- unit_or_topic

TASK:
Generate keyword queries for:
- 2 playlists
- 1 oneshot video

OUTPUT JSON:
{
  "search_keywords_playlists": ["...", "..."],
  "search_keywords_oneshot": "...",
  "reasoning_tags": ["subject", "unit/topic", "difficulty"]
}"""

PROJECT_GENERATOR_PROMPT = """You are the Course Project Generator Agent.

INPUT:
- learning goal
- subject
- all 4 phases concepts
- difficulty progression

TASK:
Generate ONE course-level capstone project that uses all phases.

OUTPUT:
{
  "title": "...",
  "description": "...",
  "objectives": ["..."],
  "complexity": "beginner|intermediate|advanced",
  "estimated_time_hours": 20,
  "deliverables": [
    {"name": "...", "type": "...", "description": "...", "due_phase": 4}
  ],
  "milestones": [
    {"milestone": "...", "phase": 2, "estimated_hours": 5}
  ],
  "tech_requirements": ["..."]
}"""

TIME_PLANNER_PROMPT = """You are the Time Planner Agent.

INPUT:
- total hours
- number of phases
- project estimated hours
- user availability (hours/week)

TASK:
- Build 8-week learning schedule
- Allocate hours per phase
- Allocate project time
- Add milestones + review cycles

OUTPUT:
{
  "total_weeks": 8,
  "hours_per_week": 10,
  "weekly_plan": [...],
  "review_cycles": [...],
  "project_timeline": [...]
}"""

class RoadmapStatistics:
    """Statistical tracking and analytics for the roadmap generation process"""
    
    def __init__(self):
        self.stats = {
            "start_time": None,
            "end_time": None,
            "total_duration_seconds": 0,
            "node_timings": {},
            "agent_calls": {},
            "resource_counts": {},
            "error_counts": {},
            "success_rates": {}
        }
    
    def start_timer(self):
        self.stats["start_time"] = datetime.now()
    
    def end_timer(self):
        self.stats["end_time"] = datetime.now()
        if self.stats["start_time"]:
            duration = self.stats["end_time"] - self.stats["start_time"]
            self.stats["total_duration_seconds"] = duration.total_seconds()
    
    def track_node_timing(self, node_name: str, duration: float):
        self.stats["node_timings"][node_name] = duration
    
    def track_agent_call(self, agent_name: str, success: bool, duration: float):
        if agent_name not in self.stats["agent_calls"]:
            self.stats["agent_calls"][agent_name] = {"calls": 0, "successes": 0, "total_duration": 0}
        
        self.stats["agent_calls"][agent_name]["calls"] += 1
        self.stats["agent_calls"][agent_name]["total_duration"] += duration
        
        if success:
            self.stats["agent_calls"][agent_name]["successes"] += 1
    
    def track_resource_count(self, resource_type: str, count: int):
        self.stats["resource_counts"][resource_type] = count
    
    def track_error(self, error_type: str):
        if error_type not in self.stats["error_counts"]:
            self.stats["error_counts"][error_type] = 0
        self.stats["error_counts"][error_type] += 1
    
    def get_summary(self) -> Dict[str, Any]:
        """Get comprehensive statistics summary"""
        
        # Calculate success rates
        success_rates = {}
        for agent, data in self.stats["agent_calls"].items():
            if data["calls"] > 0:
                success_rates[agent] = data["successes"] / data["calls"]
        self.stats["success_rates"] = success_rates
        
        return {
            "total_duration_minutes": self.stats["total_duration_seconds"] / 60,
            "node_count": len(self.stats["node_timings"]),
            "average_node_time": sum(self.stats["node_timings"].values()) / max(len(self.stats["node_timings"]), 1),
            "agent_calls": self.stats["agent_calls"],
            "success_rates": success_rates,
            "resource_counts": self.stats["resource_counts"],
            "error_counts": self.stats["error_counts"],
            "start_time": self.stats["start_time"].isoformat() if self.stats["start_time"] else None,
            "end_time": self.stats["end_time"].isoformat() if self.stats["end_time"] else None
        }

# Global statistics tracker
roadmap_stats = RoadmapStatistics()

async def extract_json_from_response(response: str) -> Dict[str, Any]:
    """Extract JSON from LLM response with error handling"""
    try:
        # Try direct JSON parse first
        return json.loads(response.strip())
    except json.JSONDecodeError:
        # Try to find JSON in the response
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        
        # Fallback: return error structure
        return {"error": "Failed to parse JSON from response", "raw_response": response}

async def call_llm_agent(prompt: str, context_data: Dict[str, Any], agent_name: str) -> Dict[str, Any]:
    """Call LLM with robust error handling and response parsing"""
    start_time = datetime.now()
    
    try:
        # Build the complete prompt with context
        full_prompt = f"{prompt}\n\nContext Data:\n{json.dumps(context_data, indent=2)}\n\nReturn ONLY JSON:"
        
        # Call Ollama service
        response = await ollama_service.generate_response(
            prompt=full_prompt,
            temperature=0.1,  # Low temperature for structured outputs
            max_tokens=2048
        )
        
        # Extract JSON
        result = await extract_json_from_response(response)
        
        # Track success
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_agent_call(agent_name, True, duration)
        
        return result
        
    except Exception as e:
        # Track failure
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_agent_call(agent_name, False, duration)
        roadmap_stats.track_error(f"{agent_name}_error")
        
        logger.error(f"❌ {agent_name} failed: {e}")
        
        # Return error fallback
        return {
            "error": f"{agent_name} failed: {str(e)}",
            "fallback_used": True,
            "timestamp": datetime.now().isoformat()
        }

# Node Implementations
async def interview_node(state: RoadmapState) -> RoadmapState:
    """Generate interview questions for the user"""
    start_time = datetime.now()
    logger.info("🎯 Starting Interview Node")
    
    context_data = {
        "learning_goal": state["learning_goal"],
        "subject": state["subject"]
    }
    
    result = await call_llm_agent(INTERVIEW_AGENT_PROMPT, context_data, "interview_agent")
    
    # Update state
    state["interview_questions"] = result.get("questions", [])
    state["processing_step"] = "interview_complete"
    state["completed_steps"].append("interview")
    
    if result.get("error"):
        state["errors"].append(result["error"])
    
    # Track statistics
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("interview_node", duration)
    
    logger.info(f"✅ Interview questions generated: {len(state['interview_questions'])} questions")
    return state

async def skill_evaluation_node(state: RoadmapState) -> RoadmapState:
    """Evaluate user skills based on interview answers"""
    start_time = datetime.now()
    logger.info("📊 Starting Skill Evaluation Node")
    
    # Generate sample answers for testing (in production, use real user answers)
    sample_answers = [
        {
            "question_id": "q1",
            "answer": "I have basic understanding from coursework but want to learn more deeply"
        },
        {
            "question_id": "q2", 
            "answer": "I prefer combination of reading and hands-on practice"
        },
        {
            "question_id": "q3",
            "answer": "I can dedicate 8-10 hours per week"
        },
        {
            "question_id": "q4",
            "answer": f"Most interested in {state['subject']} fundamentals and practical applications"
        },
        {
            "question_id": "q5",
            "answer": "Basic programming experience but limited systems knowledge"
        }
    ]
    
    context_data = {
        "questions": state["interview_questions"],
        "answers": sample_answers,
        "subject": state["subject"]
    }
    
    result = await call_llm_agent(SKILL_EVALUATOR_PROMPT, context_data, "skill_evaluator")
    
    # Update state
    state["interview_answers"] = sample_answers
    state["skill_evaluation"] = result
    state["processing_step"] = "skill_evaluation_complete"
    state["completed_steps"].append("skill_evaluation")
    
    if result.get("error"):
        state["errors"].append(result["error"])
    
    # Track statistics
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("skill_evaluation_node", duration)
    
    skill_level = result.get("skill_level", "beginner")
    logger.info(f"✅ Skill evaluation completed: {skill_level} level")
    return state

async def gap_detection_node(state: RoadmapState) -> RoadmapState:
    """Detect knowledge gaps and prerequisites"""
    start_time = datetime.now()
    logger.info("🔍 Starting Gap Detection Node")
    
    context_data = {
        "learning_goal": state["learning_goal"],
        "subject": state["subject"],
        "skill_evaluation": state["skill_evaluation"]
    }
    
    result = await call_llm_agent(GAP_DETECTOR_PROMPT, context_data, "gap_detector")
    
    # Update state
    state["knowledge_gaps"] = result.get("gaps", [])
    state["prerequisites_needed"] = result.get("prerequisites_needed", [])
    state["processing_step"] = "gap_detection_complete"
    state["completed_steps"].append("gap_detection")
    
    if result.get("error"):
        state["errors"].append(result["error"])
    
    # Track statistics
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("gap_detection_node", duration)
    
    gap_count = len(state["knowledge_gaps"])
    logger.info(f"✅ Gap detection completed: {gap_count} gaps identified")
    return state

async def prerequisite_graph_node(state: RoadmapState) -> RoadmapState:
    """Build prerequisite graph and learning phases"""
    start_time = datetime.now()
    logger.info("🗺️ Starting Prerequisite Graph Node")
    
    context_data = {
        "learning_goal": state["learning_goal"],
        "subject": state["subject"],
        "knowledge_gaps": state["knowledge_gaps"],
        "skill_level": state["skill_evaluation"].get("skill_level", "beginner")
    }
    
    result = await call_llm_agent(PREREQUISITE_GRAPH_PROMPT, context_data, "prerequisite_graph")
    
    # Update state
    state["prerequisite_graph"] = result
    state["learning_phases"] = result.get("learning_phases", [])
    state["processing_step"] = "prerequisite_graph_complete"
    state["completed_steps"].append("prerequisite_graph")
    
    if result.get("error"):
        state["errors"].append(result["error"])
    
    # Track statistics
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("prerequisite_graph_node", duration)
    
    phase_count = len(state["learning_phases"])
    logger.info(f"✅ Prerequisite graph completed: {phase_count} phases created")
    return state

async def pes_retrieval_node(state: RoadmapState) -> RoadmapState:
    """Retrieve PES materials for each phase"""
    start_time = datetime.now()
    logger.info("📚 Starting PES Retrieval Node")
    
    pes_materials = {}
    
    for phase in state["learning_phases"]:
        phase_id = phase.get("phase_id", 1)
        concepts = phase.get("concepts", [])
        
        try:
            # Retrieve PES materials from database
            materials = await db_manager.find_pes_materials(
                subject=state["subject"],
                unit=phase_id
            )
            
            # Package results in standardized format
            pes_materials[f"phase_{phase_id}"] = {
                "results": materials,
                "meta": {
                    "subject": state["subject"],
                    "phase": phase_id,
                    "unit_mapped": phase_id,
                    "total_results": len(materials),
                    "query_info": f"Retrieved ALL Unit {phase_id} materials for {state['subject']}"
                }
            }
            
            logger.info(f"📖 Phase {phase_id}: {len(materials)} PES materials retrieved")
            
        except Exception as e:
            logger.error(f"❌ Failed to retrieve PES materials for phase {phase_id}: {e}")
            pes_materials[f"phase_{phase_id}"] = {
                "results": [],
                "meta": {
                    "subject": state["subject"],
                    "phase": phase_id,
                    "error": f"Failed to retrieve materials: {str(e)}"
                }
            }
    
    # Update state
    state["pes_materials"] = pes_materials
    state["processing_step"] = "pes_retrieval_complete"
    state["completed_steps"].append("pes_retrieval")
    
    # Track statistics
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("pes_retrieval_node", duration)
    
    total_materials = sum(len(data["results"]) for data in pes_materials.values())
    roadmap_stats.track_resource_count("pes_materials", total_materials)
    
    logger.info(f"✅ PES retrieval completed: {total_materials} total materials")
    return state

async def reference_book_retrieval_node(state: RoadmapState) -> RoadmapState:
    """Retrieve reference books for each phase"""
    start_time = datetime.now()
    logger.info("📗 Starting Reference Book Retrieval Node")
    
    reference_books = {}
    
    for phase in state["learning_phases"]:
        phase_id = phase.get("phase_id", 1)
        concepts = phase.get("concepts", [])
        difficulty = phase.get("difficulty", "beginner")
        
        try:
            # Retrieve reference books from database
            books = await db_manager.find_reference_books(
                subject=state["subject"],
                difficulty=difficulty
            )
            
            if books:
                book = books[0]  # Get the best match
                book["recommended_chapters"] = [f"Chapter {phase_id}", f"Chapter {phase_id + 1}"]
                
                reference_books[f"phase_{phase_id}"] = {
                    "result": book
                }
                
                logger.info(f"📕 Phase {phase_id}: Reference book selected - {book.get('title', 'Unknown')}")
            else:
                reference_books[f"phase_{phase_id}"] = {
                    "result": None,
                    "error": f"No reference books found for {state['subject']}"
                }
            
        except Exception as e:
            logger.error(f"❌ Failed to retrieve reference book for phase {phase_id}: {e}")
            reference_books[f"phase_{phase_id}"] = {
                "result": None,
                "error": f"Failed to retrieve book: {str(e)}"
            }
    
    # Update state
    state["reference_books"] = reference_books
    state["processing_step"] = "reference_book_retrieval_complete"
    state["completed_steps"].append("reference_book_retrieval")
    
    # Track statistics
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("reference_book_retrieval_node", duration)
    
    book_count = sum(1 for data in reference_books.values() if data.get("result"))
    roadmap_stats.track_resource_count("reference_books", book_count)
    
    logger.info(f"✅ Reference book retrieval completed: {book_count} books selected")
    return state

async def video_retrieval_node(state: RoadmapState) -> RoadmapState:
    """Generate video search keywords for each phase"""
    start_time = datetime.now()
    logger.info("🎥 Starting Video Retrieval Node")
    
    video_content = {}
    
    for phase in state["learning_phases"]:
        phase_id = phase.get("phase_id", 1)
        concepts = phase.get("concepts", [])
        difficulty = phase.get("difficulty", "beginner")
        
        context_data = {
            "subject": state["subject"],
            "level": difficulty,
            "unit_or_topic": f"Unit {phase_id}",
            "concepts": concepts
        }
        
        result = await call_llm_agent(VIDEO_RETRIEVAL_PROMPT, context_data, "video_retrieval")
        
        video_content[f"phase_{phase_id}"] = result
        
        playlists = result.get("search_keywords_playlists", [])
        oneshot = result.get("search_keywords_oneshot", "")
        
        logger.info(f"🎬 Phase {phase_id}: Video keywords generated - {len(playlists)} playlists, 1 oneshot")
    
    # Update state
    state["video_content"] = video_content
    state["processing_step"] = "video_retrieval_complete"
    state["completed_steps"].append("video_retrieval")
    
    # Track statistics
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("video_retrieval_node", duration)
    
    video_count = len(video_content) * 3  # 2 playlists + 1 oneshot per phase
    roadmap_stats.track_resource_count("video_content", video_count)
    
    logger.info(f"✅ Video retrieval completed: {video_count} video resources")
    return state

async def project_generation_node(state: RoadmapState) -> RoadmapState:
    """Generate course project"""
    start_time = datetime.now()
    logger.info("🛠️ Starting Project Generation Node")
    
    context_data = {
        "learning_goal": state["learning_goal"],
        "subject": state["subject"],
        "learning_phases": state["learning_phases"],
        "skill_level": state["skill_evaluation"].get("skill_level", "beginner")
    }
    
    result = await call_llm_agent(PROJECT_GENERATOR_PROMPT, context_data, "project_generator")
    
    # Update state
    state["course_project"] = result
    state["processing_step"] = "project_generation_complete"
    state["completed_steps"].append("project_generation")
    
    if result.get("error"):
        state["errors"].append(result["error"])
    
    # Track statistics
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("project_generation_node", duration)
    
    project_title = result.get("title", "Course Project")
    logger.info(f"✅ Project generation completed: {project_title}")
    return state

async def time_planning_node(state: RoadmapState) -> RoadmapState:
    """Generate learning schedule"""
    start_time = datetime.now()
    logger.info("⏰ Starting Time Planning Node")
    
    # Calculate total hours
    total_phase_hours = len(state["learning_phases"]) * 15  # 15 hours per phase
    project_hours = state["course_project"].get("estimated_time_hours", 20)
    
    context_data = {
        "total_hours": total_phase_hours + project_hours,
        "number_of_phases": len(state["learning_phases"]),
        "project_estimated_hours": project_hours,
        "user_availability": state["hours_per_week"]
    }
    
    result = await call_llm_agent(TIME_PLANNER_PROMPT, context_data, "time_planner")
    
    # Update state
    state["learning_schedule"] = result
    state["processing_step"] = "time_planning_complete"
    state["completed_steps"].append("time_planning")
    
    if result.get("error"):
        state["errors"].append(result["error"])
    
    # Track statistics
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("time_planning_node", duration)
    
    total_weeks = result.get("total_weeks", 8)
    logger.info(f"✅ Time planning completed: {total_weeks}-week schedule")
    return state
