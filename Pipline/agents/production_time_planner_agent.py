"""
Production Time Planner Agent
=============================

This agent generates comprehensive learning schedules with milestones and review cycles
using finalized LLM prompts with strict schema validation. No hardcoded fallbacks.

Created: November 16, 2025
Purpose: Replace hardcoded schedule generation with pure LLM-driven approach
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from agents.base_agent import BaseAgent, AgentState
from core.ollama_service import ollama_service

logger = logging.getLogger(__name__)

class ProductionTimePlannerAgent(BaseAgent):
    """Production-ready Time Planner Agent with finalized LLM prompts"""
    
    def __init__(self):
        super().__init__("ProductionTimePlannerAgent", temperature=0.2, max_tokens=3000)
        
    def get_system_prompt(self) -> str:
        return """You are the Time Planner Agent.

INPUT:
- learning_phases (phases with concepts, estimated hours, difficulty)
- course_project (project with milestones and deliverables)
- user_constraints (hours_per_week, preferred_pace, schedule_preferences)

TASK:
Generate a comprehensive, realistic learning schedule that balances content delivery, practice time, project work, and review cycles. The schedule must be adaptive to user constraints and include buffer time for reinforcement.

SCHEDULE DESIGN PRINCIPLES:
1. SPACED LEARNING: Distribute content across weeks with reinforcement
2. PROGRESSIVE BUILDING: Each week builds on previous knowledge
3. BALANCED ALLOCATION: Mix theory, practice, project work, and reviews
4. MILESTONE INTEGRATION: Align project deliverables with learning phases
5. REALISTIC PACING: Account for user's available time and pace preferences
6. REVIEW CYCLES: Regular reinforcement and assessment points

ACTIVITY TYPES:
- study: Reading materials, watching videos, learning concepts
- practice: Hands-on exercises, coding challenges, problem solving
- project: Course project milestones and deliverables
- review: Reinforcement of previous concepts, quiz preparation
- assessment: Self-evaluation, knowledge checks, milestone reviews

RETURN JSON ONLY:
{
  "learning_schedule": {
    "total_duration_weeks": 8,
    "hours_per_week": 10,
    "start_date": "2025-11-16",
    "end_date": "2025-01-11",
    "weekly_plan": [
      {
        "week": 1,
        "focus": "Operating Systems Fundamentals",
        "phase": 1,
        "total_hours": 10,
        "activities": [
          {
            "activity": "Study OS introduction and architecture",
            "type": "study",
            "duration_hours": 4,
            "resources": ["PES materials Unit 1", "Reference book Chapter 1-2"],
            "concepts": ["OS basics", "system calls"]
          },
          {
            "activity": "Practice system call programming exercises",
            "type": "practice", 
            "duration_hours": 3,
            "resources": ["Coding exercises", "Programming environment"],
            "concepts": ["system calls", "basic OS interface"]
          },
          {
            "activity": "Begin project planning and environment setup",
            "type": "project",
            "duration_hours": 2,
            "resources": ["Project specification", "Development tools"],
            "deliverable": "Project setup document"
          },
          {
            "activity": "Review and self-assessment",
            "type": "review",
            "duration_hours": 1,
            "resources": ["Study notes", "Practice problems"],
            "concepts": ["Week 1 concepts review"]
          }
        ],
        "milestones": ["Complete OS fundamentals", "Project environment ready"],
        "deliverables": ["Project setup document"],
        "learning_objectives": ["Understand OS role and basic architecture"],
        "prerequisites_covered": ["System interface basics"]
      }
    ],
    "review_cycles": [
      {
        "week": 2,
        "type": "weekly",
        "topics": ["OS fundamentals review", "System calls recap"],
        "duration_hours": 1,
        "activities": ["Quiz on Week 1 concepts", "Clarify doubts"]
      },
      {
        "week": 4,
        "type": "phase",
        "topics": ["Process management comprehensive review"],
        "duration_hours": 2,
        "activities": ["Phase 2 assessment", "Integration review"]
      },
      {
        "week": 6,
        "type": "midterm",
        "topics": ["All concepts from Phases 1-3"],
        "duration_hours": 3,
        "activities": ["Comprehensive review", "Practice exam", "Project check-in"]
      },
      {
        "week": 8,
        "type": "final",
        "topics": ["Complete course review and integration"],
        "duration_hours": 4,
        "activities": ["Final exam prep", "Project completion", "Portfolio review"]
      }
    ],
    "project_timeline": [
      {
        "milestone": "Project Setup & Planning",
        "week": 1,
        "deliverable": "Project architecture document",
        "estimated_hours": 2,
        "phase_alignment": 1
      },
      {
        "milestone": "Basic Process Management Implementation",
        "week": 3,
        "deliverable": "Process manager code",
        "estimated_hours": 8,
        "phase_alignment": 2
      },
      {
        "milestone": "Memory Management Integration",
        "week": 5,
        "deliverable": "Memory allocator implementation",
        "estimated_hours": 10,
        "phase_alignment": 3
      },
      {
        "milestone": "Final Integration & Demonstration",
        "week": 8,
        "deliverable": "Complete system demonstration",
        "estimated_hours": 6,
        "phase_alignment": 4
      }
    ],
    "adaptive_features": {
      "buffer_weeks": 1,
      "flexibility_points": ["Week 4", "Week 6"],
      "catch_up_strategies": ["Extended practice sessions", "Additional review cycles"],
      "acceleration_options": ["Skip basic reviews", "Advanced challenge problems"]
    },
    "study_recommendations": {
      "daily_commitment": "1.5-2 hours weekdays, 3-4 hours weekends",
      "peak_study_times": ["Morning conceptual study", "Evening practical work"],
      "break_patterns": ["25-min study + 5-min break", "Weekly rest day"],
      "progress_tracking": ["Weekly self-assessment", "Milestone completion tracking"]
    }
  },
  "meta": {
    "generated_at": "2025-11-16T10:30:00Z",
    "planning_version": "2.0",
    "total_learning_hours": 80,
    "project_hours": 26,
    "theory_practice_ratio": "60:40",
    "user_pace": "normal",
    "scheduling_method": "LLM with educational timing patterns"
  }
}

CRITICAL RULES:
- Schedule must be REALISTIC and achievable within user constraints
- Balance content delivery with practice and project work
- Include adequate review and reinforcement cycles
- Align project milestones with learning phases
- Provide buffer time and flexibility for individual pacing
- Ensure progressive difficulty and concept building
- Include specific activities with clear time allocations

Return ONLY JSON."""

    def _clean_and_parse_json(self, response: str) -> dict:
        """Clean and parse JSON response from LLM"""
        try:
            import json
            import re
            
            logger.info(f"Cleaning schedule LLM response. Original length: {len(response)}")
            
            # Clean the response
            cleaned = response.strip()
            
            # Remove markdown code blocks
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:]
            
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            
            cleaned = cleaned.strip()
            
            # Find JSON object boundaries
            brace_count = 0
            start_idx = -1
            end_idx = -1
            
            for i, char in enumerate(cleaned):
                if char == '{':
                    if start_idx == -1:
                        start_idx = i
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0 and start_idx != -1:
                        end_idx = i + 1
                        break
            
            if start_idx != -1 and end_idx != -1:
                cleaned = cleaned[start_idx:end_idx]
                logger.info(f"Extracted JSON portion: {cleaned[:200]}...")
            else:
                # Fallback: try to extract anything between first { and last }
                start_idx = cleaned.find("{")
                end_idx = cleaned.rfind("}") + 1
                
                if start_idx != -1 and end_idx > start_idx:
                    cleaned = cleaned[start_idx:end_idx]
                    logger.info(f"Fallback extraction: {cleaned[:200]}...")
                else:
                    logger.error("No JSON structure found in response")
                    return {}
            
            # Parse the JSON
            parsed = json.loads(cleaned)
            logger.info("Successfully parsed schedule JSON response")
            return parsed
            
        except json.JSONDecodeError as e:
            logger.error(f"Schedule JSON decode error: {e}")
            logger.error(f"Problematic text around error: {cleaned[max(0, e.pos-50):e.pos+50]}")
            return {}
        except Exception as e:
            logger.error(f"Schedule JSON parsing error: {e}")
            return {}

    async def generate_schedule(
        self,
        learning_phases: List[Dict[str, Any]],
        course_project: Dict[str, Any],
        user_constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive learning schedule using LLM
        
        Args:
            learning_phases: Course phases with concepts and estimated hours
            course_project: Project details with milestones
            user_constraints: User's time and pace constraints
            
        Returns:
            Dict with detailed learning schedule and metadata
        """
        try:
            logger.info(f"Generating learning schedule for {len(learning_phases)} phases")
            
            # Set default constraints
            constraints = user_constraints or {
                "hours_per_week": 10,
                "preferred_pace": "normal",
                "schedule_flexibility": "moderate",
                "daily_commitment": "1-2 hours",
                "weekend_availability": "high"
            }
            
            # Calculate total estimated hours from phases and project
            phase_hours = sum(phase.get("estimated_hours", 10) for phase in learning_phases)
            project_hours = course_project.get("course_project", {}).get("estimated_time_hours", 20)
            total_content_hours = phase_hours + project_hours
            
            # Add buffer time (20% extra for reviews, reinforcement, flexibility)
            total_schedule_hours = int(total_content_hours * 1.2)
            hours_per_week = constraints.get("hours_per_week", 10)
            estimated_weeks = max(6, total_schedule_hours // hours_per_week)
            
            logger.info(f"Schedule parameters: {total_content_hours}h content + buffer = {total_schedule_hours}h over {estimated_weeks} weeks")
            
            # Build comprehensive prompt
            prompt = f"""You MUST return ONLY a valid JSON response. Keep it CONCISE but complete.

Generate a learning schedule for:

Learning Phases: {len(learning_phases)} phases, Total: {total_content_hours}h
Hours Per Week: {hours_per_week}
Duration: {estimated_weeks} weeks

Phase Summary:
{json.dumps([{"phase": p.get("phase_id"), "title": p.get("title"), "hours": p.get("estimated_hours"), "concepts": p.get("concepts", [])} for p in learning_phases], indent=1)}

Project: {course_project.get("course_project", {}).get("title", "Unknown")} ({project_hours}h)
Milestones: {len(course_project.get("course_project", {}).get("milestones", []))}

User Constraints: {hours_per_week}h/week, {constraints.get("preferred_pace", "normal")} pace

RETURN ONLY THIS CONCISE JSON:
{{
  "learning_schedule": {{
    "total_duration_weeks": {estimated_weeks},
    "hours_per_week": {hours_per_week},
    "start_date": "{datetime.now().date().isoformat()}",
    "end_date": "{(datetime.now() + timedelta(weeks=estimated_weeks)).date().isoformat()}",
    "weekly_plan": [
      {{
        "week": 1,
        "focus": "Phase 1: {learning_phases[0].get('title', 'Unknown') if learning_phases else 'Start'}",
        "phase": 1,
        "total_hours": {hours_per_week},
        "activities": [
          {{"activity": "Study phase concepts", "type": "study", "duration_hours": 4, "concepts": ["concept1", "concept2"]}},
          {{"activity": "Practice exercises", "type": "practice", "duration_hours": 3}},
          {{"activity": "Project work", "type": "project", "duration_hours": 2}},
          {{"activity": "Review", "type": "review", "duration_hours": 1}}
        ]
      }},
      {{
        "week": 2,
        "focus": "Continue Phase 1",
        "phase": 1,
        "total_hours": {hours_per_week},
        "activities": [
          {{"activity": "Complete phase 1 concepts", "type": "study", "duration_hours": 5}},
          {{"activity": "Hands-on practice", "type": "practice", "duration_hours": 4}},
          {{"activity": "Review and assessment", "type": "review", "duration_hours": 1}}
        ]
      }}
    ],
    "review_cycles": [
      {{"week": 3, "type": "phase", "topics": ["Phase 1 review"], "duration_hours": 2}},
      {{"week": 6, "type": "midterm", "topics": ["Comprehensive review"], "duration_hours": 3}},
      {{"week": {estimated_weeks}, "type": "final", "topics": ["Complete course review"], "duration_hours": 4}}
    ],
    "project_timeline": [
      {{"milestone": "Setup", "week": 1, "deliverable": "Environment setup", "estimated_hours": 2}},
      {{"milestone": "Implementation", "week": {estimated_weeks//2}, "deliverable": "Core features", "estimated_hours": 15}},
      {{"milestone": "Completion", "week": {estimated_weeks}, "deliverable": "Final project", "estimated_hours": 5}}
    ]
  }}
}}

CRITICAL: 
1. Create exactly {estimated_weeks} weekly plans
2. Distribute {len(learning_phases)} phases across weeks appropriately  
3. Each week must total {hours_per_week} hours
4. Keep JSON CONCISE - avoid long descriptions
5. Ensure valid JSON syntax

RESPOND WITH ONLY THE JSON."""

            # Get LLM response
            raw_response = await ollama_service.generate_response(prompt, temperature=self.temperature)
            logger.info(f"Raw LLM response for schedule generation: {raw_response[:300]}...")
            
            # Clean and parse JSON
            parsed_response = self._clean_and_parse_json(raw_response)
            
            # Validate response structure
            if not isinstance(parsed_response, dict):
                raise ValueError("LLM response is not a valid JSON object")
            
            if "learning_schedule" not in parsed_response:
                raise ValueError("Missing required key: learning_schedule")
            
            schedule = parsed_response["learning_schedule"]
            required_fields = [
                "total_duration_weeks", "hours_per_week", "start_date", 
                "end_date", "weekly_plan", "review_cycles", "project_timeline"
            ]
            
            for field in required_fields:
                if field not in schedule:
                    raise ValueError(f"Missing required field in learning_schedule: {field}")
            
            # Validate weekly plans structure
            if not isinstance(schedule["weekly_plan"], list) or len(schedule["weekly_plan"]) == 0:
                raise ValueError("Weekly plan must be a non-empty list")
            
            # Validate that we have the expected number of weeks
            expected_weeks = schedule["total_duration_weeks"]
            actual_weeks = len(schedule["weekly_plan"])
            if abs(actual_weeks - expected_weeks) > 1:  # Allow 1 week variance
                logger.warning(f"Week count mismatch: expected {expected_weeks}, got {actual_weeks}")
            
            # Validate activities structure
            total_scheduled_hours = 0
            for week in schedule["weekly_plan"]:
                week_hours = 0
                if "activities" in week and isinstance(week["activities"], list):
                    for activity in week["activities"]:
                        activity_hours = activity.get("duration_hours", 0)
                        week_hours += activity_hours
                        total_scheduled_hours += activity_hours
                
                # Log week summary
                week_num = week.get("week", "Unknown")
                focus = week.get("focus", "Unknown")
                logger.info(f"Week {week_num}: {focus} ({week_hours}h)")
            
            # Validate project timeline
            if not isinstance(schedule["project_timeline"], list):
                raise ValueError("Project timeline must be a list")
            
            # Add enriched metadata
            parsed_response["meta"] = {
                "generated_at": datetime.now().isoformat(),
                "planning_version": "2.0",
                "total_learning_hours": total_scheduled_hours,
                "content_hours": total_content_hours,
                "buffer_percentage": int(((total_scheduled_hours - total_content_hours) / total_content_hours) * 100) if total_content_hours > 0 else 20,
                "scheduling_method": "LLM with educational timing patterns",
                "user_constraints": constraints,
                "phase_count": len(learning_phases),
                "project_milestones": len(schedule["project_timeline"]),
                "review_points": len(schedule["review_cycles"])
            }
            
            logger.info(f"Successfully generated {actual_weeks}-week schedule with {total_scheduled_hours} total hours")
            logger.info(f"Schedule includes {len(schedule['project_timeline'])} project milestones and {len(schedule['review_cycles'])} review cycles")
            
            return parsed_response
            
        except Exception as e:
            logger.error(f"Error generating learning schedule: {e}")
            raise ValueError(f"Failed to generate learning schedule: {str(e)}")

    async def process(self, state: AgentState) -> AgentState:
        """Process state for learning schedule generation"""
        try:
            self.log_action(state, "Starting learning schedule generation with production agent")
            
            # Extract required data from state
            roadmap = state.data.get("roadmap", {})
            phases = roadmap.get("phases", [])
            course_project = state.data.get("course_project", {})
            user_constraints = state.data.get("user_constraints", {
                "hours_per_week": 10,
                "preferred_pace": "normal"
            })
            
            # Generate schedule asynchronously
            schedule_result = await self.generate_schedule(
                learning_phases=phases,
                course_project=course_project,
                user_constraints=user_constraints
            )
            
            # Store in state
            state.data["learning_schedule"] = schedule_result
            roadmap["learning_schedule"] = schedule_result["learning_schedule"]
            state.data["roadmap"] = roadmap
            
            schedule_duration = schedule_result["learning_schedule"]["total_duration_weeks"]
            self.log_action(state, f"Generated {schedule_duration}-week learning schedule")
            
            return state
            
        except Exception as e:
            logger.error(f"Error in schedule generation process: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
