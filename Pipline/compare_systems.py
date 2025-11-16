"""
Comparison Test - Final vs Working System
========================================

Compare the LLM responses between final system and working system to identify
why the working system isn't extracting phases properly.
"""

import asyncio
import json
import sys
from pathlib import Path

# Add path
sys.path.append(str(Path(__file__).parent))

async def test_llm_comparison():
    """Test LLM responses for prerequisite graph in both systems"""
    
    print("🔍 Testing LLM Response Comparison")
    print("=" * 50)
    
    # Test 1: Final system agent
    try:
        from execute_roadmap_pipeline import execute_simple_roadmap_pipeline
        
        print("\n🎯 Testing Final System Pipeline...")
        result = await execute_simple_roadmap_pipeline(
            learning_goal="Master Operating Systems Fundamentals",
            subject="Operating Systems",
            user_background="beginner", 
            hours_per_week=10
        )
        
        phases = result.get("phases", [])
        print(f"✅ Final system phases: {len(phases)}")
        if phases:
            print(f"   First phase: {phases[0].get('phase_title', 'N/A')}")
            print(f"   Concepts: {phases[0].get('concepts', [])}")
        
    except Exception as e:
        print(f"❌ Final system failed: {e}")
    
    # Test 2: Working system agent
    try:
        from working_system_v2 import execute_working_roadmap_pipeline
        
        print("\n🎯 Testing Working System Pipeline...")
        result = await execute_working_roadmap_pipeline(
            learning_goal="Master Operating Systems Fundamentals",
            subject="Operating Systems",
            user_background="beginner",
            hours_per_week=10
        )
        
        phases = result.get("phases", [])
        print(f"✅ Working system phases: {len(phases)}")
        if phases:
            print(f"   First phase: {phases[0].get('phase_title', 'N/A')}")
            print(f"   Concepts: {phases[0].get('concepts', [])}")
            
        # Check raw prerequisite graph data
        prereq_graph = result.get("prerequisite_graph", {})
        learning_phases = prereq_graph.get("learning_phases", [])
        print(f"🗺️ Raw learning phases: {len(learning_phases)}")
        if learning_phases:
            print(f"   Raw phase 1: {learning_phases[0]}")
        
    except Exception as e:
        print(f"❌ Working system failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_llm_comparison())
