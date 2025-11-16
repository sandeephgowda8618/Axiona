"""
Production Project Generator Agent
==================================

This agent generates comprehensive course-level projects based on learning goals using
finalized LLM prompts with strict schema validation. No hardcoded fallbacks.

Created: November 16, 2025
Purpose: Replace hardcoded project generation with pure LLM-driven approach
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from agents.base_agent import BaseAgent, AgentState
from core.ollama_service import ollama_service

logger = logging.getLogger(__name__)

class ProductionProjectGeneratorAgent(BaseAgent):
    """Production-ready Project Generator Agent with finalized LLM prompts"""
    
    def __init__(self):
        super().__init__("ProductionProjectGeneratorAgent", temperature=0.3, max_tokens=2000)
        
    def get_system_prompt(self) -> str:
        return """You are the Project Generator Agent.

INPUT:
- learning_goal (e.g., "Operating Systems")
- skill_level (Beginner/Intermediate/Advanced)
- prerequisite_graph (learning dependencies)
- phases_content (learning phases with concepts)

TASK:
Generate a comprehensive, practical course project that integrates all learned concepts across phases.
The project must be realistic, achievable, and appropriately scoped for the skill level.

PROJECT DESIGN PRINCIPLES:
1. INTEGRATION: Connect concepts from all learning phases
2. PROGRESSION: Build complexity across phases/milestones
3. PRACTICALITY: Real-world applicable skills
4. ASSESSMENT: Clear evaluation criteria and deliverables
5. TIME-BOXED: Realistic time estimates for each component

DELIVERABLES BY TYPE:
- CODE: Implementation projects (web apps, algorithms, systems)
- REPORT: Technical analysis, research papers, documentation
- PRESENTATION: Demonstrations, explanations, teaching others
- DEMO: Working prototypes, proof-of-concepts

RETURN JSON ONLY:
{
  "course_project": {
    "title": "Building a Multi-Process Operating System Simulator",
    "description": "Design and implement a simplified OS simulator that demonstrates process management, memory allocation, file systems, and scheduling algorithms learned throughout the course.",
    "objectives": [
      "Apply process scheduling algorithms in a working system",
      "Implement memory management techniques",
      "Design file system operations",
      "Demonstrate understanding of OS architecture"
    ],
    "difficulty": "Intermediate",
    "estimated_time_hours": 40,
    "deliverables": [
      {
        "name": "System Architecture Document", 
        "type": "report",
        "description": "Technical specification of OS simulator components and design decisions",
        "due_phase": 2,
        "estimated_hours": 6
      },
      {
        "name": "Core Simulator Implementation",
        "type": "code", 
        "description": "Working OS simulator with process, memory, and file management",
        "due_phase": 3,
        "estimated_hours": 25
      },
      {
        "name": "Performance Analysis Report",
        "type": "report",
        "description": "Analysis of different scheduling algorithms and memory allocation strategies",
        "due_phase": 4,
        "estimated_hours": 5
      },
      {
        "name": "Final Demonstration",
        "type": "demo",
        "description": "Live demonstration of OS simulator with explanation of key features",
        "due_phase": 4,
        "estimated_hours": 4
      }
    ],
    "technical_requirements": [
      {
        "requirement": "Programming language (C/C++/Python)",
        "category": "programming"
      },
      {
        "requirement": "Understanding of data structures",
        "category": "knowledge"
      },
      {
        "requirement": "Development environment setup",
        "category": "tools"
      }
    ],
    "milestones": [
      {
        "milestone": "Project Setup & Planning",
        "description": "Define project scope, set up development environment, create initial design",
        "phase": 1,
        "estimated_hours": 4
      },
      {
        "milestone": "Basic Process Management",
        "description": "Implement process creation, scheduling, and basic IPC mechanisms",
        "phase": 2, 
        "estimated_hours": 12
      },
      {
        "milestone": "Memory & File Systems",
        "description": "Add memory allocation algorithms and basic file system operations",
        "phase": 3,
        "estimated_hours": 15
      },
      {
        "milestone": "Integration & Testing",
        "description": "Integrate all components, perform testing, optimize performance",
        "phase": 4,
        "estimated_hours": 9
      }
    ],
    "assessment_criteria": [
      {
        "criterion": "Technical Implementation",
        "weight": 0.4,
        "description": "Quality of code, algorithm correctness, system functionality"
      },
      {
        "criterion": "Concept Integration",
        "weight": 0.3,
        "description": "How well the project demonstrates understanding of OS concepts"
      },
      {
        "criterion": "Documentation & Analysis",
        "weight": 0.2,
        "description": "Quality of technical documentation and performance analysis"
      },
      {
        "criterion": "Presentation & Demo", 
        "weight": 0.1,
        "description": "Clarity of explanation and quality of demonstration"
      }
    ],
    "resource_allocation": {
      "phase_1_focus": "Project planning and basic concepts",
      "phase_2_focus": "Core implementation of processes and scheduling", 
      "phase_3_focus": "Memory management and file systems",
      "phase_4_focus": "Integration, optimization, and presentation"
    }
  },
  "meta": {
    "generated_at": "2025-11-16T10:30:00Z",
    "learning_goal": "Operating Systems",
    "target_level": "Intermediate",
    "generation_method": "LLM with educational project patterns",
    "total_phases": 4,
    "total_deliverables": 4
  }
}

CRITICAL RULES:
- Projects must be REALISTIC and achievable within the estimated time
- Integrate ALL major concepts from the learning phases
- Include progressive milestones that build upon each other  
- Provide specific, measurable assessment criteria
- Ensure deliverables map to phases appropriately
- Use practical, industry-relevant project types
- NO generic or template-like projects

Return ONLY JSON."""

    def _clean_and_parse_json(self, response: str) -> dict:
        """Clean and parse JSON response from LLM"""
        try:
            import json
            import re
            
            logger.info(f"Cleaning LLM response. Original length: {len(response)}")
            
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
            
            # Try to find JSON object boundaries more aggressively
            # Look for the outermost { } pair
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
            logger.info("Successfully parsed JSON response")
            return parsed
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            logger.error(f"Problematic text around error: {cleaned[max(0, e.pos-50):e.pos+50]}")
            return {}
        except Exception as e:
            logger.error(f"JSON parsing error: {e}")
            return {}

    async def generate_course_project(
        self,
        learning_goal: str,
        skill_level: str,
        prerequisite_graph: Dict[str, Any],
        phases_content: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive course project using LLM
        
        Args:
            learning_goal: Subject area (e.g., "Operating Systems")
            skill_level: Beginner/Intermediate/Advanced
            prerequisite_graph: Learning dependencies
            phases_content: Learning phases with concepts
            
        Returns:
            Dict with course project details and metadata
        """
        try:
            logger.info(f"Generating course project for {learning_goal} at {skill_level} level")
            
            # Build comprehensive prompt with context and explicit JSON instruction
            prompt = f"""You MUST return ONLY a valid JSON response. Do not include any markdown, explanations, or formatting - just pure JSON.

Generate a comprehensive course project for:

Learning Goal: {learning_goal}
Skill Level: {skill_level}

Prerequisite Graph:
{json.dumps(prerequisite_graph, indent=2)}

Learning Phases with Concepts:
{json.dumps(phases_content, indent=2)}

RETURN ONLY THIS JSON STRUCTURE (replace example content with real data):
{{
  "course_project": {{
    "title": "Real project title here",
    "description": "Real detailed description here", 
    "objectives": ["Real objective 1", "Real objective 2", "Real objective 3"],
    "difficulty": "{skill_level}",
    "estimated_time_hours": 40,
    "deliverables": [
      {{
        "name": "Deliverable name", 
        "type": "code",
        "description": "Deliverable description",
        "due_phase": 2,
        "estimated_hours": 10
      }}
    ],
    "technical_requirements": [
      {{
        "requirement": "Requirement text",
        "category": "programming"
      }}
    ],
    "milestones": [
      {{
        "milestone": "Milestone name",
        "description": "Milestone description",
        "phase": 1,
        "estimated_hours": 8
      }}
    ],
    "assessment_criteria": [
      {{
        "criterion": "Criterion name",
        "weight": 0.4,
        "description": "How this will be assessed"
      }}
    ]
  }},
  "meta": {{
    "generated_at": "{datetime.now().isoformat()}",
    "learning_goal": "{learning_goal}",
    "target_level": "{skill_level}",
    "generation_method": "LLM with educational project patterns",
    "total_phases": {len(phases_content)}
  }}
}}

Requirements:
1. Integrate concepts from ALL phases: {[p.get('concepts', []) for p in phases_content]}
2. Match {skill_level} difficulty level  
3. Include 3-5 deliverables across different phases
4. Include 4-6 milestones that build upon each other
5. Assessment criteria weights must sum to 1.0
6. Realistic time estimates and practical implementation

RESPOND WITH ONLY THE JSON - NO MARKDOWN, NO EXPLANATIONS."""

            # Get LLM response using ollama_service instead of BaseAgent method
            raw_response = await ollama_service.generate_response(prompt, temperature=self.temperature)
            logger.info(f"Raw LLM response for project generation: {raw_response[:300]}...")
            
            # Clean and parse JSON
            parsed_response = self._clean_and_parse_json(raw_response)
            
            # Validate response structure
            if not isinstance(parsed_response, dict):
                raise ValueError("LLM response is not a valid JSON object")
            
            if "course_project" not in parsed_response:
                raise ValueError("Missing required key: course_project")
            
            project = parsed_response["course_project"]
            required_fields = [
                "title", "description", "objectives", "difficulty", 
                "estimated_time_hours", "deliverables", "milestones", 
                "assessment_criteria"
            ]
            
            for field in required_fields:
                if field not in project:
                    raise ValueError(f"Missing required field in course_project: {field}")
            
            # Validate deliverables structure
            if not isinstance(project["deliverables"], list) or len(project["deliverables"]) == 0:
                raise ValueError("Deliverables must be a non-empty list")
            
            for deliverable in project["deliverables"]:
                required_del_fields = ["name", "type", "description", "due_phase"]
                for field in required_del_fields:
                    if field not in deliverable:
                        raise ValueError(f"Missing required field in deliverable: {field}")
            
            # Validate milestones structure
            if not isinstance(project["milestones"], list) or len(project["milestones"]) == 0:
                raise ValueError("Milestones must be a non-empty list")
            
            # Validate assessment criteria
            if not isinstance(project["assessment_criteria"], list) or len(project["assessment_criteria"]) == 0:
                raise ValueError("Assessment criteria must be a non-empty list")
            
            # Ensure total weight of assessment criteria is approximately 1.0
            total_weight = sum(criterion.get("weight", 0) for criterion in project["assessment_criteria"])
            if abs(total_weight - 1.0) > 0.1:  # Allow small floating point differences
                logger.warning(f"Assessment criteria weights sum to {total_weight}, not 1.0")
            
            # Add enriched metadata
            parsed_response["meta"] = {
                "generated_at": datetime.now().isoformat(),
                "learning_goal": learning_goal,
                "target_level": skill_level,
                "generation_method": "LLM with educational project patterns",
                "total_phases": len(phases_content),
                "total_deliverables": len(project["deliverables"]),
                "total_milestones": len(project["milestones"]),
                "estimated_weeks": round(project["estimated_time_hours"] / 10),  # Assuming 10 hrs/week
                "prerequisite_count": len(prerequisite_graph.get("prerequisites", []))
            }
            
            logger.info(f"Successfully generated project: {project['title']}")
            logger.info(f"Project details: {len(project['deliverables'])} deliverables, {project['estimated_time_hours']} hours")
            
            return parsed_response
            
        except Exception as e:
            logger.error(f"Error generating course project: {e}")
            raise ValueError(f"Failed to generate course project: {str(e)}")

    async def process(self, state: AgentState) -> AgentState:
        """Process state for course project generation"""
        try:
            self.log_action(state, "Starting course project generation with production agent")
            
            # Extract required data from state
            roadmap = state.data.get("roadmap", {})
            learning_goal = roadmap.get("subject", state.data.get("learning_goal", "Unknown Subject"))
            skill_level = roadmap.get("difficulty", state.data.get("skill_level", "Intermediate"))
            prerequisite_graph = state.data.get("prerequisite_graph", {})
            
            # Extract phases content
            phases = roadmap.get("phases", [])
            phases_content = []
            for phase in phases:
                phase_content = {
                    "phase_id": phase.get("phase_id"),
                    "title": phase.get("title"),
                    "concepts": phase.get("concepts", []),
                    "difficulty": phase.get("difficulty"),
                    "learning_objectives": phase.get("learning_objectives", [])
                }
                phases_content.append(phase_content)
            
            # Generate project asynchronously
            project_result = await self.generate_course_project(
                learning_goal, skill_level, prerequisite_graph, phases_content
            )
            
            # Store in state
            state.data["course_project"] = project_result
            roadmap["course_project"] = project_result["course_project"]
            state.data["roadmap"] = roadmap
            
            self.log_action(state, f"Generated course project: {project_result['course_project']['title']}")
            
            return state
            
        except Exception as e:
            logger.error(f"Error in project generation process: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
