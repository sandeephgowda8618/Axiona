"""
JSON Response Utilities for LLM Agents
"""

import json
import re
import logging

logger = logging.getLogger(__name__)

def clean_json_response(response: str) -> str:
    """
    Clean LLM response to extract valid JSON
    
    Removes:
    - Markdown code blocks (```json ... ```)
    - Extra whitespace
    - Explanatory text before/after JSON
    """
    # Remove leading/trailing whitespace
    cleaned = response.strip()
    
    # Remove markdown code blocks
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    
    cleaned = cleaned.strip()
    
    # Try to extract JSON if there's extra text
    # Look for the first { and last }
    start_idx = cleaned.find("{")
    end_idx = cleaned.rfind("}") + 1
    
    if start_idx != -1 and end_idx > start_idx:
        cleaned = cleaned[start_idx:end_idx]
    
    return cleaned.strip()

def parse_llm_json_response(response: str, agent_name: str) -> dict:
    """
    Parse and validate LLM JSON response
    
    Args:
        response: Raw LLM response
        agent_name: Name of agent for error reporting
        
    Returns:
        Parsed JSON data
        
    Raises:
        ValueError: If JSON is invalid or missing
    """
    try:
        cleaned_response = clean_json_response(response)
        
        if not cleaned_response:
            raise ValueError(f"{agent_name}: Empty response from LLM")
        
        data = json.loads(cleaned_response)
        
        if not isinstance(data, dict):
            raise ValueError(f"{agent_name}: Response must be a JSON object, got {type(data)}")
        
        return data
        
    except json.JSONDecodeError as e:
        logger.error(f"{agent_name}: Invalid JSON response")
        logger.error(f"Raw response: {response[:300]}...")
        logger.error(f"Cleaned response: {clean_json_response(response)[:300]}...")
        raise ValueError(f"{agent_name}: Must return valid JSON. Error: {e}")
    
    except Exception as e:
        logger.error(f"{agent_name}: Error parsing response: {e}")
        raise
