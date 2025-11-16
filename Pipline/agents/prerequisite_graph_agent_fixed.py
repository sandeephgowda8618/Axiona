"""
Fixed Prerequisite Graph Agent with Robust JSON Parsing
"""

from agents.base_agent import BaseAgent, AgentState
from core.ollama_service import ollama_service
from typing import List, Dict, Any
import json
import logging
import re

logger = logging.getLogger(__name__)

class PrerequisiteGraphAgent(BaseAgent):
    """Fixed Prerequisite Graph Agent with robust JSON parsing"""
    
    def __init__(self):
        super().__init__("PrerequisiteGraphAgent", temperature=0.3, max_tokens=800)
    
    def get_system_prompt(self) -> str:
        return """You are the Prerequisite Graph Agent.
Input: Subject and learning goals.
Output: JSON dependency graph with learning phases.

TASKS:
- Build learning dependency graph
- Create 4 progressive phases (Foundation → Core → Advanced → Expert)
- Define concept nodes and prerequisite relationships
- Ensure logical progression

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

    def extract_json(self, text: str) -> str:
        """Extract JSON from LLM response that might have markdown or extra text"""
        # Remove markdown code fences
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        
        # Find JSON object
        json_start = text.find('{')
        json_end = text.rfind('}') + 1
        
        if json_start >= 0 and json_end > json_start:
            return text[json_start:json_end]
        return text

    async def build_prerequisite_graph(self, subject: str, learning_goal: str, gaps: List[str]) -> Dict[str, Any]:
        """Build prerequisite graph using LLM"""
        try:
            user_prompt = f"""Build a prerequisite dependency graph for learning {learning_goal} in {subject}.

SUBJECT: {subject}
LEARNING GOAL: {learning_goal}
IDENTIFIED GAPS: {', '.join(gaps) if gaps else 'None'}

Create a 4-phase learning progression with:
- nodes: All key concepts needed
- edges: Dependencies between concepts (from prerequisite to dependent)
- learning_phases: 4 phases (Foundation → Core → Advanced → Expert)

Each phase should have 3-5 relevant concepts.
Ensure logical progression where later phases build on earlier ones.

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON.
- Do NOT add markdown fences like ```json or ```.
- Do NOT add introduction text.
- Do NOT add explanation after JSON.
- Output must begin with "{{" and end with "}}".

Required JSON format:
{{
  "nodes": ["concept1", "concept2", "concept3"],
  "edges": [
    {{"from": "concept1", "to": "concept2"}},
    {{"from": "concept2", "to": "concept3"}}
  ],
  "learning_phases": [
    {{
      "phase_id": 1,
      "title": "Foundation Phase",
      "concepts": ["concept1", "concept2"]
    }},
    {{
      "phase_id": 2,
      "title": "Core Phase", 
      "concepts": ["concept3", "concept4"]
    }},
    {{
      "phase_id": 3,
      "title": "Advanced Phase",
      "concepts": ["concept5", "concept6"]
    }},
    {{
      "phase_id": 4,
      "title": "Expert Phase",
      "concepts": ["concept7", "concept8"]
    }}
  ]
}}"""
            
            # Get LLM response
            response = await ollama_service.generate_response(user_prompt, temperature=0.3)
            
            # Parse JSON response with robust extraction
            try:
                clean_response = self.extract_json(response)
                graph_data = json.loads(clean_response)
                
                # Validate required fields
                required_fields = ["nodes", "edges", "learning_phases"]
                for field in required_fields:
                    if field not in graph_data:
                        raise ValueError(f"Missing required field: {field}")
                
                # Validate data types
                if not isinstance(graph_data["nodes"], list):
                    raise ValueError("nodes must be a list")
                if not isinstance(graph_data["edges"], list):
                    raise ValueError("edges must be a list")
                if not isinstance(graph_data["learning_phases"], list):
                    raise ValueError("learning_phases must be a list")
                    
                # Validate learning phases
                if len(graph_data["learning_phases"]) < 4:
                    logger.warning("Less than 4 learning phases generated, adding defaults")
                    while len(graph_data["learning_phases"]) < 4:
                        phase_id = len(graph_data["learning_phases"]) + 1
                        graph_data["learning_phases"].append({
                            "phase_id": phase_id,
                            "title": f"Phase {phase_id}",
                            "concepts": []
                        })
                
                return graph_data
                
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON from prerequisite graph: {e}")
                logger.error(f"LLM Response: {response[:500]}...")
                # Return fallback structure
                return {
                    "nodes": ["basics", "intermediate", "advanced", "expert"],
                    "edges": [
                        {"from": "basics", "to": "intermediate"},
                        {"from": "intermediate", "to": "advanced"},
                        {"from": "advanced", "to": "expert"}
                    ],
                    "learning_phases": [
                        {"phase_id": 1, "title": "Foundation", "concepts": ["basics"]},
                        {"phase_id": 2, "title": "Core", "concepts": ["intermediate"]},
                        {"phase_id": 3, "title": "Advanced", "concepts": ["advanced"]},
                        {"phase_id": 4, "title": "Expert", "concepts": ["expert"]}
                    ]
                }
            
        except Exception as e:
            logger.error(f"Error building prerequisite graph: {e}")
            # Return fallback structure
            return {
                "nodes": ["fundamentals", "core_concepts", "advanced_topics", "expert_level"],
                "edges": [
                    {"from": "fundamentals", "to": "core_concepts"},
                    {"from": "core_concepts", "to": "advanced_topics"},
                    {"from": "advanced_topics", "to": "expert_level"}
                ],
                "learning_phases": [
                    {"phase_id": 1, "title": "Foundation", "concepts": ["fundamentals"]},
                    {"phase_id": 2, "title": "Core", "concepts": ["core_concepts"]},
                    {"phase_id": 3, "title": "Advanced", "concepts": ["advanced_topics"]},
                    {"phase_id": 4, "title": "Expert", "concepts": ["expert_level"]}
                ]
            }

    async def process(self, state: AgentState) -> AgentState:
        """Process prerequisite graph generation"""
        try:
            self.log_action(state, "Starting prerequisite graph generation with LLM")
            
            # Get input data
            roadmap = state.data.get("roadmap", {})
            subject = roadmap.get("subject", "Unknown")
            learning_goal = roadmap.get("learning_goal", "general mastery")
            
            # Get gaps from skill evaluation or use empty list
            skill_evaluation = roadmap.get("skill_evaluation", {})
            gaps = skill_evaluation.get("weaknesses", [])
            
            # Build prerequisite graph
            graph = await self.build_prerequisite_graph(subject, learning_goal, gaps)
            
            # Store results
            roadmap["prerequisite_graph"] = graph
            state.data["roadmap"] = roadmap
            
            phases = graph.get("learning_phases", [])
            self.log_action(state, f"Prerequisite graph completed: {len(phases)} phases, {len(graph.get('nodes', []))} concepts")
            
        except Exception as e:
            logger.error(f"Error in prerequisite graph generation: {e}")
            raise
        
        return state
