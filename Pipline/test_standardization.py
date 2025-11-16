#!/usr/bin/env python3
"""
Test Standardized Agent Implementations
======================================

Test script to validate the new standardized agent implementations
that return JSON-only responses according to the TODO specification.
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.vector_db import VectorDBManager
from core.metadata_builder import MetadataBuilder
from config.database import db_manager
from config.settings import Settings
import json

async def test_metadata_builder():
    """Test the MetadataBuilder utility functions"""
    print("🧪 Testing MetadataBuilder...")
    
    # Test document metadata building
    sample_book = {
        "_id": "book_001",
        "title": "Sample Computer Science Book",
        "author": "John Doe",
        "content_type": "reference_book",
        "source": "reference_books",
        "gridfs_id": "507f1f77bcf86cd799439011",
        "summary": "A comprehensive guide to computer science concepts",
        "key_concepts": ["algorithms", "data structures"],
        "difficulty": "Intermediate"
    }
    
    metadata = MetadataBuilder.build_document_metadata(
        mongo_doc=sample_book,
        semantic_score=0.85,
        relevance_score=0.90,
        snippet="This book covers fundamental algorithms and data structures..."
    )
    
    print("✅ Document metadata built successfully:")
    print(json.dumps(metadata, indent=2))
    
    # Test search response envelope
    response = MetadataBuilder.build_search_response(
        results=[metadata],
        query="computer science algorithms",
        search_type="book_search",
        top_k=10
    )
    
    print("✅ Search response envelope built successfully:")
    print(json.dumps(response, indent=2))
    
    return True

async def test_database_collections():
    """Test database collection access"""
    print("\n🗄️ Testing database collections...")
    
    try:
        db = db_manager.get_database()
        
        # Test collections exist and have data
        collections_to_test = [
            (Settings.BOOKS_COLLECTION, "reference_books"),
            (Settings.MATERIALS_COLLECTION, "pes_materials"), 
            (Settings.VIDEOS_COLLECTION, "videos")
        ]
        
        for collection_name, display_name in collections_to_test:
            count = db[collection_name].count_documents({})
            print(f"✅ {display_name}: {count} documents")
            
            if count > 0:
                sample = db[collection_name].find_one()
                print(f"   Sample ID: {sample.get('_id', 'N/A')}")
                print(f"   Sample title: {sample.get('title', 'N/A')[:50]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

async def test_vector_search():
    """Test ChromaDB vector search"""
    print("\n🔍 Testing vector search...")
    
    try:
        vector_db = VectorDBManager(persist_directory="./chromadb")
        
        # Test search
        results = vector_db.search_documents(
            collection_name="educational_content",
            query_text="operating systems memory management",
            n_results=3
        )
        
        if results and results.get("documents"):
            print(f"✅ Vector search returned {len(results['documents'][0])} results")
            
            # Show sample results
            for i, doc in enumerate(results["documents"][0][:2]):
                metadata = results["metadatas"][0][i] if results.get("metadatas") else {}
                print(f"   Result {i+1}:")
                print(f"     Content type: {metadata.get('content_type', 'N/A')}")
                print(f"     Source ID: {metadata.get('source_id', 'N/A')}")
                print(f"     Snippet: {doc[:100]}...")
                
        else:
            print("⚠️ Vector search returned no results")
            
        return True
        
    except Exception as e:
        print(f"❌ Vector search test failed: {e}")
        return False

async def test_standardized_search():
    """Test standardized search implementation"""
    print("\n🎯 Testing standardized search logic...")
    
    try:
        db = db_manager.get_database()
        vector_db = VectorDBManager(persist_directory="./chromadb")
        
        # Test query
        query = "memory management operating systems"
        
        # Vector search
        results = vector_db.search_documents(
            collection_name="educational_content",
            query_text=query,
            n_results=5
        )
        
        search_results = []
        
        if results and results.get("documents"):
            for i, doc_text in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results.get("metadatas") else {}
                source_id = metadata.get("source_id", "")
                content_type = metadata.get("content_type", "")
                
                # Determine which collection to query
                if content_type == "reference_book":
                    collection_name = Settings.BOOKS_COLLECTION
                elif content_type == "pes_material":
                    collection_name = Settings.MATERIALS_COLLECTION
                else:
                    continue
                    
                # Fetch full document
                doc = db[collection_name].find_one({"_id": source_id})
                if doc:
                    semantic_score = 1.0 - (results["distances"][0][i] if results.get("distances") else 0.0)
                    relevance_score = MetadataBuilder.calculate_relevance_score(
                        semantic_score=semantic_score,
                        pedagogical_score=0.8,
                        recency_score=0.5
                    )
                    
                    metadata_obj = MetadataBuilder.build_document_metadata(
                        mongo_doc=doc,
                        semantic_score=semantic_score,
                        relevance_score=relevance_score,
                        snippet=doc_text[:150] + "..." if len(doc_text) > 150 else doc_text
                    )
                    search_results.append(metadata_obj)
        
        # Sort and build response
        search_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        response = MetadataBuilder.build_search_response(
            results=search_results[:5],
            query=query,
            search_type="pdf_search",
            top_k=10
        )
        
        print(f"✅ Standardized search completed successfully")
        print(f"   Query: {query}")
        print(f"   Results returned: {len(response['results'])}")
        print(f"   Response format valid: {bool(response.get('results') and response.get('meta'))}")
        
        # Show one example result
        if response["results"]:
            example = response["results"][0]
            print(f"   Example result:")
            print(f"     ID: {example['id']}")
            print(f"     Title: {example['title'][:60]}...")
            print(f"     Content type: {example['content_type']}")
            print(f"     Relevance score: {example['relevance_score']}")
            print(f"     Semantic score: {example['semantic_score']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Standardized search test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run all tests"""
    print("🚀 Testing Standardized Agent Implementation\n")
    
    tests = [
        ("MetadataBuilder", test_metadata_builder),
        ("Database Collections", test_database_collections), 
        ("Vector Search", test_vector_search),
        ("Standardized Search", test_standardized_search)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print(f"\n📊 Test Results Summary:")
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All standardization tests passed! Ready for implementation.")
    else:
        print("⚠️ Some tests failed. Review implementation before proceeding.")

if __name__ == "__main__":
    asyncio.run(main())
