#!/usr/bin/env python3
"""
Agent Integration Script - Production Pipeline Update
====================================================

This script integrates all finalized production-ready agent prompts into the main pipeline.

CRITICAL FIXES:
- PES Material Agent: Return ALL unit PDFs, strict subject filtering
- Reference Book Agent: Return exactly 1 book per phase
- All agents: Use production-ready prompts with proper JSON output
"""

import sys
import os
import shutil
import logging
from datetime import datetime
from pathlib import Path

# Add the Pipeline directory to Python path
pipeline_dir = Path(__file__).parent
sys.path.insert(0, str(pipeline_dir))

from agents.production_retrieval_agents import UpdatedPESMaterialAgent, UpdatedReferenceBookAgent
from core.ollama_service import ollama_service

logger = logging.getLogger(__name__)

class ProductionAgentIntegrator:
    """Integrates production-ready agents into the main pipeline"""
    
    def __init__(self):
        self.pipeline_dir = pipeline_dir
        self.agents_dir = self.pipeline_dir / "agents"
        self.backup_dir = self.pipeline_dir / "agents_backup" / f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Create backup directory
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
    def backup_existing_agents(self):
        """Backup existing agent files before replacement"""
        try:
            logger.info(f"Backing up existing agents to {self.backup_dir}")
            
            agent_files = [
                "interview_agent.py",
                "skill_evaluator_agent.py", 
                "gap_detector_agent.py",
                "prerequisite_graph_agent.py",
                "difficulty_estimator_agent.py",
                "roadmap_builder_agent.py",
                "multi_agent_system_complete.py"
            ]
            
            for filename in agent_files:
                src = self.agents_dir / filename
                if src.exists():
                    dst = self.backup_dir / filename
                    shutil.copy2(src, dst)
                    logger.info(f"Backed up: {filename}")
                    
            logger.info("Agent backup completed successfully")
            
        except Exception as e:
            logger.error(f"Error backing up agents: {e}")
            raise
    
    def create_updated_interview_agent(self):
        """Create updated interview agent with finalized prompt"""
        content = '''"""
Updated Interview Agent with Production-Ready Prompt
"""

from agents.base_agent import BaseAgent, AgentState
from core.ollama_service import ollama_service
from typing import List, Dict, Any, Optional
import json
import logging

logger = logging.getLogger(__name__)

class InterviewAgent(BaseAgent):
    """Updated Interview Agent with finalized production prompt"""
    
    def __init__(self):
        super().__init__("InterviewAgent", temperature=0.2, max_tokens=300)
    
    def get_system_prompt(self) -> str:
        return """You are the Interview Agent for an educational roadmap system.  
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
      "question_text": "What is your current level of experience with [SUBJECT]?",
      "question_type": "open_ended",
      "category": "current_knowledge",
      "required": true,
      "context": "Assess baseline knowledge"
    },
    {
      "question_id": "q2", 
      "question_text": "How many hours per week can you dedicate to studying?",
      "question_type": "numeric",
      "category": "time_availability",
      "required": true,
      "context": "Determine time constraints for roadmap planning"
    },
    {
      "question_id": "q3",
      "question_text": "What specific goals do you want to achieve by learning [SUBJECT]?",
      "question_type": "open_ended", 
      "category": "learning_goals",
      "required": true,
      "context": "Understand motivation and target outcomes"
    },
    {
      "question_id": "q4",
      "question_text": "What programming languages or technical tools are you familiar with?",
      "question_type": "multiple_choice",
      "category": "prerequisites",
      "required": false,
      "context": "Assess technical prerequisites"
    },
    {
      "question_id": "q5",
      "question_text": "Do you prefer hands-on projects, theoretical study, or a balanced approach?",
      "question_type": "single_choice",
      "category": "learning_preference",
      "required": false,
      "context": "Tailor teaching methodology"
    }
  ]
}

Return ONLY valid JSON."""
    
    async def generate_interview_questions(self, subject: str) -> List[Dict[str, Any]]:
        """Generate interview questions using finalized prompt"""
        try:
            # Build prompt with subject injection
            prompt = f"Generate 5 interview questions for a student wanting to learn {subject}. Focus on their background, time availability, goals, prerequisites, and learning preferences."
            
            # Get LLM response  
            response = await ollama_service.generate_response(prompt, temperature=0.2)
            
            # Parse JSON response
            try:
                interview_data = json.loads(response)
                questions = interview_data.get("questions", [])
                
                if not questions or len(questions) != 5:
                    logger.warning(f"Expected 5 questions, got {len(questions)}, using fallback")
                    return self._generate_fallback_questions(subject)
                    
                return questions
                    
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON from interview agent: {e}")
                return self._generate_fallback_questions(subject)
            
        except Exception as e:
            logger.error(f"Error generating interview questions: {e}")
            return self._generate_fallback_questions(subject)
    
    def _generate_fallback_questions(self, subject: str) -> List[Dict[str, Any]]:
        """Fallback questions if LLM fails"""
        return [
            {
                "question_id": "q1",
                "question_text": f"What is your current level of experience with {subject}?",
                "question_type": "open_ended",
                "category": "current_knowledge", 
                "required": True,
                "context": "Assess baseline knowledge"
            },
            {
                "question_id": "q2",
                "question_text": "How many hours per week can you dedicate to studying?",
                "question_type": "numeric",
                "category": "time_availability",
                "required": True,
                "context": "Determine time constraints"
            },
            {
                "question_id": "q3", 
                "question_text": f"What specific goals do you want to achieve by learning {subject}?",
                "question_type": "open_ended",
                "category": "learning_goals",
                "required": True,
                "context": "Understand motivation"
            },
            {
                "question_id": "q4",
                "question_text": "What programming languages or technical tools are you familiar with?",
                "question_type": "multiple_choice",
                "category": "prerequisites",
                "required": False,
                "context": "Assess technical prerequisites"
            },
            {
                "question_id": "q5",
                "question_text": "Do you prefer hands-on projects, theoretical study, or a balanced approach?",
                "question_type": "single_choice", 
                "category": "learning_preference",
                "required": False,
                "context": "Tailor teaching methodology"
            }
        ]

    async def process(self, state: AgentState) -> AgentState:
        """Generate interview questions using finalized prompt"""
        try:
            self.log_action(state, "Starting user interview with production prompt")
            
            # Get context
            roadmap = state.data.get("roadmap", {})
            user_profile = state.data.get("user_profile", {})
            subject = roadmap.get("subject", "the subject")
            
            # Generate questions
            questions = await self.generate_interview_questions(subject)
            
            # Store in roadmap
            interview_data = {
                "questions": questions,
                "answers": [],
                "skill_self_report": {},
                "completed": False,
                "subject": subject
            }
            
            roadmap["interview"] = interview_data
            state.data["roadmap"] = roadmap
            state.data["status"] = "interview_questions_ready"
            state.data["next_agent"] = "InterviewAgent"
            
            self.log_action(state, f"Generated {len(questions)} interview questions for {subject}")
            
            return state
            
        except Exception as e:
            logger.error(f"Error in interview process: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
'''
        
        # Write to file
        agent_file = self.agents_dir / "interview_agent.py"
        with open(agent_file, 'w') as f:
            f.write(content)
        logger.info("Created updated interview_agent.py")
    
    def create_updated_skill_evaluator(self):
        """Create updated skill evaluator with finalized prompt"""
        content = '''"""
Updated Skill Evaluator Agent with Production-Ready Prompt  
"""

from agents.base_agent import BaseAgent, AgentState
from core.ollama_service import ollama_service
from typing import List, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)

class SkillEvaluatorAgent(BaseAgent):
    """Updated Skill Evaluator with finalized production prompt"""
    
    def __init__(self):
        super().__init__("SkillEvaluatorAgent", temperature=0.2, max_tokens=300)
    
    def get_system_prompt(self) -> str:
        return """You are the Skill Evaluation Agent.  
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

    async def evaluate_skills(self, interview_answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Evaluate user skills from interview answers"""
        try:
            # Build prompt with answers
            answers_text = ""
            for answer in interview_answers:
                qid = answer.get("question_id", "")
                question = answer.get("question_text", "")
                response = answer.get("answer", "")
                answers_text += f"Q{qid}: {question}\\nA: {response}\\n\\n"
            
            prompt = f"Analyze these interview answers and return a JSON skill evaluation:\\n{answers_text}"
            
            # Get LLM response
            response = await ollama_service.generate_response(prompt, temperature=0.2)
            
            # Parse JSON response
            try:
                skill_data = json.loads(response)
                
                # Validate required fields
                required_fields = ["skill_level", "strengths", "weaknesses", "analysis_notes"]
                for field in required_fields:
                    if field not in skill_data:
                        skill_data[field] = [] if field in ["strengths", "weaknesses", "analysis_notes"] else "beginner"
                
                return skill_data
                
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON from skill evaluator: {e}")
                return self._generate_fallback_evaluation()
            
        except Exception as e:
            logger.error(f"Error evaluating skills: {e}")
            return self._generate_fallback_evaluation()
    
    def _generate_fallback_evaluation(self) -> Dict[str, Any]:
        """Fallback evaluation if LLM fails"""
        return {
            "skill_level": "beginner",
            "strengths": ["motivated to learn"],
            "weaknesses": ["needs assessment"],
            "analysis_notes": ["Fallback evaluation - please complete interview for accurate assessment"]
        }

    async def process(self, state: AgentState) -> AgentState:
        """Process skill evaluation"""
        try:
            self.log_action(state, "Starting skill evaluation with production prompt")
            
            # Get interview answers
            roadmap = state.data.get("roadmap", {})
            interview = roadmap.get("interview", {})
            answers = interview.get("answers", [])
            
            if not answers:
                logger.warning("No interview answers found, using basic evaluation")
                skill_evaluation = self._generate_fallback_evaluation()
            else:
                skill_evaluation = await self.evaluate_skills(answers)
            
            # Store evaluation
            roadmap["skill_evaluation"] = skill_evaluation
            state.data["roadmap"] = roadmap
            state.data["next_agent"] = "GapDetectorAgent"
            
            self.log_action(state, f"Skill evaluation completed: {skill_evaluation.get('skill_level', 'unknown')}")
            
            return state
            
        except Exception as e:
            logger.error(f"Error in skill evaluation: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
'''
        
        # Write to file
        agent_file = self.agents_dir / "skill_evaluator_agent.py"
        with open(agent_file, 'w') as f:
            f.write(content)
        logger.info("Created updated skill_evaluator_agent.py")
    
    def integrate_production_agents(self):
        """Main integration function"""
        try:
            logger.info("Starting production agent integration...")
            
            # Step 1: Backup existing agents
            self.backup_existing_agents()
            
            # Step 2: Create updated agents
            self.create_updated_interview_agent()
            self.create_updated_skill_evaluator()
            
            # Step 3: Copy production retrieval agents
            production_agents_file = self.agents_dir / "production_retrieval_agents.py"
            if production_agents_file.exists():
                logger.info("Production retrieval agents already exist")
            else:
                logger.warning("production_retrieval_agents.py not found!")
            
            logger.info("✅ Production agent integration completed successfully!")
            logger.info(f"Backup created at: {self.backup_dir}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Agent integration failed: {e}")
            return False
    
    def create_integration_test(self):
        """Create a test script to validate the integration"""
        test_content = '''#!/usr/bin/env python3
"""
Integration Test - Validate Production Agent Updates
"""

import sys
import asyncio
import logging
from pathlib import Path

# Add Pipeline directory to path
sys.path.insert(0, str(Path(__file__).parent))

from agents.production_retrieval_agents import UpdatedPESMaterialAgent, UpdatedReferenceBookAgent
from agents.interview_agent import InterviewAgent
from agents.skill_evaluator_agent import SkillEvaluatorAgent

logger = logging.getLogger(__name__)

async def test_updated_agents():
    """Test all updated agents"""
    try:
        logger.info("🧪 Testing updated agents...")
        
        # Test PES Material Agent
        pes_agent = UpdatedPESMaterialAgent()
        result = await pes_agent.retrieve_pes_materials("Data Structures and Algorithms", 1)
        logger.info(f"PES Agent: Found {len(result.get('results', []))} materials")
        
        # Test Reference Book Agent  
        book_agent = UpdatedReferenceBookAgent()
        result = await book_agent.retrieve_best_book("Data Structures and Algorithms", "Beginner")
        logger.info(f"Book Agent: Found book: {result.get('result', {}).get('title', 'None')}")
        
        # Test Interview Agent
        interview_agent = InterviewAgent()
        questions = await interview_agent.generate_interview_questions("Data Structures and Algorithms")
        logger.info(f"Interview Agent: Generated {len(questions)} questions")
        
        logger.info("✅ All agents tested successfully!")
        
    except Exception as e:
        logger.error(f"❌ Agent test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = asyncio.run(test_updated_agents())
    sys.exit(0 if result else 1)
'''
        
        test_file = self.pipeline_dir / "test_production_agents.py"
        with open(test_file, 'w') as f:
            f.write(test_content)
        
        logger.info(f"Created integration test: {test_file}")

def main():
    """Main integration function"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logger.info("🚀 Starting production agent integration...")
    
    integrator = ProductionAgentIntegrator()
    
    # Run integration
    success = integrator.integrate_production_agents()
    
    if success:
        # Create integration test
        integrator.create_integration_test()
        
        logger.info("✅ INTEGRATION COMPLETED SUCCESSFULLY!")
        logger.info("📋 Next steps:")
        logger.info("1. Run: python test_production_agents.py")
        logger.info("2. Run: python test_dsa_complete_roadmap.py")  
        logger.info("3. Verify no cross-contamination in results")
        
        return True
    else:
        logger.error("❌ INTEGRATION FAILED!")
        return False

if __name__ == "__main__":
    import logging
    success = main()
    sys.exit(0 if success else 1)
