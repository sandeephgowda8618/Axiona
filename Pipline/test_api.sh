#!/bin/bash

# Test API Server
# Run this script after starting the API server with: python3 standardized_api.py

echo "🧪 Testing Educational Roadmap API Endpoints"
echo "=============================================="

# Test basic health check
echo "📡 Testing Health Endpoint..."
curl -X GET "http://localhost:8000/health" \
  -H "Content-Type: application/json" \
  | jq '.'

echo -e "\n📚 Testing PES Materials Search..."
curl -X POST "http://localhost:8000/search/pes" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Operating Systems",
    "unit": 1,
    "k": 5
  }' | jq '.'

echo -e "\n📖 Testing Reference Books Search..."
curl -X POST "http://localhost:8000/search/books" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Operating Systems", 
    "difficulty": "beginner",
    "k": 3
  }' | jq '.'

echo -e "\n🎯 Testing Roadmap Generation..."
curl -X POST "http://localhost:8000/roadmap/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "learning_goal": "Master Operating Systems Fundamentals",
    "subject": "Operating Systems",
    "user_background": "beginner",
    "hours_per_week": 10,
    "deadline": "2025-12-31"
  }' | jq '.'

echo -e "\n🎉 API Testing Completed!"
