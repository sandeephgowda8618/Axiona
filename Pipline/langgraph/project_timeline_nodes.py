"""
Project and Timeline Nodes for LangGraph Educational Roadmap System
"""
import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from langgraph.state import RoadmapState
from core.ollama_service import ollama_service

logger = logging.getLogger(__name__)

# Import the statistics tracker
from langgraph.nodes import roadmap_stats

async def project_generation_node(state: RoadmapState) -> RoadmapState:
    """Generate a comprehensive course project"""
    start_time = datetime.now()
    logger.info("🎯 Starting Project Generation Node")
    
    try:
        phases = state["learning_phases"]
        skill_level = state["skill_evaluation"].get("skill_level", "beginner")
        
        system_prompt = """You are the Course Project Generator Agent.

INPUT:
- learning goal
- subject
- all 4 phases concepts
- difficulty progression

TASK:
Generate ONE course-level capstone project that uses all phases.

RULES:
- Must align with subject
- Must increase difficulty gradually
- Must include deliverables + milestones
- Must include estimated time
- NO hallucination of technologies unrelated to subject
- Return JSON only

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON.
- Do NOT add markdown fences like ```json or ```.
- Do NOT add introduction text.
- Output must begin with "{" and end with "}".

OUTPUT:
{
  "title": "Project Title",
  "description": "Detailed project description",
  "objectives": ["objective1", "objective2"],
  "complexity": "beginner|intermediate|advanced",
  "estimated_time_hours": 30,
  "deliverables": [
    {"name": "deliverable1", "type": "code", "description": "description", "due_phase": 2}
  ],
  "milestones": [
    {"milestone": "milestone1", "phase": 1, "estimated_hours": 5}
  ],
  "tech_requirements": ["requirement1", "requirement2"]
}"""
        
        # Prepare phase information
        phase_info = []
        for phase in phases:
            phase_info.append({
                "phase_id": phase.get("phase_id"),
                "title": phase.get("title"),
                "concepts": phase.get("concepts", []),
                "difficulty": phase.get("difficulty")
            })
        
        user_prompt = f"""Generate a comprehensive course project for {state['subject']}.

Learning Goal: {state['learning_goal']}
Subject: {state['subject']}
User Skill Level: {skill_level}
Target Expertise: {state['target_expertise']}

Learning Phases:
{json.dumps(phase_info, indent=2)}

Requirements:
1. Create ONE capstone project that integrates all 4 phases
2. Project should progress from {skill_level} to {state['target_expertise']}
3. Include specific deliverables for each phase
4. Estimate realistic time requirements
5. Use technologies appropriate for {state['subject']}"""

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
            
            # Generate fallback project
            return generate_fallback_project(state['subject'], skill_level, phases)
        
        project_data = extract_json(response)
        
        # Validate project structure
        required_fields = ["title", "description", "objectives", "complexity", "estimated_time_hours", "deliverables", "milestones"]
        for field in required_fields:
            if field not in project_data:
                if field == "estimated_time_hours":
                    project_data[field] = 30
                elif field in ["objectives", "deliverables", "milestones"]:
                    project_data[field] = []
                else:
                    project_data[field] = f"Generated {field}"
        
        # Ensure we have milestones for each phase
        if len(project_data["milestones"]) < len(phases):
            for i, phase in enumerate(phases, 1):
                if not any(m.get("phase") == i for m in project_data["milestones"]):
                    project_data["milestones"].append({
                        "milestone": f"Complete Phase {i}: {phase.get('title', '')}",
                        "phase": i,
                        "estimated_hours": 8
                    })
        
        # Update state
        state["course_project"] = project_data
        state["processing_step"] = "project_generation_completed"
        state["completed_steps"].append("project_generation")
        
        # Track statistics
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_node_timing("project_generation_node", duration)
        roadmap_stats.track_agent_call("project_generator", True, duration)
        
        project_hours = project_data.get("estimated_time_hours", 0)
        logger.info(f"✅ Project generation completed: {project_data.get('title', 'Unknown')} ({project_hours}h)")
        return state
        
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_agent_call("project_generator", False, duration)
        
        logger.error(f"❌ Project generation failed: {e}")
        state["errors"].append(f"Project generation failed: {str(e)}")
        
        # Fallback project
        state["course_project"] = generate_fallback_project(
            state['subject'], 
            state["skill_evaluation"].get("skill_level", "beginner"), 
            state["learning_phases"]
        )
        
        return state

def generate_fallback_project(subject: str, skill_level: str, phases: List[Dict]) -> Dict[str, Any]:
    """Generate a fallback project when LLM fails"""
    if "operating system" in subject.lower():
        return {
            "title": "Mini Operating System Simulator",
            "description": "Build a simplified operating system simulator that demonstrates key OS concepts including process management, memory allocation, and file systems.",
            "objectives": [
                "Implement process scheduling algorithms",
                "Create a memory management system", 
                "Build a basic file system",
                "Demonstrate inter-process communication"
            ],
            "complexity": skill_level,
            "estimated_time_hours": 40,
            "deliverables": [
                {"name": "Process Scheduler", "type": "code", "description": "Implementation of basic scheduling algorithms", "due_phase": 2},
                {"name": "Memory Manager", "type": "code", "description": "Virtual memory and paging system", "due_phase": 3},
                {"name": "File System", "type": "code", "description": "Basic file operations and directory structure", "due_phase": 4},
                {"name": "Final Documentation", "type": "documentation", "description": "Complete system documentation and analysis", "due_phase": 4}
            ],
            "milestones": [
                {"milestone": "Project Setup and Basic Structure", "phase": 1, "estimated_hours": 5},
                {"milestone": "Process Management Implementation", "phase": 2, "estimated_hours": 15},
                {"milestone": "Memory Management Implementation", "phase": 3, "estimated_hours": 12},
                {"milestone": "File System and Integration", "phase": 4, "estimated_hours": 8}
            ],
            "tech_requirements": ["C/C++", "Linux/Unix environment", "GCC compiler", "Make"]
        }
    
    elif "algorithm" in subject.lower() or "data structure" in subject.lower():
        return {
            "title": "Algorithm Visualization and Analysis Platform",
            "description": "Create a comprehensive platform for visualizing and analyzing data structures and algorithms with performance comparisons.",
            "objectives": [
                "Implement key data structures with visualization",
                "Create algorithm performance analysis tools",
                "Build interactive demonstrations",
                "Compare algorithm efficiency metrics"
            ],
            "complexity": skill_level,
            "estimated_time_hours": 35,
            "deliverables": [
                {"name": "Data Structure Library", "type": "code", "description": "Implementation of arrays, lists, trees, graphs", "due_phase": 2},
                {"name": "Algorithm Suite", "type": "code", "description": "Sorting, searching, and graph algorithms", "due_phase": 3},
                {"name": "Visualization Interface", "type": "code", "description": "Interactive web interface for demonstrations", "due_phase": 4},
                {"name": "Performance Report", "type": "documentation", "description": "Comprehensive analysis of algorithm performance", "due_phase": 4}
            ],
            "milestones": [
                {"milestone": "Project Architecture and Basic Structures", "phase": 1, "estimated_hours": 6},
                {"milestone": "Core Data Structures Implementation", "phase": 2, "estimated_hours": 12},
                {"milestone": "Algorithm Implementation and Analysis", "phase": 3, "estimated_hours": 10},
                {"milestone": "Visualization and Final Integration", "phase": 4, "estimated_hours": 7}
            ],
            "tech_requirements": ["Python/JavaScript", "Web technologies (HTML/CSS)", "Visualization library (D3.js/Matplotlib)", "Git"]
        }
    
    else:
        return {
            "title": f"Comprehensive {subject} Project",
            "description": f"A hands-on project demonstrating mastery of {subject} concepts through practical implementation.",
            "objectives": [
                f"Apply fundamental {subject} principles",
                "Demonstrate practical problem-solving skills",
                "Create a working implementation",
                "Document learning outcomes"
            ],
            "complexity": skill_level,
            "estimated_time_hours": 30,
            "deliverables": [
                {"name": "Core Implementation", "type": "code", "description": f"Main {subject} implementation", "due_phase": 3},
                {"name": "Testing Suite", "type": "code", "description": "Comprehensive testing and validation", "due_phase": 4},
                {"name": "Project Documentation", "type": "documentation", "description": "Complete project documentation", "due_phase": 4}
            ],
            "milestones": [
                {"milestone": "Project Planning and Setup", "phase": 1, "estimated_hours": 5},
                {"milestone": "Core Development", "phase": 2, "estimated_hours": 12},
                {"milestone": "Implementation Completion", "phase": 3, "estimated_hours": 8},
                {"milestone": "Testing and Documentation", "phase": 4, "estimated_hours": 5}
            ],
            "tech_requirements": ["Programming language appropriate to subject", "Development environment", "Version control"]
        }

async def time_planning_node(state: RoadmapState) -> RoadmapState:
    """Generate comprehensive learning schedule"""
    start_time = datetime.now()
    logger.info("🎯 Starting Time Planning Node")
    
    try:
        phases = state["learning_phases"]
        project = state["course_project"]
        hours_per_week = state["hours_per_week"]
        
        # Calculate total hours needed
        total_phase_hours = sum([estimate_phase_hours(phase) for phase in phases])
        project_hours = project.get("estimated_time_hours", 30)
        total_hours = total_phase_hours + project_hours
        
        # Add buffer time (20%)
        buffered_hours = int(total_hours * 1.2)
        
        # Calculate duration
        total_weeks = max(8, int(buffered_hours / hours_per_week))
        
        system_prompt = """You are the Time Planner Agent.

INPUT:
- total hours
- number of phases
- project estimated hours
- user availability (hours/week)

TASK:
- Build learning schedule
- Allocate hours per phase
- Allocate project time
- Add milestones + review cycles
- Return JSON only

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON.
- Do NOT add markdown fences like ```json or ```.
- Do NOT add introduction text.
- Output must begin with "{" and end with "}".

OUTPUT:
{
  "total_weeks": 12,
  "hours_per_week": 10,
  "weekly_plan": [
    {
      "week": 1,
      "focus": "Phase 1: Foundation",
      "total_hours": 10,
      "activities": [
        {"type": "study", "description": "Learn basic concepts", "hours": 6},
        {"type": "practice", "description": "Hands-on exercises", "hours": 3},
        {"type": "review", "description": "Review and assessment", "hours": 1}
      ]
    }
  ],
  "review_cycles": [
    {"week": 4, "type": "phase_review", "topics": ["Phase 1", "Phase 2"], "hours": 3}
  ],
  "project_timeline": [
    {"milestone": "Project Setup", "week": 2, "phase": 1, "hours": 3}
  ]
}"""
        
        user_prompt = f"""Generate a learning schedule for {state['subject']}.

Parameters:
- Total Content Hours: {total_phase_hours}
- Project Hours: {project_hours}
- Total Hours (with buffer): {buffered_hours}
- Hours Per Week: {hours_per_week}
- Calculated Duration: {total_weeks} weeks

Learning Phases:
{json.dumps([{'phase': p.get('phase_id'), 'title': p.get('title'), 'concepts': p.get('concepts', [])} for p in phases], indent=2)}

Project Milestones:
{json.dumps(project.get('milestones', []), indent=2)}

Create a detailed weekly schedule that:
1. Balances study, practice, and review time
2. Integrates project work appropriately
3. Includes regular review cycles
4. Maintains realistic weekly time commitments"""

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
            
            # Generate fallback schedule
            return generate_fallback_schedule(total_weeks, hours_per_week, phases, project)
        
        schedule_data = extract_json(response)
        
        # Validate schedule structure
        if "weekly_plan" not in schedule_data:
            schedule_data["weekly_plan"] = []
        if "review_cycles" not in schedule_data:
            schedule_data["review_cycles"] = []
        if "project_timeline" not in schedule_data:
            schedule_data["project_timeline"] = []
        
        # Ensure basic schedule parameters
        schedule_data["total_weeks"] = total_weeks
        schedule_data["hours_per_week"] = hours_per_week
        schedule_data["start_date"] = datetime.now().isoformat()
        schedule_data["end_date"] = (datetime.now() + timedelta(weeks=total_weeks)).isoformat()
        
        # Add metadata
        schedule_data["meta"] = {
            "total_content_hours": total_phase_hours,
            "project_hours": project_hours,
            "buffer_percentage": 20,
            "total_scheduled_hours": buffered_hours
        }
        
        # Update state
        state["learning_schedule"] = schedule_data
        state["processing_step"] = "time_planning_completed"
        state["completed_steps"].append("time_planning")
        
        # Track statistics
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_node_timing("time_planning_node", duration)
        roadmap_stats.track_agent_call("time_planner", True, duration)
        
        logger.info(f"✅ Time planning completed: {total_weeks} weeks, {hours_per_week}h/week")
        return state
        
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_agent_call("time_planner", False, duration)
        
        logger.error(f"❌ Time planning failed: {e}")
        state["errors"].append(f"Time planning failed: {str(e)}")
        
        # Fallback schedule
        state["learning_schedule"] = generate_fallback_schedule(
            12, state["hours_per_week"], state["learning_phases"], state["course_project"]
        )
        
        return state

def estimate_phase_hours(phase: Dict[str, Any]) -> int:
    """Estimate hours needed for a learning phase"""
    difficulty = phase.get("difficulty", "beginner")
    concepts = phase.get("concepts", [])
    
    base_hours = {
        "beginner": 12,
        "intermediate": 15,
        "advanced": 18
    }
    
    # Adjust based on number of concepts
    concept_adjustment = len(concepts) * 2
    
    return base_hours.get(difficulty, 12) + concept_adjustment

def generate_fallback_schedule(weeks: int, hours_per_week: int, phases: List[Dict], project: Dict) -> Dict[str, Any]:
    """Generate a fallback learning schedule"""
    weekly_plan = []
    review_cycles = []
    project_timeline = []
    
    # Simple weekly distribution
    weeks_per_phase = max(2, weeks // 4)
    current_week = 1
    
    for phase in phases:
        phase_id = phase.get("phase_id", 1)
        phase_title = phase.get("title", f"Phase {phase_id}")
        
        for week_in_phase in range(weeks_per_phase):
            week_plan = {
                "week": current_week,
                "focus": f"Phase {phase_id}: {phase_title}",
                "total_hours": hours_per_week,
                "activities": [
                    {"type": "study", "description": "Learn phase concepts", "hours": int(hours_per_week * 0.6)},
                    {"type": "practice", "description": "Hands-on exercises", "hours": int(hours_per_week * 0.3)},
                    {"type": "review", "description": "Review and assessment", "hours": int(hours_per_week * 0.1)}
                ]
            }
            weekly_plan.append(week_plan)
            current_week += 1
    
    # Add review cycles
    for i in range(0, weeks, 4):
        if i + 4 <= weeks:
            review_cycles.append({
                "week": i + 4,
                "type": "phase_review",
                "topics": [f"Phase {j//weeks_per_phase + 1}" for j in range(i, min(i+4, weeks))],
                "hours": 3
            })
    
    # Add project timeline
    project_milestones = project.get("milestones", [])
    for milestone in project_milestones:
        milestone_week = (milestone.get("phase", 1) * weeks_per_phase) - 1
        project_timeline.append({
            "milestone": milestone.get("milestone", "Project Milestone"),
            "week": min(milestone_week, weeks),
            "phase": milestone.get("phase", 1),
            "hours": milestone.get("estimated_hours", 5)
        })
    
    return {
        "total_weeks": weeks,
        "hours_per_week": hours_per_week,
        "start_date": datetime.now().isoformat(),
        "end_date": (datetime.now() + timedelta(weeks=weeks)).isoformat(),
        "weekly_plan": weekly_plan,
        "review_cycles": review_cycles,
        "project_timeline": project_timeline
    }
