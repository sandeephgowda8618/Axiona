#!/usr/bin/env python3
"""
Simple Real-World RAG Query Test
"""

import chromadb

def test_real_world_queries():
    print("🔍 TESTING REAL-WORLD RAG QUERIES")
    print("="*50)
    
    try:
        # Connect to ChromaDB
        client = chromadb.PersistentClient(path='./chromadb')
        
        # Get collections info
        collections = client.list_collections()
        print(f"Available collections: {[c.name for c in collections]}")
        
        # Test StudyMaterials
        studymaterials = client.get_collection('studymaterials')
        print(f"StudyMaterials documents: {studymaterials.count()}")
        
        # Real-world educational queries
        test_queries = [
            "machine learning algorithms neural networks",
            "data structures arrays linked lists",
            "database management systems SQL",
            "operating systems process scheduling",
            "computer networks TCP IP protocols",
            "algorithms sorting searching",
            "web development HTML CSS JavaScript",
            "software engineering design patterns"
        ]
        
        print(f"\n📚 TESTING {len(test_queries)} REAL-WORLD QUERIES:")
        print("-" * 50)
        
        successful_queries = 0
        total_results = 0
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n{i}. Query: '{query}'")
            
            try:
                results = studymaterials.query(
                    query_texts=[query],
                    n_results=3
                )
                
                if results['documents'] and results['documents'][0]:
                    result_count = len(results['documents'][0])
                    successful_queries += 1
                    total_results += result_count
                    
                    print(f"   ✅ Found {result_count} results")
                    
                    # Show top result
                    if results['metadatas'] and results['metadatas'][0]:
                        top_metadata = results['metadatas'][0][0]
                        distance = results['distances'][0][0] if results['distances'] else 1.0
                        relevance = 1 - distance
                        
                        print(f"   📖 Top result: {top_metadata.get('title', 'No title')}")
                        print(f"   📚 Subject: {top_metadata.get('subject', 'N/A')}")
                        print(f"   🎯 Relevance: {relevance:.3f}")
                        
                        if top_metadata.get('semester'):
                            print(f"   🎓 Semester: {top_metadata.get('semester')}")
                        if top_metadata.get('level'):
                            print(f"   📊 Level: {top_metadata.get('level')}")
                else:
                    print("   ❌ No results found")
                    
            except Exception as e:
                print(f"   ❌ Query failed: {e}")
        
        # Test Videos collection
        print(f"\n🎥 TESTING VIDEO COLLECTION:")
        print("-" * 30)
        
        videos = client.get_collection('videos')
        print(f"Videos documents: {videos.count()}")
        
        video_queries = [
            "python programming tutorial",
            "machine learning course",
            "data science tutorial"
        ]
        
        for i, query in enumerate(video_queries, 1):
            print(f"\n{i}. Video Query: '{query}'")
            
            try:
                results = videos.query(
                    query_texts=[query],
                    n_results=2
                )
                
                if results['documents'] and results['documents'][0]:
                    result_count = len(results['documents'][0])
                    print(f"   ✅ Found {result_count} video results")
                    
                    if results['metadatas'] and results['metadatas'][0]:
                        top_metadata = results['metadatas'][0][0]
                        print(f"   🎬 Top video: {top_metadata.get('title', 'No title')}")
                        if top_metadata.get('channel'):
                            print(f"   📺 Channel: {top_metadata.get('channel')}")
                else:
                    print("   ❌ No video results found")
                    
            except Exception as e:
                print(f"   ❌ Video query failed: {e}")
        
        # Test Books collection
        print(f"\n📖 TESTING BOOKS COLLECTION:")
        print("-" * 30)
        
        books = client.get_collection('books')
        print(f"Books documents: {books.count()}")
        
        book_queries = [
            "algorithms textbook introduction",
            "computer science fundamentals",
            "programming languages"
        ]
        
        for i, query in enumerate(book_queries, 1):
            print(f"\n{i}. Book Query: '{query}'")
            
            try:
                results = books.query(
                    query_texts=[query],
                    n_results=2
                )
                
                if results['documents'] and results['documents'][0]:
                    result_count = len(results['documents'][0])
                    print(f"   ✅ Found {result_count} book results")
                    
                    if results['metadatas'] and results['metadatas'][0]:
                        top_metadata = results['metadatas'][0][0]
                        print(f"   📚 Top book: {top_metadata.get('title', 'No title')}")
                        if top_metadata.get('author'):
                            print(f"   ✍️ Author: {top_metadata.get('author')}")
                else:
                    print("   ❌ No book results found")
                    
            except Exception as e:
                print(f"   ❌ Book query failed: {e}")
        
        # Final statistics
        print(f"\n" + "="*50)
        print("📊 REAL-WORLD QUERY TEST RESULTS")
        print("="*50)
        
        success_rate = (successful_queries / len(test_queries) * 100) if test_queries else 0
        avg_results = (total_results / successful_queries) if successful_queries > 0 else 0
        
        print(f"✅ Successful queries: {successful_queries}/{len(test_queries)}")
        print(f"📈 Success rate: {success_rate:.1f}%")
        print(f"📊 Average results per query: {avg_results:.1f}")
        print(f"📚 Total results found: {total_results}")
        
        # Get collection sizes
        total_docs = sum(c.count() for c in collections)
        print(f"🗄️ Total documents in RAG system: {total_docs}")
        
        if success_rate >= 80:
            print(f"\n🎉 EXCELLENT: RAG system performs very well with real-world queries!")
        elif success_rate >= 60:
            print(f"\n👍 GOOD: RAG system performs well with real-world queries!")
        else:
            print(f"\n⚠️ NEEDS IMPROVEMENT: RAG system needs optimization for real-world queries.")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_real_world_queries()
