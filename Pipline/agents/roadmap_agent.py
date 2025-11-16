from agents.base_agent import BaseAgent, AgentState
from typing import Dict, Any
import json

class RoadmapAgent(BaseAgent):
    """Main orchestrator agent that coordinates the roadmap generation process"""
    
    def __init__(self):
        super().__init__("RoadmapAgent", temperature=0.0, max_tokens=400)
    
    def get_system_prompt(self) -> str:
        return """You are RoadmapAgent — the orchestration controller. Your job: accept a /roadmap/start request and coordinate downstream agents to produce a complete roadmap document stored in roadmap_sessions.

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

Constraints: Fail fast on validation errors. Use deterministic outputs for IDs. Temperature 0.0."""
    
    def process(self, state: AgentState) -> AgentState:
        """Orchestrate the entire roadmap generation process"""
        try:
            self.log_action(state, "Starting roadmap generation process")
            
            # Validate input
            if not self.validate_input(state, ["user_id", "session_id"]):
                state.data["status"] = "failed"
                state.data["error"] = "Missing required fields"
                return state
            
            # Initialize roadmap data structure
            roadmap_data = {
                "session_id": state.session_id,
                "user_id": state.user_id,
                "status": "in_progress",
                "created_at": None,  # Would be set with actual timestamp
                "updated_at": None,
                "interview": {},
                "skill_evaluation": {},
                "concept_gaps": [],
                "prerequisite_graph": {},
                "ranked_materials": {},
                "difficulty_scores": [],
                "phases": {},
                "projects": [],
                "schedule": [],
                "progress": {"phase_status": {}, "percent_complete": 0.0},
                "meta": {"version": "roadmap_v3", "agent_logs": []}
            }
            
            state.data["roadmap"] = roadmap_data
            
            # Set workflow to proceed to interview
            state.data["next_agent"] = "InterviewAgent"
            state.data["status"] = "interview_pending"
            
            self.log_action(state, "Roadmap generation initiated", roadmap_data["session_id"])
            
            return state
            
        except Exception as e:
            self.logger.error(f"Error in roadmap generation: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
    
    def finalize_roadmap(self, state: AgentState) -> AgentState:
        """Finalize the roadmap after all agents have completed"""
        try:
            roadmap = state.data.get("roadmap", {})
            
            # Mark as completed
            roadmap["status"] = "completed"
            roadmap["meta"]["agent_logs"] = state.metadata.get("agent_logs", [])
            
            # Create final response
            response = {
                "session_id": state.session_id,
                "status": "completed",
                "roadmap": roadmap,
                "actions_log": state.metadata.get("agent_logs", [])
            }
            
            state.data["final_response"] = response
            self.log_action(state, "Roadmap generation completed")
            
            return state
            
        except Exception as e:
            self.logger.error(f"Error finalizing roadmap: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
