"""
LangGraph Node Implementations for Educational Roadmap System
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
    
    def track_resources(self, resource_type: str, count: int):
        self.stats["resource_counts"][resource_type] = count
    
    def calculate_success_rates(self):
        for agent, data in self.stats["agent_calls"].items():
            if data["calls"] > 0:
                self.stats["success_rates"][agent] = data["successes"] / data["calls"]
    
    def get_summary(self) -> Dict[str, Any]:
        self.calculate_success_rates()
        return {
            "total_duration_minutes": self.stats["total_duration_seconds"] / 60,
            "node_count": len(self.stats["node_timings"]),
            "agent_count": len(self.stats["agent_calls"]),
            "total_resources": sum(self.stats["resource_counts"].values()),
            "overall_success_rate": sum(self.stats["success_rates"].values()) / len(self.stats["success_rates"]) if self.stats["success_rates"] else 0,
            "detailed_stats": self.stats
        }

# Global statistics tracker
roadmap_stats = RoadmapStatistics()

async def interview_node(state: RoadmapState) -> RoadmapState:
    """Generate interview questions for user assessment"""
    start_time = datetime.now()
    logger.info("🎯 Starting Interview Generation Node")
    roadmap_stats.start_timer()
    
    try:
        system_prompt = """You are the Interview Agent for an educational roadmap system.  
Your task is to generate exactly 5 interview questions in pure JSON.

PURPOSE:
- Determine the user's background knowledge
- Detect missing prerequisites
- Understand learning preferences
- Capture time availability
- Establish difficulty alignment

REQUIREMENTS:
- Return ONLY a JSON object with "questions" array
- Include: question_id, question_text, question_type, category, required, context
- No explanations, no natural language outside JSON

OUTPUT FORMAT:
{
  "questions": [
    {
      "question_id": "q1",
      "question_text": "What is your current experience with [SUBJECT]?",
      "question_type": "open_ended",
      "category": "current_knowledge",
      "required": true,
      "context": "Assessing baseline knowledge"
    }
  ]
}"""
        
        user_prompt = f"""Generate 5 interview questions for learning {state['subject']}.
Subject: {state['subject']}
Learning Goal: {state['learning_goal']}
Target Level: {state['target_expertise']}

Generate questions to assess:
1. Current knowledge level
2. Learning preferences  
3. Time availability
4. Specific interests
5. Prerequisites"""

        # Call LLM
        response = await ollama_service.generate_response(
            user_prompt, 
            system_prompt=system_prompt,
            temperature=0.3
        )
        
        # Parse JSON response with robust extraction
        def extract_json(text: str) -> Dict[str, Any]:
            import re
            text = re.sub(r'```json\s*', '', text)
            text = re.sub(r'```\s*', '', text)
            
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                try:
                    return json.loads(text[json_start:json_end])
                except json.JSONDecodeError:
                    pass
            
            # Fallback
            return {"questions": []}
        
        interview_data = extract_json(response)
        questions = interview_data.get("questions", [])
        
        # Generate mock answers for testing
        mock_answers = []
        for i, question in enumerate(questions, 1):
            answer = {
                "question_id": question.get("question_id", f"q{i}"),
                "question_text": question.get("question_text", ""),
                "answer": generate_mock_answer(question, state)
            }
            mock_answers.append(answer)
        
        # Update state
        state["interview_questions"] = questions
        state["interview_answers"] = mock_answers
        state["processing_step"] = "interview_completed"
        state["completed_steps"].append("interview")
        
        # Track statistics
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_node_timing("interview_node", duration)
        roadmap_stats.track_agent_call("interview_agent", True, duration)
        
        logger.info(f"✅ Interview node completed: {len(questions)} questions generated")
        return state
        
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_agent_call("interview_agent", False, duration)
        
        logger.error(f"❌ Interview node failed: {e}")
        state["errors"].append(f"Interview generation failed: {str(e)}")
        
        # Fallback questions
        state["interview_questions"] = generate_fallback_questions(state["subject"])
        state["interview_answers"] = []
        
        return state

def generate_mock_answer(question: Dict[str, Any], state: RoadmapState) -> str:
    """Generate realistic mock answers based on question type and user background"""
    question_text = question.get("question_text", "").lower()
    category = question.get("category", "")
    
    if "experience" in question_text or "knowledge" in question_text:
        if state["target_expertise"] == "Beginner":
            return f"I have basic understanding of {state['subject']} from coursework but want to learn more deeply"
        elif state["target_expertise"] == "Intermediate":
            return f"I have some practical experience with {state['subject']} but want to strengthen my understanding"
        else:
            return f"I have good theoretical knowledge of {state['subject']} but want to master advanced topics"
    
    elif "time" in question_text or "hours" in question_text:
        return f"I can dedicate {state['hours_per_week']} hours per week to studying"
    
    elif "preference" in question_text or "learn" in question_text:
        return "I prefer a combination of reading, hands-on practice, and video tutorials"
    
    elif "interest" in question_text or "topic" in question_text:
        if state["subject"].lower() == "operating systems":
            return "Most interested in memory management, process scheduling, and file systems"
        elif "algorithm" in state["subject"].lower():
            return "Most interested in dynamic programming, graph algorithms, and optimization"
        else:
            return f"Interested in practical applications and real-world examples of {state['subject']}"
    
    else:
        return f"I'm motivated to learn {state['subject']} to improve my technical skills and career prospects"

def generate_fallback_questions(subject: str) -> List[Dict[str, Any]]:
    """Generate fallback questions when LLM fails"""
    return [
        {
            "question_id": "q1",
            "question_text": f"What is your current experience with {subject}?",
            "question_type": "open_ended",
            "category": "current_knowledge",
            "required": True,
            "context": "Assessing baseline knowledge"
        },
        {
            "question_id": "q2",
            "question_text": "How many hours per week can you dedicate to studying?",
            "question_type": "numeric",
            "category": "time_commitment",
            "required": True,
            "context": "Planning study schedule"
        },
        {
            "question_id": "q3",
            "question_text": "What learning methods do you prefer?",
            "question_type": "multiple_choice",
            "category": "learning_style",
            "required": True,
            "context": "Customizing content delivery"
        },
        {
            "question_id": "q4",
            "question_text": f"What specific topics in {subject} interest you most?",
            "question_type": "open_ended",
            "category": "interests",
            "required": False,
            "context": "Prioritizing content areas"
        },
        {
            "question_id": "q5",
            "question_text": "What programming languages are you comfortable with?",
            "question_type": "open_ended",
            "category": "technical_background",
            "required": False,
            "context": "Selecting appropriate examples"
        }
    ]

async def skill_evaluation_node(state: RoadmapState) -> RoadmapState:
    """Evaluate user skills from interview answers"""
    start_time = datetime.now()
    logger.info("🎯 Starting Skill Evaluation Node")
    
    try:
        if not state["interview_answers"]:
            raise ValueError("No interview answers available for skill evaluation")
        
        # Build answers text
        answers_text = ""
        for answer in state["interview_answers"]:
            qid = answer.get("question_id", "")
            question = answer.get("question_text", "")
            response = answer.get("answer", "")
            answers_text += f"Q{qid}: {question}\nA: {response}\n\n"
        
        system_prompt = """You are the Skill Evaluation Agent.  
Input: JSON answers from Interview Agent.  
Output: A JSON object describing the user's skill profile.

TASKS:
- Analyze answers
- Determine skill_level (beginner | intermediate | advanced)
- List strengths and weaknesses
- Identify potential learning risks
- NO hallucination

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON.
- Do NOT add markdown fences like ```json or ```.
- Do NOT add introduction text.
- Do NOT add explanation after JSON.
- Output must begin with "{" and end with "}".

RETURN ONLY JSON with:
{
  "skill_level": "beginner",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "analysis_notes": ["note1", "note2"]
}"""
        
        user_prompt = f"""Analyze these interview answers and return a JSON skill evaluation:

{answers_text}

Based on the answers for {state['subject']}, determine:
- skill_level: "beginner", "intermediate", or "advanced"
- strengths: array of specific strengths identified
- weaknesses: array of specific weaknesses/gaps identified  
- analysis_notes: array of analytical observations"""

        response = await ollama_service.generate_response(
            user_prompt,
            system_prompt=system_prompt,
            temperature=0.2
        )
        
        # Extract and parse JSON
        def extract_json(text: str) -> Dict[str, Any]:
            import re
            text = re.sub(r'```json\s*', '', text)
            text = re.sub(r'```\s*', '', text)
            
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                try:
                    return json.loads(text[json_start:json_end])
                except json.JSONDecodeError:
                    pass
            
            # Fallback evaluation
            return {
                "skill_level": "beginner",
                "strengths": ["motivated to learn"],
                "weaknesses": ["limited experience"],
                "analysis_notes": ["JSON parsing failed, using default assessment"]
            }
        
        skill_evaluation = extract_json(response)
        
        # Validate and ensure required fields
        required_fields = ["skill_level", "strengths", "weaknesses", "analysis_notes"]
        for field in required_fields:
            if field not in skill_evaluation:
                skill_evaluation[field] = []
        
        # Validate skill level
        if skill_evaluation["skill_level"] not in ["beginner", "intermediate", "advanced"]:
            skill_evaluation["skill_level"] = "beginner"
        
        # Update state
        state["skill_evaluation"] = skill_evaluation
        state["processing_step"] = "skill_evaluation_completed"
        state["completed_steps"].append("skill_evaluation")
        
        # Track statistics
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_node_timing("skill_evaluation_node", duration)
        roadmap_stats.track_agent_call("skill_evaluator", True, duration)
        
        logger.info(f"✅ Skill evaluation completed: {skill_evaluation['skill_level']} level")
        return state
        
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_agent_call("skill_evaluator", False, duration)
        
        logger.error(f"❌ Skill evaluation failed: {e}")
        state["errors"].append(f"Skill evaluation failed: {str(e)}")
        
        # Fallback evaluation
        state["skill_evaluation"] = {
            "skill_level": "beginner",
            "strengths": ["basic background knowledge"],
            "weaknesses": ["needs structured learning path"],
            "analysis_notes": ["Fallback assessment due to evaluation failure"]
        }
        
        return state

async def gap_detection_node(state: RoadmapState) -> RoadmapState:
    """Detect knowledge gaps and prerequisites"""
    start_time = datetime.now()
    logger.info("🎯 Starting Gap Detection Node")
    
    try:
        skill_eval = state["skill_evaluation"]
        
        system_prompt = """You are the Concept Gap Detection Agent.

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
  "gaps": ["gap1", "gap2"],
  "prerequisites_needed": ["prereq1", "prereq2"],
  "num_gaps": 2
}"""
        
        user_prompt = f"""Detect knowledge gaps for learning {state['subject']}.

Learning Goal: {state['learning_goal']}
Subject: {state['subject']}
Current Skill Level: {skill_eval.get('skill_level', 'beginner')}
Weaknesses: {skill_eval.get('weaknesses', [])}
Target Level: {state['target_expertise']}

Identify:
1. Fundamental concepts missing
2. Prerequisites needed before starting
3. Knowledge gaps to address"""

        response = await ollama_service.generate_response(
            user_prompt,
            system_prompt=system_prompt,
            temperature=0.3
        )
        
        # Extract JSON
        def extract_json(text: str) -> Dict[str, Any]:
            import re
            text = re.sub(r'```json\s*', '', text)
            text = re.sub(r'```\s*', '', text)
            
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                try:
                    return json.loads(text[json_start:json_end])
                except json.JSONDecodeError:
                    pass
            
            # Generate fallback based on subject
            return generate_fallback_gaps(state['subject'], skill_eval.get('skill_level', 'beginner'))
        
        gap_data = extract_json(response)
        
        # Update state
        state["knowledge_gaps"] = gap_data.get("gaps", [])
        state["prerequisites_needed"] = gap_data.get("prerequisites_needed", [])
        state["processing_step"] = "gap_detection_completed"
        state["completed_steps"].append("gap_detection")
        
        # Track statistics
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_node_timing("gap_detection_node", duration)
        roadmap_stats.track_agent_call("gap_detector", True, duration)
        
        gaps_count = len(state["knowledge_gaps"])
        logger.info(f"✅ Gap detection completed: {gaps_count} gaps identified")
        return state
        
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_agent_call("gap_detector", False, duration)
        
        logger.error(f"❌ Gap detection failed: {e}")
        state["errors"].append(f"Gap detection failed: {str(e)}")
        
        # Fallback gaps
        state["knowledge_gaps"] = ["foundational concepts", "practical application"]
        state["prerequisites_needed"] = ["basic programming knowledge"]
        
        return state

def generate_fallback_gaps(subject: str, skill_level: str) -> Dict[str, Any]:
    """Generate subject-specific fallback gaps"""
    if "operating system" in subject.lower():
        if skill_level == "beginner":
            return {
                "gaps": ["process management", "memory management", "file systems", "system calls"],
                "prerequisites_needed": ["basic programming", "computer architecture"],
                "num_gaps": 4
            }
        else:
            return {
                "gaps": ["advanced scheduling", "distributed systems", "security"],
                "prerequisites_needed": ["operating system basics"],
                "num_gaps": 3
            }
    
    elif "algorithm" in subject.lower() or "data structure" in subject.lower():
        if skill_level == "beginner":
            return {
                "gaps": ["algorithm analysis", "data structure implementation", "complexity theory"],
                "prerequisites_needed": ["programming fundamentals", "mathematics"],
                "num_gaps": 3
            }
        else:
            return {
                "gaps": ["advanced algorithms", "optimization techniques"],
                "prerequisites_needed": ["basic algorithms", "data structures"],
                "num_gaps": 2
            }
    
    else:
        return {
            "gaps": ["foundational concepts", "practical applications"],
            "prerequisites_needed": ["basic technical knowledge"],
            "num_gaps": 2
        }

async def prerequisite_graph_node(state: RoadmapState) -> RoadmapState:
    """Build prerequisite graph with learning phases"""
    start_time = datetime.now()
    logger.info("🎯 Starting Prerequisite Graph Generation Node")
    
    try:
        gaps = state["knowledge_gaps"]
        
        system_prompt = """You are the Prerequisite Graph Agent.

GOAL:
Build a dependency graph linking concepts and prerequisites for the subject.

RULES:
- Follow strict JSON schema
- Node = concept
- Edge = dependency
- Include 4 learning phases mapping to conceptual progression

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON.
- Do NOT add markdown fences like ```json or ```.
- Do NOT add introduction text.
- Output must begin with "{" and end with "}".

OUTPUT:
{
  "nodes": ["concept1", "concept2"],
  "edges": [{"from": "concept1", "to": "concept2"}],
  "learning_phases": [
    {
      "phase_id": 1,
      "title": "Foundation",
      "concepts": ["concept1", "concept2"],
      "difficulty": "beginner"
    }
  ]
}"""
        
        user_prompt = f"""Build a prerequisite dependency graph for learning {state['subject']}.

Subject: {state['subject']}
Learning Goal: {state['learning_goal']}
Identified Gaps: {', '.join(gaps) if gaps else 'None'}
Skill Level: {state['skill_evaluation'].get('skill_level', 'beginner')}

Create a 4-phase learning progression:
- Phase 1: Foundation (beginner)
- Phase 2: Core Concepts (intermediate)  
- Phase 3: Advanced Topics (intermediate)
- Phase 4: Integration & Mastery (advanced)

Each phase should have 3-5 relevant concepts.
Include prerequisite relationships between concepts."""

        response = await ollama_service.generate_response(
            user_prompt,
            system_prompt=system_prompt,
            temperature=0.3
        )
        
        # Extract and validate JSON
        def extract_json(text: str) -> Dict[str, Any]:
            import re
            text = re.sub(r'```json\s*', '', text)
            text = re.sub(r'```\s*', '', text)
            
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                try:
                    return json.loads(text[json_start:json_end])
                except json.JSONDecodeError:
                    pass
            
            # Generate fallback graph
            return generate_fallback_graph(state['subject'])
        
        graph_data = extract_json(response)
        
        # Ensure we have exactly 4 phases
        phases = graph_data.get("learning_phases", [])
        if len(phases) < 4:
            phases = ensure_four_phases(phases, state['subject'])
        
        # Update state
        state["prerequisite_graph"] = graph_data
        state["learning_phases"] = phases[:4]  # Limit to 4 phases
        state["processing_step"] = "prerequisite_graph_completed"
        state["completed_steps"].append("prerequisite_graph")
        
        # Track statistics
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_node_timing("prerequisite_graph_node", duration)
        roadmap_stats.track_agent_call("prerequisite_graph", True, duration)
        
        logger.info(f"✅ Prerequisite graph completed: {len(phases)} phases, {len(graph_data.get('nodes', []))} concepts")
        return state
        
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_agent_call("prerequisite_graph", False, duration)
        
        logger.error(f"❌ Prerequisite graph generation failed: {e}")
        state["errors"].append(f"Prerequisite graph generation failed: {str(e)}")
        
        # Fallback graph
        fallback_graph = generate_fallback_graph(state['subject'])
        state["prerequisite_graph"] = fallback_graph
        state["learning_phases"] = fallback_graph["learning_phases"]
        
        return state

def generate_fallback_graph(subject: str) -> Dict[str, Any]:
    """Generate subject-specific fallback prerequisite graph"""
    if "operating system" in subject.lower():
        return {
            "nodes": ["OS basics", "processes", "memory management", "file systems", "synchronization", "scheduling"],
            "edges": [
                {"from": "OS basics", "to": "processes"},
                {"from": "processes", "to": "synchronization"},
                {"from": "processes", "to": "scheduling"},
                {"from": "OS basics", "to": "memory management"},
                {"from": "memory management", "to": "file systems"}
            ],
            "learning_phases": [
                {
                    "phase_id": 1,
                    "title": "OS Fundamentals",
                    "concepts": ["OS basics", "system calls", "OS architecture"],
                    "difficulty": "beginner"
                },
                {
                    "phase_id": 2,
                    "title": "Process Management", 
                    "concepts": ["processes", "threads", "synchronization"],
                    "difficulty": "intermediate"
                },
                {
                    "phase_id": 3,
                    "title": "Memory Management",
                    "concepts": ["memory management", "virtual memory", "paging"],
                    "difficulty": "intermediate"
                },
                {
                    "phase_id": 4,
                    "title": "File Systems & Advanced Topics",
                    "concepts": ["file systems", "I/O management", "distributed systems"],
                    "difficulty": "advanced"
                }
            ]
        }
    
    elif "algorithm" in subject.lower() or "data structure" in subject.lower():
        return {
            "nodes": ["arrays", "linked lists", "sorting", "searching", "trees", "graphs", "dynamic programming"],
            "edges": [
                {"from": "arrays", "to": "sorting"},
                {"from": "arrays", "to": "searching"},
                {"from": "linked lists", "to": "trees"},
                {"from": "trees", "to": "graphs"},
                {"from": "sorting", "to": "dynamic programming"}
            ],
            "learning_phases": [
                {
                    "phase_id": 1,
                    "title": "Basic Data Structures",
                    "concepts": ["arrays", "linked lists", "stacks", "queues"],
                    "difficulty": "beginner"
                },
                {
                    "phase_id": 2,
                    "title": "Trees and Graphs",
                    "concepts": ["binary trees", "BST", "graphs", "traversals"],
                    "difficulty": "intermediate"
                },
                {
                    "phase_id": 3,
                    "title": "Sorting and Searching",
                    "concepts": ["sorting algorithms", "binary search", "hash tables"],
                    "difficulty": "intermediate"
                },
                {
                    "phase_id": 4,
                    "title": "Advanced Algorithms",
                    "concepts": ["dynamic programming", "greedy algorithms", "graph algorithms"],
                    "difficulty": "advanced"
                }
            ]
        }
    
    else:
        return {
            "nodes": ["fundamentals", "core concepts", "advanced topics", "applications"],
            "edges": [
                {"from": "fundamentals", "to": "core concepts"},
                {"from": "core concepts", "to": "advanced topics"},
                {"from": "advanced topics", "to": "applications"}
            ],
            "learning_phases": [
                {
                    "phase_id": 1,
                    "title": "Fundamentals",
                    "concepts": ["basic concepts", "terminology"],
                    "difficulty": "beginner"
                },
                {
                    "phase_id": 2,
                    "title": "Core Concepts",
                    "concepts": ["key principles", "methods"],
                    "difficulty": "intermediate"
                },
                {
                    "phase_id": 3,
                    "title": "Advanced Topics",
                    "concepts": ["complex scenarios", "optimization"],
                    "difficulty": "intermediate"
                },
                {
                    "phase_id": 4,
                    "title": "Applications",
                    "concepts": ["real-world applications", "projects"],
                    "difficulty": "advanced"
                }
            ]
        }

def ensure_four_phases(phases: List[Dict], subject: str) -> List[Dict]:
    """Ensure we have exactly 4 phases"""
    if len(phases) >= 4:
        return phases[:4]
    
    fallback = generate_fallback_graph(subject)["learning_phases"]
    
    # Merge existing phases with fallback
    while len(phases) < 4 and len(fallback) > len(phases):
        phases.append(fallback[len(phases)])
    
    return phases

# Continue with remaining nodes...
