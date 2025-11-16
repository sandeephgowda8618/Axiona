from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

class AgentState(BaseModel):
    """Base state class for agents"""
    session_id: str
    user_id: str
    data: Dict[str, Any] = {}
    context: List[Dict[str, Any]] = []
    metadata: Dict[str, Any] = {}

class BaseAgent(ABC):
    """Base class for all agents in the system"""
    
    def __init__(self, agent_name: str, temperature: float = 0.0, max_tokens: int = 1000):
        self.agent_name = agent_name
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.logger = logging.getLogger(f"agents.{agent_name}")
    
    @abstractmethod
    def get_system_prompt(self) -> str:
        """Return the system prompt for this agent"""
        pass
    
    @abstractmethod
    def process(self, state: AgentState) -> AgentState:
        """Process the state and return updated state"""
        pass
    
    def log_action(self, state: AgentState, action: str, result: Any = None):
        """Log agent action"""
        log_entry = {
            "agent": self.agent_name,
            "action": action,
            "timestamp": None,  # Will be set by the framework
            "result_summary": str(result)[:100] if result else ""
        }
        
        if "agent_logs" not in state.metadata:
            state.metadata["agent_logs"] = []
        
        state.metadata["agent_logs"].append(log_entry)
        self.logger.info(f"Agent {self.agent_name}: {action}")
    
    def validate_input(self, state: AgentState, required_fields: List[str]) -> bool:
        """Validate that required fields are present in state"""
        for field in required_fields:
            if field not in state.data:
                self.logger.error(f"Missing required field: {field}")
                return False
        return True
    
    def call_llm(self, prompt: str, context: str = "") -> str:
        """Call the LLM with the given prompt and context"""
        # This would be implemented with your chosen LLM
        # For now, return a placeholder
        return f"LLM Response for {self.agent_name}: {prompt[:50]}..."
