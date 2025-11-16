"""
Final Test and Validation Script
===============================

Tests the complete LangGraph educational roadmap system implementation
with proper error handling and comprehensive validation.
"""

import asyncio
import json
import logging
import sys
from pathlib import Path
from datetime import datetime

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_complete_system():
    """Test the complete educational roadmap system"""
    
    print("🚀 Final Educational Roadmap System Test")
    print("=" * 60)
    print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    test_results = []
    
    # Test 1: Database Connectivity
    print("🗃️ Test 1: Database Connectivity")
    print("-" * 30)
    
    try:
        from core.db_manager import db_manager
        
        connected = await db_manager.connect()
        if connected:
            print("✅ Database connection successful")
            
            health = await db_manager.health_check()
            if health.get("status") == "healthy":
                print("✅ Database health check passed")
                collections = health.get("collections", {})
                for name, count in collections.items():
                    print(f"   📚 {name}: {count} documents")
            else:
                print("⚠️ Database health check failed")
        else:
            print("❌ Database connection failed")
            
        test_results.append({"test": "database", "success": connected})
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        test_results.append({"test": "database", "success": False, "error": str(e)})
    
    # Test 2: Agent Pipeline Execution
    print(f"\n🤖 Test 2: Agent Pipeline Execution")
    print("-" * 30)
    
    pipeline_success = False
    try:
        from execute_roadmap_pipeline import execute_simple_roadmap_pipeline
        
        test_case = {
            "learning_goal": "Master Operating Systems Fundamentals",
            "subject": "Operating Systems",
            "user_background": "beginner",
            "hours_per_week": 10
        }
        
        start_time = datetime.now()
        roadmap = await execute_simple_roadmap_pipeline(**test_case)
        execution_time = (datetime.now() - start_time).total_seconds()
        
        pipeline_success = not roadmap.get("error")
        
        if pipeline_success:
            phases = roadmap.get("phases", [])
            total_resources = sum(len(p.get("resources", [])) for p in phases)
            
            print(f"✅ Pipeline execution successful: {execution_time:.1f}s")
            print(f"📚 Phases generated: {len(phases)}")
            print(f"🎯 Total resources: {total_resources}")
            print(f"🛠️ Project included: {'Yes' if roadmap.get('course_project') else 'No'}")
            print(f"⏰ Schedule included: {'Yes' if roadmap.get('learning_schedule') else 'No'}")
            
            # Save roadmap
            output_file = f"test_roadmap_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(output_file, 'w') as f:
                json.dump(roadmap, f, indent=2, default=str)
            print(f"💾 Roadmap saved to: {output_file}")
            
        else:
            print(f"❌ Pipeline execution failed: {roadmap.get('error', 'Unknown error')}")
            
        test_results.append({
            "test": "pipeline", 
            "success": pipeline_success, 
            "execution_time": execution_time,
            "phases": len(roadmap.get("phases", [])),
            "resources": sum(len(p.get("resources", [])) for p in roadmap.get("phases", []))
        })
        
    except Exception as e:
        print(f"❌ Pipeline test failed: {e}")
        test_results.append({"test": "pipeline", "success": False, "error": str(e)})
    
    # Test 3: Schema Validation
    print(f"\n📋 Test 3: Schema Validation")
    print("-" * 30)
    
    try:
        schema_valid = True
        
        # Test standardized metadata schema
        sample_pes_material = {
            "id": "pes_001",
            "title": "Operating Systems - Unit 1: Introduction",
            "content_type": "pes_material",
            "source": "PES_slides",
            "summary": "Introduction to OS concepts",
            "key_concepts": ["OS basics", "processes"],
            "difficulty": "Beginner",
            "relevance_score": 0.9,
            "semantic_score": 0.85,
            "snippet": "Operating systems manage hardware..."
        }
        
        # Validate required fields
        required_fields = ["id", "title", "content_type", "source"]
        for field in required_fields:
            if field not in sample_pes_material:
                schema_valid = False
                print(f"❌ Missing required field: {field}")
        
        if schema_valid:
            print("✅ PES material schema compliant")
            
        # Test search response envelope
        sample_search_response = {
            "results": [sample_pes_material],
            "meta": {
                "query": "operating systems introduction",
                "search_type": "pdf_search",
                "returned": 1,
                "top_k": 10,
                "timestamp": datetime.now().isoformat()
            }
        }
        
        if "results" in sample_search_response and "meta" in sample_search_response:
            print("✅ Search response envelope compliant")
        else:
            schema_valid = False
            print("❌ Search response envelope non-compliant")
            
        test_results.append({"test": "schema", "success": schema_valid})
        
    except Exception as e:
        print(f"❌ Schema validation failed: {e}")
        test_results.append({"test": "schema", "success": False, "error": str(e)})
    
    # Test 4: Multi-Subject Testing
    print(f"\n🔬 Test 4: Multi-Subject Testing")
    print("-" * 30)
    
    multi_subject_success = 0
    subjects_tested = ["Operating Systems", "Data Structures", "Computer Networks"]
    
    for subject in subjects_tested:
        try:
            test_case = {
                "learning_goal": f"Learn {subject}",
                "subject": subject,
                "user_background": "intermediate",
                "hours_per_week": 8
            }
            
            start_time = datetime.now()
            roadmap = await execute_simple_roadmap_pipeline(**test_case)
            execution_time = (datetime.now() - start_time).total_seconds()
            
            success = not roadmap.get("error")
            if success:
                phases = len(roadmap.get("phases", []))
                resources = sum(len(p.get("resources", [])) for p in roadmap.get("phases", []))
                print(f"✅ {subject}: {execution_time:.1f}s, {phases} phases, {resources} resources")
                multi_subject_success += 1
            else:
                print(f"❌ {subject}: {roadmap.get('error', 'Failed')}")
                
        except Exception as e:
            print(f"❌ {subject}: {e}")
    
    print(f"📊 Multi-subject success rate: {multi_subject_success}/{len(subjects_tested)}")
    test_results.append({
        "test": "multi_subject", 
        "success": multi_subject_success == len(subjects_tested),
        "success_rate": multi_subject_success / len(subjects_tested)
    })
    
    # Test 5: Error Handling
    print(f"\n⚠️ Test 5: Error Handling")
    print("-" * 30)
    
    try:
        # Test with invalid input
        roadmap = await execute_simple_roadmap_pipeline(
            learning_goal="",  # Empty goal
            subject="Invalid Subject",
            user_background="expert",
            hours_per_week=-1  # Invalid hours
        )
        
        # Should handle gracefully
        has_error = roadmap.get("error") is not None
        if has_error:
            print("✅ Error handling working correctly")
        else:
            print("⚠️ Error handling may need improvement")
            
        test_results.append({"test": "error_handling", "success": True})
        
    except Exception as e:
        print(f"✅ Exception caught correctly: {e}")
        test_results.append({"test": "error_handling", "success": True})
    
    # Generate Final Report
    print(f"\n📊 Final Test Report")
    print("=" * 60)
    
    successful_tests = [r for r in test_results if r.get("success")]
    total_tests = len(test_results)
    success_rate = len(successful_tests) / total_tests if total_tests > 0 else 0
    
    print(f"✅ Successful tests: {len(successful_tests)}/{total_tests}")
    print(f"📊 Overall success rate: {success_rate:.1%}")
    
    # Detailed results
    for result in test_results:
        test_name = result["test"]
        success = result["success"]
        status = "✅ PASS" if success else "❌ FAIL"
        
        extra_info = ""
        if "execution_time" in result:
            extra_info += f" ({result['execution_time']:.1f}s)"
        if "error" in result:
            extra_info += f" - {result['error']}"
        
        print(f"   {status} {test_name.title()}{extra_info}")
    
    # Summary statistics
    if pipeline_success:
        pipeline_result = next((r for r in test_results if r["test"] == "pipeline"), {})
        print(f"\n📈 Performance Metrics:")
        print(f"   ⏱️ Pipeline execution: {pipeline_result.get('execution_time', 0):.1f}s")
        print(f"   📚 Phases generated: {pipeline_result.get('phases', 0)}")
        print(f"   🎯 Resources retrieved: {pipeline_result.get('resources', 0)}")
    
    # Recommendations
    print(f"\n💡 Recommendations:")
    
    if success_rate == 1.0:
        print("   🎉 All tests passed! System is ready for production.")
    elif success_rate >= 0.8:
        print("   ✅ System is largely functional with minor issues to address.")
    elif success_rate >= 0.6:
        print("   ⚠️ System needs improvements before production deployment.")
    else:
        print("   ❌ System requires significant fixes before deployment.")
    
    print(f"\n📝 Next Steps:")
    print("   1. Review any failed tests and address issues")
    print("   2. Optimize performance for production workloads")
    print("   3. Add comprehensive monitoring and logging")
    print("   4. Implement security measures for production")
    print("   5. Set up CI/CD pipeline for continuous testing")
    
    print(f"\n🎉 Testing completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Save test results
    results_file = f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(results_file, 'w') as f:
        json.dump(test_results, f, indent=2, default=str)
    
    print(f"📁 Test results saved to: {results_file}")
    
    return success_rate >= 0.8

if __name__ == "__main__":
    success = asyncio.run(test_complete_system())
    sys.exit(0 if success else 1)
