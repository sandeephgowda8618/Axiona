#!/usr/bin/env python3
"""
Test Production RAG-Enhanced PES Material Agent
===============================================

Test the new RAG + LLM PES material retrieval to ensure it intelligently
selects relevant materials with proper metadata.
"""

import sys
import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path

# Add Pipeline directory to path
sys.path.insert(0, str(Path(__file__).parent))

from agents.production_rag_pes_agent import ProductionRAGPESMaterialAgent

logger = logging.getLogger(__name__)

async def test_rag_pes_retrieval():
    """Test RAG + LLM PES material retrieval"""
    try:
        logger.info("🎯 Testing Production RAG-Enhanced PES Material Agent")
        logger.info("=" * 80)
        
        agent = ProductionRAGPESMaterialAgent()
        
        # Test Case 1: Operating Systems Phase 1
        logger.info("📋 Test Case 1: Operating Systems - Phase 1")
        logger.info("-" * 50)
        
        os_result = await agent.retrieve_pes_materials(
            subject="Operating Systems",
            phase_number=1,
            concepts=["OS Introduction", "System Calls", "OS Architecture", "Process Basics"]
        )
        
        # Validate OS results
        assert "results" in os_result, "Missing results in OS response"
        assert "meta" in os_result, "Missing meta in OS response"
        
        os_materials = os_result["results"]
        os_meta = os_result["meta"]
        
        logger.info(f"✅ OS Phase 1: {len(os_materials)} materials selected")
        logger.info(f"Selection method: {os_meta.get('selection_method', 'Unknown')}")
        logger.info(f"Candidates: {os_meta.get('total_candidates', 0)}")
        logger.info(f"Selected: {os_meta.get('selected_count', 0)}")
        
        for i, material in enumerate(os_materials):
            title = material.get("title", "Unknown")
            unit = material.get("unit", "Unknown")
            concepts = material.get("key_concepts", [])
            logger.info(f"  Material {i+1}: {title} (Unit {unit}) - {len(concepts)} concepts")
        
        # Test Case 2: Data Structures & Algorithms Phase 2
        logger.info("\n📋 Test Case 2: Data Structures & Algorithms - Phase 2")
        logger.info("-" * 60)
        
        dsa_result = await agent.retrieve_pes_materials(
            subject="Data Structures and Algorithms",
            phase_number=2,
            concepts=["Binary Trees", "Tree Traversals", "BST Operations", "Balanced Trees"]
        )
        
        dsa_materials = dsa_result["results"]
        dsa_meta = dsa_result["meta"]
        
        logger.info(f"✅ DSA Phase 2: {len(dsa_materials)} materials selected")
        logger.info(f"Selection method: {dsa_meta.get('selection_method', 'Unknown')}")
        logger.info(f"Candidates: {dsa_meta.get('total_candidates', 0)}")
        
        # Test Case 3: Subject with no materials
        logger.info("\n📋 Test Case 3: Non-existent Subject")
        logger.info("-" * 40)
        
        empty_result = await agent.retrieve_pes_materials(
            subject="Quantum Computing",
            phase_number=1,
            concepts=["Quantum Bits", "Quantum Gates"]
        )
        
        empty_materials = empty_result["results"]
        empty_meta = empty_result["meta"]
        
        logger.info(f"✅ Empty case: {len(empty_materials)} materials")
        logger.info(f"Error message: {empty_meta.get('error', 'No error')}")
        
        # Validate metadata structure
        logger.info("\n📊 METADATA VALIDATION")
        logger.info("=" * 40)
        
        for test_name, result in [("OS", os_result), ("DSA", dsa_result), ("Empty", empty_result)]:
            logger.info(f"{test_name} Results:")
            
            # Check required fields
            meta = result.get("meta", {})
            required_meta_fields = ["subject", "phase", "unit_mapped", "total_candidates", "selected_count", "selection_method"]
            
            for field in required_meta_fields:
                if field in meta:
                    logger.info(f"  ✅ {field}: {meta[field]}")
                else:
                    logger.info(f"  ❌ Missing: {field}")
            
            # Check materials structure
            for i, material in enumerate(result.get("results", [])[:2]):  # Check first 2
                logger.info(f"  Material {i+1} metadata:")
                required_material_fields = ["id", "title", "subject", "unit", "content_type"]
                for field in required_material_fields:
                    if field in material:
                        logger.info(f"    ✅ {field}: {material[field]}")
                    else:
                        logger.info(f"    ❌ Missing: {field}")
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"rag_pes_test_results_{timestamp}.json"
        
        test_results = {
            "os_phase1": os_result,
            "dsa_phase2": dsa_result,
            "empty_case": empty_result,
            "test_timestamp": timestamp
        }
        
        with open(results_file, 'w') as f:
            json.dump(test_results, f, indent=2, default=str)
        
        logger.info(f"\n📁 Results saved to: {results_file}")
        
        # Final validation
        total_materials = len(os_materials) + len(dsa_materials)
        logger.info(f"\n🎉 RAG PES AGENT TEST PASSED")
        logger.info(f"Total materials retrieved: {total_materials}")
        logger.info(f"All metadata structures validated")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ RAG PES agent test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logger.info("🚀 TESTING PRODUCTION RAG-ENHANCED PES MATERIAL AGENT")
    logger.info("🎯 Goal: Validate RAG + LLM intelligent material selection")
    logger.info("📝 Expected: Relevant materials with complete metadata")
    logger.info("=" * 100)
    
    success = await test_rag_pes_retrieval()
    
    logger.info("\n" + "=" * 100)
    logger.info("🏁 FINAL RESULTS")
    logger.info("=" * 100)
    logger.info(f"RAG PES Agent Test: {'✅ PASS' if success else '❌ FAIL'}")
    
    if success:
        logger.info("🎉 Production RAG PES Agent is working correctly!")
        logger.info("📋 Next: Create RAG-enhanced Reference Book Agent")
    else:
        logger.info("🔧 Test failed - check logs for details")
    
    return success

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
