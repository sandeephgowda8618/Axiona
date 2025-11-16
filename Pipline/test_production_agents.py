#!/usr/bin/env python3
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
        result = await pes_agent.retrieve_pes_materials("Data Structures & Algorithms", 3)  # Use Unit 3 which exists
        logger.info(f"PES Agent: Found {len(result.get('results', []))} materials")
        
        # Test Reference Book Agent  
        book_agent = UpdatedReferenceBookAgent()
        result = await book_agent.retrieve_best_book("Data Structures & Algorithms", "Beginner")
        logger.info(f"Book Agent: Found book: {result.get('result', {}).get('title', 'None') if result.get('result') else 'None'}")
        
        # Test Interview Agent
        interview_agent = InterviewAgent()
        questions = await interview_agent.generate_interview_questions("Data Structures & Algorithms")
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
