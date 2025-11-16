"""
JSON Utilities for MongoDB Integration
====================================

Handles ObjectId serialization and other MongoDB-specific JSON issues.
"""

import json
import re
from typing import Any, Dict, List, Union
from bson import ObjectId
from datetime import datetime


def stringify_ids(obj: Any) -> Any:
    """
    Recursively convert all ObjectId instances to strings for JSON serialization.
    
    Args:
        obj: Any object that may contain ObjectIds (dict, list, ObjectId, etc.)
        
    Returns:
        The same object structure with all ObjectIds converted to strings
    """
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {k: stringify_ids(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [stringify_ids(i) for i in obj]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    else:
        return obj


class EnhancedJSONEncoder(json.JSONEncoder):
    """
    Custom JSON encoder that handles MongoDB ObjectIds and datetime objects.
    
    Usage:
        json.dumps(data, cls=EnhancedJSONEncoder, indent=2)
    """
    
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def safe_json_dump(obj: Any, file_path: str, indent: int = 2) -> bool:
    """
    Safely dump an object to JSON file, handling ObjectIds and other serialization issues.
    
    Args:
        obj: Object to serialize
        file_path: Path to output JSON file
        indent: JSON formatting indent
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Clean the object first
        clean_obj = stringify_ids(obj)
        
        # Write to file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(clean_obj, f, indent=indent, ensure_ascii=False)
        
        return True
        
    except Exception as e:
        print(f"JSON serialization error: {e}")
        return False


def safe_json_dumps(obj: Any, indent: int = 2) -> str:
    """
    Safely serialize an object to JSON string, handling ObjectIds.
    
    Args:
        obj: Object to serialize
        indent: JSON formatting indent
        
    Returns:
        JSON string or empty string if serialization fails
    """
    try:
        clean_obj = stringify_ids(obj)
        return json.dumps(clean_obj, indent=indent, ensure_ascii=False)
    except Exception as e:
        print(f"JSON serialization error: {e}")
        return "{}"


def validate_json_serializable(obj: Any) -> tuple[bool, str]:
    """
    Check if an object can be JSON serialized and return any issues.
    
    Args:
        obj: Object to check
        
    Returns:
        Tuple of (is_serializable, error_message)
    """
    try:
        json.dumps(obj, cls=EnhancedJSONEncoder)
        return True, "OK"
    except Exception as e:
        return False, str(e)


# Convenience functions for common use cases
def clean_mongodb_result(result: Union[Dict, List]) -> Union[Dict, List]:
    """Clean a MongoDB query result for JSON serialization"""
    return stringify_ids(result)


def prepare_api_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare a dictionary for API JSON response"""
    return stringify_ids(data)


def clean_and_parse_llm_json(text: str) -> dict:
    """
    Clean and parse JSON from LLM responses that may contain markdown formatting.
    
    Args:
        text: Raw text response from LLM that may contain JSON
        
    Returns:
        Parsed JSON dictionary
        
    Raises:
        json.JSONDecodeError: If no valid JSON can be extracted
    """
    if not text:
        raise json.JSONDecodeError("Empty text", "", 0)
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    # Try to extract JSON from markdown code blocks
    # Pattern 1: ```json ... ```
    json_pattern_1 = r'```json\s*(.*?)\s*```'
    match = re.search(json_pattern_1, text, re.DOTALL | re.IGNORECASE)
    if match:
        json_str = match.group(1).strip()
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            pass
    
    # Pattern 2: ``` ... ``` (generic code blocks)
    json_pattern_2 = r'```\s*(.*?)\s*```'
    match = re.search(json_pattern_2, text, re.DOTALL)
    if match:
        json_str = match.group(1).strip()
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            pass
    
    # Pattern 3: Look for JSON-like content starting with { or [
    json_pattern_3 = r'(\{.*\}|\[.*\])'
    match = re.search(json_pattern_3, text, re.DOTALL)
    if match:
        json_str = match.group(1).strip()
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            pass
    
    # Pattern 4: Try to parse the entire text as JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Pattern 5: Look for content between "Here is" and end of useful content
    lines = text.split('\n')
    json_content = []
    in_json = False
    
    for line in lines:
        line = line.strip()
        if line.startswith('{') or line.startswith('['):
            in_json = True
        
        if in_json:
            json_content.append(line)
            
        if in_json and (line.endswith('}') or line.endswith(']')):
            break
    
    if json_content:
        try:
            json_str = '\n'.join(json_content)
            return json.loads(json_str)
        except json.JSONDecodeError:
            pass
    
    raise json.JSONDecodeError(f"Could not extract valid JSON from text: {text[:200]}...", "", 0)
