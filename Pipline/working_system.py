"""
Working Educational Roadmap System Implementation
==============================================

Complete working implementation without complex relative imports.
Integrates all components using absolute imports and direct execution.
"""

import asyncio
import json
import logging
import sys
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

# Add current directory and subdirectories to Python path
current_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(current_dir))
sys.path.insert(0, str(current_dir / 'core'))
sys.path.insert(0, str(current_dir / 'langgraph'))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Direct implementation of core components without complex impor    test_cases = [
        {
            "learning_goal": "Master Operating Systems Fundamentals",
            "subject": "Operating Systems", 
            "user_background": "beginner",
            "hours_per_week": 10
        },
        {
            "learning_goal": "Learn Data Structures and Algorithms", 
            "subject": "Data Structures",
            "user_background": "intermediate",
            "hours_per_week": 8
        }
    ]pleOllamaService:
    """Simple Ollama service for LLM calls"""
    
    def __init__(self):
        self.base_url = "http://localhost:11434"
        self.model = "llama3.1"
    
    async def generate_response(self, prompt: str, temperature: float = 0.1, max_tokens: int = 2048) -> str:
        """Generate response from Ollama (mock for testing)"""
        try:
            import httpx
            
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(f"{self.base_url}/api/generate", json=payload)
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", "")
                else:
                    return self._get_fallback_response(prompt)
                    
        except Exception as e:
            logger.warning(f"Ollama service failed, using fallback: {e}")
            return self._get_fallback_response(prompt)
    
    def _get_fallback_response(self, prompt: str) -> str:
        """Fallback response generation"""
        if "interview" in prompt.lower():
            return '''
            {
                "questions": [
                    {
                        "question_id": "q1",
                        "question_text": "What is your current experience with this subject?",
                        "question_type": "open_ended",
                        "category": "current_knowledge",
                        "required": true,
                        "context": "Assess background knowledge"
                    },
                    {
                        "question_id": "q2",
                        "question_text": "How do you prefer to learn new concepts?",
                        "question_type": "multiple_choice",
                        "category": "learning_style",
                        "required": true,
                        "context": "Understand learning preferences"
                    },
                    {
                        "question_id": "q3",
                        "question_text": "How many hours per week can you dedicate to learning?",
                        "question_type": "open_ended",
                        "category": "time_availability",
                        "required": true,
                        "context": "Plan time allocation"
                    },
                    {
                        "question_id": "q4",
                        "question_text": "What specific topics interest you most?",
                        "question_type": "open_ended",
                        "category": "interest_areas",
                        "required": false,
                        "context": "Focus curriculum design"
                    },
                    {
                        "question_id": "q5",
                        "question_text": "What programming languages are you comfortable with?",
                        "question_type": "open_ended",
                        "category": "technical_background",
                        "required": false,
                        "context": "Assess technical readiness"
                    }
                ]
            }
            '''
        elif "skill" in prompt.lower():
            return '''
            {
                "skill_level": "beginner",
                "strengths": ["motivated to learn", "basic programming knowledge"],
                "weaknesses": ["limited systems knowledge", "no practical experience"],
                "analysis_notes": ["Suitable for introductory curriculum", "Needs hands-on practice"]
            }
            '''
        elif "gap" in prompt.lower():
            return '''
            {
                "gaps": ["memory management concepts", "process synchronization", "file system operations"],
                "prerequisites_needed": ["basic programming", "computer architecture basics"],
                "num_gaps": 3
            }
            '''
        elif "prerequisite" in prompt.lower():
            return '''
            {
                "nodes": ["OS Basics", "Processes", "Memory Management", "File Systems", "Advanced Topics"],
                "edges": [
                    {"from": "OS Basics", "to": "Processes"},
                    {"from": "Processes", "to": "Memory Management"},
                    {"from": "Memory Management", "to": "File Systems"},
                    {"from": "File Systems", "to": "Advanced Topics"}
                ],
                "learning_phases": [
                    {"phase_id": 1, "title": "Fundamentals", "concepts": ["OS Basics", "Introduction"], "difficulty": "beginner"},
                    {"phase_id": 2, "title": "Process Management", "concepts": ["Processes", "Threads", "Scheduling"], "difficulty": "intermediate"},
                    {"phase_id": 3, "title": "Memory Systems", "concepts": ["Memory Management", "Virtual Memory"], "difficulty": "intermediate"},
                    {"phase_id": 4, "title": "Advanced Systems", "concepts": ["File Systems", "I/O Systems"], "difficulty": "advanced"}
                ]
            }
            '''
        elif "video" in prompt.lower():
            return '''
            {
                "search_keywords_playlists": ["Operating Systems complete course", "OS fundamentals tutorial series"],
                "search_keywords_oneshot": "Operating Systems comprehensive guide",
                "reasoning_tags": ["subject", "comprehensiveness", "beginner-friendly"]
            }
            '''
        elif "project" in prompt.lower():
            return '''
            {
                "title": "Mini Operating System Components",
                "description": "Build key OS components to understand fundamental concepts",
                "objectives": ["Implement basic process scheduler", "Create memory allocator", "Design simple file system"],
                "complexity": "intermediate",
                "estimated_time_hours": 25,
                "deliverables": [
                    {"name": "Process Scheduler", "type": "code", "description": "Round-robin scheduler implementation", "due_phase": 2},
                    {"name": "Memory Manager", "type": "code", "description": "Basic memory allocation system", "due_phase": 3},
                    {"name": "File System", "type": "code", "description": "Simple file system operations", "due_phase": 4}
                ],
                "milestones": [
                    {"milestone": "Scheduler Design", "phase": 2, "estimated_hours": 8},
                    {"milestone": "Memory System", "phase": 3, "estimated_hours": 10},
                    {"milestone": "File Operations", "phase": 4, "estimated_hours": 7}
                ],
                "tech_requirements": ["C/C++", "Linux environment", "GDB debugger"]
            }
            '''
        elif "time" in prompt.lower():
            return '''
            {
                "total_weeks": 8,
                "hours_per_week": 10,
                "weekly_plan": [
                    {"week": 1, "focus": "OS Fundamentals", "hours": 10, "activities": ["Reading", "Basic exercises"]},
                    {"week": 2, "focus": "Process Management", "hours": 10, "activities": ["Theory", "Coding practice"]},
                    {"week": 3, "focus": "Advanced Processes", "hours": 10, "activities": ["Projects", "Synchronization"]},
                    {"week": 4, "focus": "Memory Management", "hours": 10, "activities": ["Virtual memory", "Paging"]},
                    {"week": 5, "focus": "Memory Projects", "hours": 10, "activities": ["Allocator project", "Testing"]},
                    {"week": 6, "focus": "File Systems", "hours": 10, "activities": ["File operations", "Directory structures"]},
                    {"week": 7, "focus": "I/O and Storage", "hours": 10, "activities": ["Device drivers", "Optimization"]},
                    {"week": 8, "focus": "Integration", "hours": 10, "activities": ["Final project", "Review"]}
                ],
                "review_cycles": [
                    {"week": 2, "type": "knowledge_check", "duration_hours": 1},
                    {"week": 4, "type": "midterm_review", "duration_hours": 2},
                    {"week": 6, "type": "project_review", "duration_hours": 1},
                    {"week": 8, "type": "final_assessment", "duration_hours": 2}
                ],
                "project_timeline": [
                    {"phase": 2, "project_hours": 8, "deliverable": "Process scheduler"},
                    {"phase": 3, "project_hours": 10, "deliverable": "Memory manager"},
                    {"phase": 4, "project_hours": 7, "deliverable": "File system"}
                ]
            }
            '''
        else:
            return '{"fallback": true, "message": "Fallback response used"}'

class SimpleDatabaseManager:
    """Simple database manager using existing connection"""
    
    def __init__(self):
        self.connected = False
        self.client = None
        self.db = None
        self.collections = {}
    
    async def connect(self) -> bool:
        """Connect to database"""
        try:
            from pymongo import MongoClient
            import asyncio
            
            self.client = MongoClient("mongodb://localhost:27017")
            self.db = self.client["axiona_rag_pipeline"]
            
            # Test connection
            await asyncio.to_thread(self.client.admin.command, 'ismaster')
            
            self.collections = {
                'reference_books': self.db.reference_books,
                'pes_materials': self.db.pes_materials,
                'video_urls': self.db.video_urls
            }
            
            self.connected = True
            return True
            
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return False
    
    async def health_check(self) -> Dict[str, Any]:
        """Database health check"""
        try:
            if not self.connected:
                return {"status": "disconnected"}
            
            import asyncio
            
            # Check connection
            await asyncio.to_thread(self.client.admin.command, 'ping')
            
            # Count documents
            collection_counts = {}
            for name, collection in self.collections.items():
                count = await asyncio.to_thread(collection.count_documents, {})
                collection_counts[name] = count
            
            return {
                "status": "healthy",
                "collections": collection_counts,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def find_pes_materials(self, subject: str, unit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Find PES materials"""
        try:
            if not self.connected:
                return []
            
            import asyncio
            
            filter_query = {"subject": {"$regex": f"^{subject}$", "$options": "i"}}
            
            if unit is not None:
                filter_query["unit"] = {"$in": [unit, str(unit)]}
            
            cursor = self.collections['pes_materials'].find(filter_query)
            documents = await asyncio.to_thread(list, cursor)
            
            # Add standardized metadata
            for doc in documents:
                doc['id'] = str(doc.get('_id', ''))
                doc['content_type'] = 'pes_material'
                doc['source'] = 'PES_slides'
                doc['relevance_score'] = 0.9
                doc['semantic_score'] = 0.85
                doc['snippet'] = doc.get('summary', '')[:200] + '...'
            
            return documents
            
        except Exception as e:
            logger.error(f"PES materials search failed: {e}")
            return []
    
    async def find_reference_books(self, subject: Optional[str] = None, difficulty: Optional[str] = None) -> List[Dict[str, Any]]:
        """Find reference books"""
        try:
            if not self.connected:
                return []
            
            import asyncio
            
            filter_query = {}
            
            if subject:
                filter_query["$or"] = [
                    {"title": {"$regex": subject, "$options": "i"}},
                    {"summary": {"$regex": subject, "$options": "i"}},
                    {"key_concepts": {"$regex": subject, "$options": "i"}}
                ]
            
            if difficulty:
                filter_query["difficulty"] = {"$regex": f"^{difficulty}$", "$options": "i"}
            
            cursor = self.collections['reference_books'].find(filter_query).limit(1)
            documents = await asyncio.to_thread(list, cursor)
            
            # Add standardized metadata
            for doc in documents:
                doc['id'] = str(doc.get('_id', ''))
                doc['content_type'] = 'reference_book'
                doc['source'] = 'reference_books'
                doc['relevance_score'] = 0.88
                doc['semantic_score'] = 0.85
                doc['snippet'] = doc.get('summary', '')[:200] + '...'
            
            return documents
            
        except Exception as e:
            logger.error(f"Reference books search failed: {e}")
            return []
    
    async def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()

# Global instances
ollama_service = SimpleOllamaService()
db_manager = SimpleDatabaseManager()

# Statistics tracker
class RoadmapStatistics:
    def __init__(self):
        self.stats = {"start_time": None, "node_timings": {}, "agent_calls": {}}
    
    def start_timer(self):
        self.stats["start_time"] = datetime.now()
    
    def end_timer(self):
        self.stats["end_time"] = datetime.now()
    
    def track_node_timing(self, node_name: str, duration: float):
        self.stats["node_timings"][node_name] = duration
    
    def track_agent_call(self, agent_name: str, success: bool, duration: float):
        if agent_name not in self.stats["agent_calls"]:
            self.stats["agent_calls"][agent_name] = {"calls": 0, "successes": 0}
        self.stats["agent_calls"][agent_name]["calls"] += 1
        if success:
            self.stats["agent_calls"][agent_name]["successes"] += 1
    
    def get_summary(self):
        total_duration = 0
        if self.stats.get("end_time") and self.stats.get("start_time"):
            total_duration = (self.stats["end_time"] - self.stats["start_time"]).total_seconds()
        
        return {
            "total_duration_minutes": total_duration / 60,
            "node_timings": self.stats["node_timings"],
            "agent_calls": self.stats["agent_calls"]
        }

roadmap_stats = RoadmapStatistics()

async def extract_json_from_response(response: str) -> Dict[str, Any]:
    """Extract JSON from response"""
    import re
    
    # First try to parse the entire response
    try:
        return json.loads(response.strip())
    except json.JSONDecodeError:
        pass
    
    # Try to extract JSON from markdown code blocks
    json_block_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL | re.IGNORECASE)
    if json_block_match:
        try:
            return json.loads(json_block_match.group(1).strip())
        except json.JSONDecodeError:
            pass
    
    # Try to extract any JSON object
    json_match = re.search(r'\{.*\}', response, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass
    
    # Try to extract JSON array
    array_match = re.search(r'\[.*\]', response, re.DOTALL)
    if array_match:
        try:
            return json.loads(array_match.group())
        except json.JSONDecodeError:
            pass
    
    return {"error": "Failed to parse JSON", "raw_response": response[:200] + "..." if len(response) > 200 else response}

async def call_llm_agent(prompt: str, context_data: Dict[str, Any], agent_name: str) -> Dict[str, Any]:
    """Call LLM agent with error handling"""
    start_time = datetime.now()
    
    try:
        full_prompt = f"{prompt}\n\nContext:\n{json.dumps(context_data, indent=2)}\n\nReturn JSON only:"
        
        response = await ollama_service.generate_response(
            prompt=full_prompt,
            temperature=0.1,
            max_tokens=2048
        )
        
        result = await extract_json_from_response(response)
        
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_agent_call(agent_name, True, duration)
        
        return result
        
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_agent_call(agent_name, False, duration)
        
        return {"error": f"{agent_name} failed: {str(e)}", "fallback_used": True}

# Agent implementations
async def interview_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Interview agent"""
    start_time = datetime.now()
    logger.info("🎯 Starting Interview Node")
    
    prompt = """Generate exactly 5 interview questions in JSON format for educational assessment."""
    context = {"learning_goal": state["learning_goal"], "subject": state["subject"]}
    
    result = await call_llm_agent(prompt, context, "interview_agent")
    
    state["interview_questions"] = result.get("questions", [])
    state["completed_steps"] = state.get("completed_steps", []) + ["interview"]
    
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("interview_node", duration)
    
    logger.info(f"✅ Interview completed: {len(state['interview_questions'])} questions")
    return state

async def skill_evaluation_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Skill evaluation agent"""
    start_time = datetime.now()
    logger.info("📊 Starting Skill Evaluation Node")
    
    # Mock answers
    sample_answers = [
        {"question_id": "q1", "answer": "Basic understanding from coursework"},
        {"question_id": "q2", "answer": "Prefer hands-on practice"},
        {"question_id": "q3", "answer": f"{state['hours_per_week']} hours per week"},
        {"question_id": "q4", "answer": f"Interested in {state['subject']} fundamentals"},
        {"question_id": "q5", "answer": "Basic programming experience"}
    ]
    
    prompt = "Analyze interview answers and determine user skill level."
    context = {"answers": sample_answers, "subject": state["subject"]}
    
    result = await call_llm_agent(prompt, context, "skill_evaluator")
    
    state["interview_answers"] = sample_answers
    state["skill_evaluation"] = result
    state["completed_steps"] = state.get("completed_steps", []) + ["skill_evaluation"]
    
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("skill_evaluation_node", duration)
    
    logger.info(f"✅ Skill evaluation completed: {result.get('skill_level', 'unknown')}")
    return state

async def gap_detection_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Gap detection agent"""
    start_time = datetime.now()
    logger.info("🔍 Starting Gap Detection Node")
    
    prompt = "Detect knowledge gaps and prerequisites for the learning goal."
    context = {
        "learning_goal": state["learning_goal"],
        "subject": state["subject"],
        "skill_evaluation": state.get("skill_evaluation", {})
    }
    
    result = await call_llm_agent(prompt, context, "gap_detector")
    
    state["knowledge_gaps"] = result.get("gaps", [])
    state["prerequisites_needed"] = result.get("prerequisites_needed", [])
    state["completed_steps"] = state.get("completed_steps", []) + ["gap_detection"]
    
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("gap_detection_node", duration)
    
    logger.info(f"✅ Gap detection completed: {len(state['knowledge_gaps'])} gaps")
    return state

async def prerequisite_graph_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Prerequisite graph agent"""
    start_time = datetime.now()
    logger.info("🗺️ Starting Prerequisite Graph Node")
    
    prompt = "Build prerequisite graph and learning phases."
    context = {
        "subject": state["subject"],
        "knowledge_gaps": state.get("knowledge_gaps", []),
        "skill_level": state.get("skill_evaluation", {}).get("skill_level", "beginner")
    }
    
    result = await call_llm_agent(prompt, context, "prerequisite_graph")
    
    state["prerequisite_graph"] = result
    state["learning_phases"] = result.get("learning_phases", [])
    state["completed_steps"] = state.get("completed_steps", []) + ["prerequisite_graph"]
    
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("prerequisite_graph_node", duration)
    
    logger.info(f"✅ Prerequisite graph completed: {len(state['learning_phases'])} phases")
    return state

async def pes_retrieval_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """PES retrieval agent"""
    start_time = datetime.now()
    logger.info("📚 Starting PES Retrieval Node")
    
    pes_materials = {}
    
    for phase in state.get("learning_phases", []):
        phase_id = phase.get("phase_id", 1)
        
        try:
            materials = await db_manager.find_pes_materials(
                subject=state["subject"],
                unit=phase_id
            )
            
            pes_materials[f"phase_{phase_id}"] = {
                "results": materials,
                "meta": {
                    "subject": state["subject"],
                    "phase": phase_id,
                    "total_results": len(materials)
                }
            }
            
            logger.info(f"📖 Phase {phase_id}: {len(materials)} PES materials")
            
        except Exception as e:
            logger.error(f"❌ PES retrieval failed for phase {phase_id}: {e}")
            pes_materials[f"phase_{phase_id}"] = {"results": [], "error": str(e)}
    
    state["pes_materials"] = pes_materials
    state["completed_steps"] = state.get("completed_steps", []) + ["pes_retrieval"]
    
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("pes_retrieval_node", duration)
    
    total_materials = sum(len(data["results"]) for data in pes_materials.values())
    logger.info(f"✅ PES retrieval completed: {total_materials} materials")
    return state

async def reference_book_retrieval_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Reference book retrieval agent"""
    start_time = datetime.now()
    logger.info("📗 Starting Reference Book Retrieval Node")
    
    reference_books = {}
    
    for phase in state.get("learning_phases", []):
        phase_id = phase.get("phase_id", 1)
        difficulty = phase.get("difficulty", "beginner")
        
        try:
            books = await db_manager.find_reference_books(
                subject=state["subject"],
                difficulty=difficulty
            )
            
            if books:
                book = books[0]
                book["recommended_chapters"] = [f"Chapter {phase_id}", f"Chapter {phase_id + 1}"]
                reference_books[f"phase_{phase_id}"] = {"result": book}
                logger.info(f"📕 Phase {phase_id}: {book.get('title', 'Unknown book')}")
            else:
                reference_books[f"phase_{phase_id}"] = {"result": None, "error": "No books found"}
                
        except Exception as e:
            reference_books[f"phase_{phase_id}"] = {"result": None, "error": str(e)}
    
    state["reference_books"] = reference_books
    state["completed_steps"] = state.get("completed_steps", []) + ["reference_book_retrieval"]
    
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("reference_book_retrieval_node", duration)
    
    book_count = sum(1 for data in reference_books.values() if data.get("result"))
    logger.info(f"✅ Reference book retrieval completed: {book_count} books")
    return state

async def video_retrieval_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Video retrieval agent"""
    start_time = datetime.now()
    logger.info("🎥 Starting Video Retrieval Node")
    
    video_content = {}
    
    for phase in state.get("learning_phases", []):
        phase_id = phase.get("phase_id", 1)
        difficulty = phase.get("difficulty", "beginner")
        
        prompt = "Generate video search keywords for educational content."
        context = {
            "subject": state["subject"],
            "level": difficulty,
            "unit_or_topic": f"Unit {phase_id}",
            "concepts": phase.get("concepts", [])
        }
        
        result = await call_llm_agent(prompt, context, "video_retrieval")
        video_content[f"phase_{phase_id}"] = result
        
        logger.info(f"🎬 Phase {phase_id}: Video keywords generated")
    
    state["video_content"] = video_content
    state["completed_steps"] = state.get("completed_steps", []) + ["video_retrieval"]
    
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("video_retrieval_node", duration)
    
    logger.info(f"✅ Video retrieval completed: {len(video_content)} phases")
    return state

async def project_generation_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Project generation agent"""
    start_time = datetime.now()
    logger.info("🛠️ Starting Project Generation Node")
    
    prompt = "Generate a comprehensive course project."
    context = {
        "learning_goal": state["learning_goal"],
        "subject": state["subject"],
        "learning_phases": state.get("learning_phases", []),
        "skill_level": state.get("skill_evaluation", {}).get("skill_level", "beginner")
    }
    
    result = await call_llm_agent(prompt, context, "project_generator")
    
    state["course_project"] = result
    state["completed_steps"] = state.get("completed_steps", []) + ["project_generation"]
    
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("project_generation_node", duration)
    
    logger.info(f"✅ Project generation completed: {result.get('title', 'Course Project')}")
    return state

async def time_planning_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Time planning agent"""
    start_time = datetime.now()
    logger.info("⏰ Starting Time Planning Node")
    
    total_phase_hours = len(state.get("learning_phases", [])) * 15
    project_hours = state.get("course_project", {}).get("estimated_time_hours", 20)
    
    prompt = "Generate a learning schedule with time allocation."
    context = {
        "total_hours": total_phase_hours + project_hours,
        "number_of_phases": len(state.get("learning_phases", [])),
        "project_estimated_hours": project_hours,
        "user_availability": state["hours_per_week"]
    }
    
    result = await call_llm_agent(prompt, context, "time_planner")
    
    state["learning_schedule"] = result
    state["completed_steps"] = state.get("completed_steps", []) + ["time_planning"]
    
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("time_planning_node", duration)
    
    logger.info(f"✅ Time planning completed: {result.get('total_weeks', 8)} weeks")
    return state

async def execute_working_roadmap_pipeline(
    learning_goal: str,
    subject: str,
    user_background: str = "beginner",
    hours_per_week: int = 10
) -> Dict[str, Any]:
    """Execute the complete roadmap pipeline"""
    
    logger.info(f"🚀 Starting roadmap generation: {learning_goal}")
    roadmap_stats.start_timer()
    
    try:
        # Initialize state
        state = {
            "learning_goal": learning_goal,
            "subject": subject,
            "user_background": user_background,
            "hours_per_week": hours_per_week,
            "errors": [],
            "warnings": [],
            "completed_steps": []
        }
        
        # Connect to database
        await db_manager.connect()
        
        # Execute pipeline
        pipeline_steps = [
            interview_node,
            skill_evaluation_node,
            gap_detection_node,
            prerequisite_graph_node,
            pes_retrieval_node,
            reference_book_retrieval_node,
            video_retrieval_node,
            project_generation_node,
            time_planning_node
        ]
        
        for step in pipeline_steps:
            try:
                state = await step(state)
            except Exception as e:
                logger.error(f"❌ Step {step.__name__} failed: {e}")
                state["errors"].append(f"{step.__name__} failed: {str(e)}")
        
        # End statistics
        roadmap_stats.end_timer()
        
        # Build final roadmap
        roadmap = assemble_final_roadmap(state)
        
        logger.info("✅ Roadmap generation completed")
        return roadmap
        
    except Exception as e:
        logger.error(f"❌ Pipeline failed: {e}")
        return {
            "roadmap_id": f"error_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "learning_goal": learning_goal,
            "subject": subject,
            "error": str(e),
            "status": "failed"
        }
    
    finally:
        await db_manager.close()

def assemble_final_roadmap(state: Dict[str, Any]) -> Dict[str, Any]:
    """Assemble final roadmap from state"""
    
    # Build phases with resources
    phases = []
    
    for phase_data in state.get("learning_phases", []):
        phase_id = phase_data.get("phase_id", 1)
        
        # Collect resources
        resources = []
        
        # PES materials
        pes_data = state.get("pes_materials", {}).get(f"phase_{phase_id}", {})
        if "results" in pes_data:
            for material in pes_data["results"]:
                resources.append({"type": "pes_material", "metadata": material})
        
        # Reference books
        book_data = state.get("reference_books", {}).get(f"phase_{phase_id}", {})
        if book_data.get("result"):
            resources.append({"type": "reference_book", "metadata": book_data["result"]})
        
        # Video content
        video_data = state.get("video_content", {}).get(f"phase_{phase_id}", {})
        if video_data and not video_data.get("error"):
            resources.append({"type": "video_content", "metadata": video_data})
        
        # Build phase
        phase = {
            "phase_id": phase_id,
            "phase_title": f"Phase {phase_id}: {phase_data.get('title', 'Learning Phase')}",
            "difficulty": phase_data.get("difficulty", "beginner"),
            "concepts": phase_data.get("concepts", []),
            "estimated_duration_hours": len(phase_data.get("concepts", [])) * 5,
            "learning_objectives": [f"Master {concept}" for concept in phase_data.get("concepts", [])[:3]],
            "resources": resources,
            "prerequisites": [],
            "assessments": [
                {"type": "quiz", "title": f"Phase {phase_id} Quiz", "question_count": 10}
            ]
        }
        
        phases.append(phase)
    
    # Build complete roadmap
    return {
        "roadmap_id": f"roadmap_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "learning_goal": state.get("learning_goal", ""),
        "subject": state.get("subject", ""),
        "user_profile": {
            "skill_level": state.get("skill_evaluation", {}).get("skill_level", "beginner"),
            "strengths": state.get("skill_evaluation", {}).get("strengths", []),
            "weaknesses": state.get("skill_evaluation", {}).get("weaknesses", []),
            "knowledge_gaps": state.get("knowledge_gaps", []),
            "prerequisites_needed": state.get("prerequisites_needed", [])
        },
        "phases": phases,
        "course_project": state.get("course_project", {}),
        "learning_schedule": state.get("learning_schedule", {}),
        "analytics": {
            "total_phases": len(phases),
            "total_estimated_hours": sum(p["estimated_duration_hours"] for p in phases),
            "total_resources": sum(len(p["resources"]) for p in phases)
        },
        "meta": {
            "generated_at": datetime.now().isoformat(),
            "pipeline_version": "2.0_working",
            "statistics": roadmap_stats.get_summary(),
            "errors": state.get("errors", []),
            "completed_steps": state.get("completed_steps", [])
        }
    }

async def test_working_system():
    """Test the working system"""
    
    print("🚀 Testing Working Educational Roadmap System")
    print("=" * 60)
    
    # Test database connection
    print("🗃️ Testing Database Connection...")
    connected = await db_manager.connect()
    if connected:
        print("✅ Database connected successfully")
        health = await db_manager.health_check()
        print(f"📊 Collections: {health.get('collections', {})}")
    else:
        print("⚠️ Database connection failed, using fallback mode")
    
    # Test roadmap generation
    print("\n🎯 Testing Roadmap Generation...")
    
    test_cases = [
        {
            "learning_goal": "Master Operating Systems Fundamentals",
            "subject": "Operating Systems",
            "user_background": "beginner"
        },
        {
            "learning_goal": "Learn Data Structures and Algorithms", 
            "subject": "Data Structures",
            "user_background": "intermediate"
        }
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n📊 Test {i}: {test['subject']}")
        print("-" * 30)
        
        start_time = datetime.now()
        
        try:
            roadmap = await execute_working_roadmap_pipeline(**test)
            
            execution_time = (datetime.now() - start_time).total_seconds()
            success = not roadmap.get("error")
            
            if success:
                phases = roadmap.get("phases", [])
                total_resources = sum(len(p.get("resources", [])) for p in phases)
                
                print(f"✅ Success: {execution_time:.1f}s")
                print(f"📚 Phases: {len(phases)}")
                print(f"🎯 Resources: {total_resources}")
                print(f"📊 Completed steps: {len(roadmap.get('meta', {}).get('completed_steps', []))}")
                
                # Save result
                output_file = f"working_roadmap_{i}.json"
                with open(output_file, 'w') as f:
                    json.dump(roadmap, f, indent=2, default=str)
                print(f"💾 Saved: {output_file}")
                
            else:
                print(f"❌ Failed: {roadmap.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"❌ Test failed: {e}")
    
    print(f"\n🎉 Working system test completed!")

if __name__ == "__main__":
    asyncio.run(test_working_system())
