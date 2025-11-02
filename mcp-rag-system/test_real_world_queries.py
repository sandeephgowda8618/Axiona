#!/usr/bin/env python3
"""
Real-World RAG Query Testing Script
Tests comprehensive, realistic educational queries across all collections
"""

import requests
import json
import time
from typing import List, Dict, Any

class RealWorldRAGTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.test_results = []
        
    def test_query(self, query: str, namespace: str = None, n_results: int = 3) -> Dict[str, Any]:
        """Test a single query and return results"""
        print(f"\n🔍 Testing Query: '{query}'")
        if namespace:
            print(f"   Namespace: {namespace}")
        
        try:
            # Prepare request
            if namespace:
                url = f"{self.base_url}/search/{namespace}"
            else:
                url = f"{self.base_url}/search"
            
            payload = {
                "query": query,
                "n_results": n_results
            }
            
            if not namespace:
                payload["namespace"] = "studymaterials"
            
            # Make request
            start_time = time.time()
            response = requests.post(url, json=payload, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                
                print(f"   ✅ Found {result.get('total_found', 0)} results in {response_time:.2f}s")
                
                # Display top results
                for i, res in enumerate(result.get('results', [])[:2]):
                    print(f"      📚 Result {i+1}: {res.get('metadata', {}).get('title', 'No title')}")
                    print(f"         Subject: {res.get('metadata', {}).get('subject', 'N/A')}")
                    print(f"         Relevance: {res.get('relevance_score', 0):.3f}")
                
                return {
                    "query": query,
                    "namespace": namespace or "studymaterials",
                    "success": True,
                    "results_count": result.get('total_found', 0),
                    "response_time": response_time,
                    "top_result": result.get('results', [{}])[0] if result.get('results') else {}
                }
            else:
                print(f"   ❌ Error: {response.status_code} - {response.text}")
                return {
                    "query": query,
                    "namespace": namespace or "studymaterials",
                    "success": False,
                    "error": f"{response.status_code}: {response.text}",
                    "response_time": response_time
                }
                
        except Exception as e:
            print(f"   ❌ Exception: {e}")
            return {
                "query": query,
                "namespace": namespace or "studymaterials",
                "success": False,
                "error": str(e),
                "response_time": 0
            }
    
    def run_comprehensive_tests(self):
        """Run comprehensive real-world educational queries"""
        
        print("🚀 STARTING REAL-WORLD RAG QUERY TESTING")
        print("="*60)
        
        # Test 1: Academic Subject Queries
        print("\n📚 CATEGORY 1: ACADEMIC SUBJECT QUERIES")
        print("-" * 40)
        
        academic_queries = [
            "machine learning algorithms and neural networks",
            "data structures linked lists arrays stacks queues",
            "database normalization first second third normal form",
            "operating systems process scheduling algorithms",
            "computer networks TCP IP protocols",
            "software engineering agile methodology",
            "automata theory finite state machines",
            "linear algebra matrices eigenvalues",
            "probability distributions normal gaussian",
            "web development HTML CSS JavaScript"
        ]
        
        for query in academic_queries:
            result = self.test_query(query, "studymaterials", 3)
            self.test_results.append(result)
        
        # Test 2: Video Content Queries
        print("\n🎥 CATEGORY 2: VIDEO LEARNING QUERIES")
        print("-" * 40)
        
        video_queries = [
            "python programming tutorial beginners",
            "data science pandas numpy tutorial",
            "algorithms sorting bubble merge quick",
            "database SQL queries joins",
            "machine learning supervised learning",
            "web development frontend backend"
        ]
        
        for query in video_queries:
            result = self.test_query(query, "videos", 3)
            self.test_results.append(result)
        
        # Test 3: Book and Reference Queries
        print("\n📖 CATEGORY 3: BOOK AND REFERENCE QUERIES")
        print("-" * 40)
        
        book_queries = [
            "introduction to algorithms Cormen textbook",
            "computer science fundamentals reference",
            "programming languages concepts design",
            "artificial intelligence modern approach",
            "data mining concepts techniques",
            "computer graphics rendering algorithms"
        ]
        
        for query in book_queries:
            result = self.test_query(query, "books", 3)
            self.test_results.append(result)
        
        # Test 4: Semester-Specific Queries
        print("\n🎓 CATEGORY 4: SEMESTER-SPECIFIC QUERIES")
        print("-" * 40)
        
        semester_queries = [
            ("semester 3 data structures algorithms", "studymaterials"),
            ("semester 4 operating systems memory management", "studymaterials"), 
            ("semester 5 machine learning supervised learning", "studymaterials"),
            ("semester 6 database management systems", "studymaterials")
        ]
        
        for query, namespace in semester_queries:
            result = self.test_query(query, namespace, 3)
            self.test_results.append(result)
        
        # Test 5: Complex Multi-Concept Queries
        print("\n🧠 CATEGORY 5: COMPLEX MULTI-CONCEPT QUERIES")
        print("-" * 40)
        
        complex_queries = [
            "machine learning decision trees random forest ensemble methods",
            "database design ER diagrams normalization relational model",
            "computer networks routing protocols distance vector link state",
            "software engineering design patterns singleton factory observer",
            "algorithms graph theory dijkstra shortest path breadth first",
            "web development REST API authentication JWT tokens"
        ]
        
        for query in complex_queries:
            result = self.test_query(query, "studymaterials", 5)
            self.test_results.append(result)
        
        # Test 6: Cross-Collection Search (using default studymaterials but conceptually cross-domain)
        print("\n🔄 CATEGORY 6: INTERDISCIPLINARY QUERIES")
        print("-" * 40)
        
        interdisciplinary_queries = [
            "artificial intelligence machine learning computer vision",
            "data science statistics machine learning python",
            "software engineering databases web development",
            "algorithms data structures programming languages",
            "mathematics linear algebra machine learning",
            "computer networks security cryptography"
        ]
        
        for query in interdisciplinary_queries:
            result = self.test_query(query, "studymaterials", 4)
            self.test_results.append(result)
        
        # Test 7: Problem-Solving Queries
        print("\n🛠️ CATEGORY 7: PROBLEM-SOLVING QUERIES")
        print("-" * 40)
        
        problem_queries = [
            "how to implement binary search tree insertion deletion",
            "explain bubble sort algorithm time complexity",
            "database join types inner outer left right",
            "memory allocation strategies operating systems",
            "HTTP methods GET POST PUT DELETE REST",
            "supervised vs unsupervised machine learning differences"
        ]
        
        for query in problem_queries:
            result = self.test_query(query, "studymaterials", 3)
            self.test_results.append(result)
        
        # Generate final report
        self.generate_test_report()
    
    def generate_test_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*60)
        print("📊 REAL-WORLD RAG TESTING REPORT")
        print("="*60)
        
        successful_tests = [r for r in self.test_results if r.get('success', False)]
        failed_tests = [r for r in self.test_results if not r.get('success', False)]
        
        total_tests = len(self.test_results)
        success_rate = (len(successful_tests) / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n📈 OVERALL STATISTICS:")
        print(f"   Total Queries Tested: {total_tests}")
        print(f"   Successful Queries: {len(successful_tests)}")
        print(f"   Failed Queries: {len(failed_tests)}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        if successful_tests:
            avg_response_time = sum(r.get('response_time', 0) for r in successful_tests) / len(successful_tests)
            avg_results_count = sum(r.get('results_count', 0) for r in successful_tests) / len(successful_tests)
            
            print(f"   Average Response Time: {avg_response_time:.3f}s")
            print(f"   Average Results per Query: {avg_results_count:.1f}")
        
        # Namespace breakdown
        print(f"\n📊 NAMESPACE BREAKDOWN:")
        namespace_stats = {}
        for result in successful_tests:
            ns = result.get('namespace', 'unknown')
            if ns not in namespace_stats:
                namespace_stats[ns] = {'count': 0, 'total_results': 0}
            namespace_stats[ns]['count'] += 1
            namespace_stats[ns]['total_results'] += result.get('results_count', 0)
        
        for ns, stats in namespace_stats.items():
            avg_results = stats['total_results'] / stats['count'] if stats['count'] > 0 else 0
            print(f"   {ns}: {stats['count']} queries, {avg_results:.1f} avg results")
        
        # Top performing queries
        print(f"\n🏆 TOP PERFORMING QUERIES:")
        top_queries = sorted(successful_tests, key=lambda x: x.get('results_count', 0), reverse=True)[:5]
        for i, query in enumerate(top_queries, 1):
            print(f"   {i}. '{query['query'][:60]}...' ({query['results_count']} results)")
        
        # Failed queries analysis
        if failed_tests:
            print(f"\n❌ FAILED QUERIES ANALYSIS:")
            for failure in failed_tests[:3]:  # Show first 3 failures
                print(f"   Query: '{failure['query'][:50]}...'")
                print(f"   Error: {failure.get('error', 'Unknown error')}")
        
        print(f"\n✅ TESTING COMPLETE!")
        print(f"The RAG system shows {success_rate:.1f}% success rate with real-world educational queries.")
        if success_rate >= 90:
            print("🎉 EXCELLENT: RAG system performs exceptionally well!")
        elif success_rate >= 70:
            print("👍 GOOD: RAG system performs well with minor issues.")
        else:
            print("⚠️ NEEDS IMPROVEMENT: RAG system requires optimization.")

def main():
    """Main testing function"""
    print("🔍 Real-World RAG Query Testing")
    print("Testing comprehensive educational queries across all collections...\n")
    
    # Check if RAG system is running
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ RAG system is running and healthy")
        else:
            print("❌ RAG system health check failed")
            return
    except Exception as e:
        print(f"❌ Cannot connect to RAG system: {e}")
        print("Make sure to start the RAG backend first: python3 core_rag.py")
        return
    
    # Run comprehensive testing
    tester = RealWorldRAGTester()
    tester.run_comprehensive_tests()

if __name__ == "__main__":
    main()
