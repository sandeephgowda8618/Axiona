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

# Direct implementation of core components without complex imports
class SimpleOllamaService:
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
                    }
                ]
            }
            '''
        elif "skill" in prompt.lower():
            return '''
            {
                "skill_level": "beginner",
                "strengths": ["motivated to learn"],
                "weaknesses": ["limited knowledge"],
                "analysis_notes": ["Suitable for introductory curriculum"]
            }
            '''
        elif "gap" in prompt.lower():
            return '''
            {
                "gaps": ["fundamental concepts"],
                "prerequisites_needed": ["basic programming"],
                "num_gaps": 1
            }
            '''
        elif "prerequisite" in prompt.lower():
            return '''
            {
                "nodes": ["Basics", "Advanced"],
                "edges": [{"from": "Basics", "to": "Advanced"}],
                "learning_phases": [
                    {
                        "phase_id": 1,
                        "title": "Fundamentals",
                        "concepts": ["Basics"],
                        "difficulty": "beginner"
                    }
                ]
            }
            '''
        elif "project" in prompt.lower():
            return '''
            {
                "title": "Course Project",
                "description": "A comprehensive project to apply learned concepts",
                "objectives": ["Apply theoretical knowledge", "Build practical skills"],
                "deliverables": {
                    "individual": [{"title": "Implementation", "description": "Build core functionality"}],
                    "group": [{"title": "Integration", "description": "Combine components"}]
                },
                "evaluation_criteria": ["Functionality", "Code Quality"],
                "resources": ["Documentation", "Examples"]
            }
            '''
        elif "time" in prompt.lower():
            return '''
            {
                "total_duration_weeks": 8,
                "weekly_schedule": [
                    {"week": 1, "phase": "Fundamentals", "hours": 10, "activities": ["Study basics"]}
                ],
                "milestones": [
                    {"week": 4, "milestone": "Mid-term assessment"}
                ]
            }
            '''
        return '{"message": "Default response"}'

class SimpleStatsTracker:
    """Simple statistics tracker"""
    
    def __init__(self):
        self.stats = {
            "agent_calls": [],
            "node_timings": [],
            "errors": [],
            "total_roadmaps": 0
        }
    
    def track_agent_call(self, agent_name: str, success: bool, duration: float):
        """Track agent call"""
        self.stats["agent_calls"].append({
            "agent": agent_name,
            "success": success,
            "duration": duration,
            "timestamp": datetime.now().isoformat()
        })
    
    def track_node_timing(self, node_name: str, duration: float):
        """Track node timing"""
        self.stats["node_timings"].append({
            "node": node_name,
            "duration": duration,
            "timestamp": datetime.now().isoformat()
        })
    
    def get_stats(self) -> Dict[str, Any]:
        """Get current statistics"""
        return self.stats.copy()

# Initialize global instances  
ollama_service = SimpleOllamaService()
roadmap_stats = SimpleStatsTracker()

# Use the same database manager as production/final tests
async def get_db_manager():
    """Get the real database manager used by production system"""
    from core.db_manager import db_manager
    return db_manager

async def extract_json_from_response(response: str) -> Dict[str, Any]:
    """Extract JSON from response"""
    import re
    
    # First try to parse the entire response
    try:
        parsed = json.loads(response.strip())
        # If it's a list, wrap it appropriately based on context
        if isinstance(parsed, list):
            return {"questions": parsed} if len(parsed) > 0 and isinstance(parsed[0], dict) and "question_id" in parsed[0] else {"items": parsed}
        return parsed
    except json.JSONDecodeError:
        pass
    
    # Try to extract JSON from markdown code blocks
    json_block_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL | re.IGNORECASE)
    if json_block_match:
        try:
            parsed = json.loads(json_block_match.group(1).strip())
            if isinstance(parsed, list):
                return {"questions": parsed} if len(parsed) > 0 and isinstance(parsed[0], dict) and "question_id" in parsed[0] else {"items": parsed}
            return parsed
        except json.JSONDecodeError:
            pass
    
    # Try to extract any JSON object
    json_match = re.search(r'\{.*\}', response, re.DOTALL)
    if json_match:
        try:
            parsed = json.loads(json_match.group())
            if isinstance(parsed, list):
                return {"questions": parsed} if len(parsed) > 0 and isinstance(parsed[0], dict) and "question_id" in parsed[0] else {"items": parsed}
            return parsed
        except json.JSONDecodeError:
            pass
    
    # Try to extract JSON array
    array_match = re.search(r'\[.*\]', response, re.DOTALL)
    if array_match:
        try:
            parsed = json.loads(array_match.group())
            return {"questions": parsed} if len(parsed) > 0 and isinstance(parsed[0], dict) and "question_id" in parsed[0] else {"items": parsed}
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
    
    prompt = "Generate exactly 5 interview questions in JSON format for educational assessment."
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
    
    prompt = """
    Build prerequisite graph and learning phases for the subject.
    Return JSON with nodes, edges, and learning_phases arrays.
    Each learning phase should have: phase_id, title, concepts, difficulty.
    """
    context = {
        "subject": state["subject"],
        "knowledge_gaps": state.get("knowledge_gaps", []),
        "skill_level": state.get("skill_evaluation", {}).get("skill_level", "beginner")
    }
    
    result = await call_llm_agent(prompt, context, "prerequisite_graph")
    
    # Debug: Log the raw result
    logger.info(f"🔍 Raw prerequisite graph result: {json.dumps(result, indent=2)}")
    
    state["prerequisite_graph"] = result
    state["learning_phases"] = result.get("learning_phases", [])
    state["completed_steps"] = state.get("completed_steps", []) + ["prerequisite_graph"]
    
    # Debug: Log what we extracted
    logger.info(f"🔍 Extracted learning_phases: {len(state['learning_phases'])}")
    if state['learning_phases']:
        logger.info(f"🔍 First phase: {state['learning_phases'][0]}")
    
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("prerequisite_graph_node", duration)
    
    logger.info(f"✅ Prerequisite graph completed: {len(state['learning_phases'])} phases")
    return state

async def pes_retrieval_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """PES retrieval agent"""
    start_time = datetime.now()
    logger.info("📚 Starting PES Retrieval Node")
    
    db_manager = await get_db_manager()
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
    
    db_manager = await get_db_manager()
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
            else:
                reference_books[f"phase_{phase_id}"] = {"result": None, "message": "No books found"}
                
        except Exception as e:
            logger.error(f"❌ Reference book retrieval failed for phase {phase_id}: {e}")
            reference_books[f"phase_{phase_id}"] = {"result": None, "error": str(e)}
    
    state["reference_books"] = reference_books
    state["completed_steps"] = state.get("completed_steps", []) + ["reference_book_retrieval"]
    
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("reference_book_retrieval_node", duration)
    
    total_books = sum(1 for data in reference_books.values() if data.get("result"))
    logger.info(f"✅ Reference book retrieval completed: {total_books} books")
    return state

async def video_retrieval_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Video retrieval agent"""
    start_time = datetime.now()
    logger.info("🎥 Starting Video Retrieval Node")
    
    video_results = {}
    
    for phase in state.get("learning_phases", []):
        phase_id = phase.get("phase_id", 1)
        
        # Mock video retrieval for now
        video_results[f"phase_{phase_id}"] = {
            "results": [],
            "meta": {"phase": phase_id, "total_results": 0}
        }
    
    state["video_materials"] = video_results
    state["completed_steps"] = state.get("completed_steps", []) + ["video_retrieval"]
    
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("video_retrieval_node", duration)
    
    total_videos = sum(len(data["results"]) for data in video_results.values())
    logger.info(f"✅ Video retrieval completed: {total_videos} phases")
    return state

async def project_generation_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Project generation agent"""
    start_time = datetime.now()
    logger.info("🛠️ Starting Project Generation Node")
    
    prompt = "Generate a comprehensive course project for the learning goal."
    context = {
        "learning_goal": state["learning_goal"],
        "subject": state["subject"],
        "phases": state.get("learning_phases", [])
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
    
    prompt = "Create a time-based learning schedule."
    context = {
        "phases": state.get("learning_phases", []),
        "user_availability": state["hours_per_week"]
    }
    
    result = await call_llm_agent(prompt, context, "time_planner")
    
    state["time_plan"] = result
    state["completed_steps"] = state.get("completed_steps", []) + ["time_planning"]
    
    duration = (datetime.now() - start_time).total_seconds()
    roadmap_stats.track_node_timing("time_planning_node", duration)
    
    total_weeks = result.get("total_duration_weeks", 8)
    logger.info(f"✅ Time planning completed: {total_weeks} weeks")
    return state

async def execute_working_roadmap_pipeline(
    learning_goal: str,
    subject: str, 
    user_background: str = "beginner",
    hours_per_week: int = 10
) -> Dict[str, Any]:
    """Execute complete roadmap pipeline"""
    
    # Initialize state
    state = {
        "roadmap_id": f"roadmap_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "learning_goal": learning_goal,
        "subject": subject,
        "user_background": user_background,
        "hours_per_week": hours_per_week,
        "completed_steps": []
    }
    
    logger.info(f"🚀 Starting roadmap generation: {learning_goal}")
    
    try:
        # Execute pipeline nodes in sequence
        state = await interview_node(state)
        state = await skill_evaluation_node(state)
        state = await gap_detection_node(state)
        state = await prerequisite_graph_node(state)
        state = await pes_retrieval_node(state)
        state = await reference_book_retrieval_node(state)
        state = await video_retrieval_node(state)
        state = await project_generation_node(state)
        state = await time_planning_node(state)
        
        # Assemble final roadmap
        roadmap = {
            "roadmap_id": state["roadmap_id"],
            "learning_goal": state["learning_goal"],
            "subject": state["subject"],
            "user_profile": {
                "skill_level": state.get("skill_evaluation", {}).get("skill_level", "unknown"),
                "strengths": state.get("skill_evaluation", {}).get("strengths", []),
                "weaknesses": state.get("skill_evaluation", {}).get("weaknesses", []),
                "knowledge_gaps": state.get("knowledge_gaps", []),
                "prerequisites_needed": state.get("prerequisites_needed", [])
            },
            "phases": state.get("learning_phases", []),
            "course_project": state.get("course_project", {}),
            "time_plan": state.get("time_plan", {}),
            "resources": {
                "pes_materials": state.get("pes_materials", {}),
                "reference_books": state.get("reference_books", {}),
                "video_materials": state.get("video_materials", {})
            },
            "meta": {
                "generated_at": datetime.now().isoformat(),
                "completed_steps": state["completed_steps"],
                "stats": roadmap_stats.get_stats()
            }
        }
        
        logger.info("✅ Roadmap generation completed")
        roadmap_stats.stats["total_roadmaps"] += 1
        
        return roadmap
        
    except Exception as e:
        logger.error(f"❌ Pipeline execution failed: {e}")
        return {"error": str(e), "partial_state": state}

async def test_working_system():
    """Test the working roadmap system"""
    
    print("🚀 Testing Working Educational Roadmap System")
    print("=" * 60)
    
    # Initialize database
    print("🗃️ Testing Database Connection...")
    db_manager = await get_db_manager()
    connected = await db_manager.connect()
    health = await db_manager.health_check()
    
    if health["status"] == "healthy":
        print("✅ Database connected successfully")
        print(f"📊 Collections: {health['collections']}")
    else:
        print(f"⚠️ Database issue: {health}")
    
    print("\n🎯 Testing Roadmap Generation...")
    
    # Test cases
    test_cases = [
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
