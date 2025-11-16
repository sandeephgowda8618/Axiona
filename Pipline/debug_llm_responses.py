"""
Debug LLM Responses
==================

Quick script to debug and test LLM response parsing
"""

import asyncio
import json
import sys
import re
from pathlib import Path

# Add path for imports
current_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(current_dir))

async def test_llm_responses():
    """Test LLM response parsing"""
    
    # Import working system components
    from working_system import SimpleOllamaService, extract_json_from_response
    
    ollama = SimpleOllamaService()
    
    # Test interview prompt
    interview_prompt = """
    Generate exactly 5 interview questions in JSON format for educational assessment.
    
    Subject: Operating Systems
    Learning Goal: Master Operating Systems Fundamentals
    
    Return ONLY a JSON object with this structure:
    {
        "questions": [
            {
                "question_id": "string",
                "question_text": "string", 
                "question_type": "string",
                "category": "string",
                "required": boolean,
                "context": "string"
            }
        ]
    }
    """
    
    print("🎯 Testing Interview Agent LLM Response...")
    print("=" * 60)
    
    response = await ollama.generate_response(interview_prompt)
    print("RAW RESPONSE:")
    print("-" * 40)
    print(response)
    print("-" * 40)
    
    parsed = await extract_json_from_response(response)
    print("\nPARSED JSON:")
    print("-" * 40) 
    print(json.dumps(parsed, indent=2))
    print("-" * 40)
    
    # Test prerequisite graph prompt
    graph_prompt = """
    Create a prerequisite dependency graph for learning Operating Systems in JSON format.
    
    Return ONLY a JSON object with this structure:
    {
        "nodes": ["concept1", "concept2"],
        "edges": [{"from": "concept1", "to": "concept2"}],
        "learning_phases": [
            {
                "phase_id": 1,
                "title": "Phase Title",
                "concepts": ["concept1"],
                "difficulty": "beginner"
            }
        ]
    }
    """
    
    print("\n\n🗺️ Testing Prerequisite Graph Agent LLM Response...")
    print("=" * 60)
    
    response = await ollama.generate_response(graph_prompt)
    print("RAW RESPONSE:")
    print("-" * 40)
    print(response)
    print("-" * 40)
    
    parsed = await extract_json_from_response(response)
    print("\nPARSED JSON:")
    print("-" * 40)
    print(json.dumps(parsed, indent=2))
    print("-" * 40)

if __name__ == "__main__":
    asyncio.run(test_llm_responses())
