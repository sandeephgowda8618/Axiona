# Interview-Driven Roadmap System Implementation Guide

## Overview

This document outlines the complete interview-driven roadmap system that uses 6 core questions + adaptive follow-ups to create personalized learning roadmaps grounded in PES slides, reference books, and videos.

## Interview Structure

### Core Questions (Required - 6 total)

1. **Subject/Semester Selection**
   - Type: Single choice
   - Purpose: Filter PES slides & materials by subject/semester
   - Example: "Which subject do you want to create a roadmap for?" 
   - Options: Based on available subjects in database

2. **Current Skill Level**
   - Type: Single choice  
   - Purpose: Shapes phase difficulty and prerequisite detection
   - Options: ["Beginner", "Intermediate", "Advanced"]

3. **Learning Goals**
   - Type: Multi-choice + optional text
   - Purpose: Prioritizes resource types and assessment methods
   - Options: ["Pass Exam", "Understand Fundamentals", "Build Project", "Research Preparation", "Job Interview Prep"]

4. **Time Commitment**
   - Type: Numeric + days selection
   - Purpose: Timeline and schedule planning
   - Format: Hours per week + preferred study days

5. **Target Timeline**
   - Type: Single choice
   - Purpose: Determines phase durations
   - Options: ["4 weeks", "8 weeks", "12 weeks", "One semester", "Custom"]

6. **Resource Preferences**
   - Type: Multi-choice
   - Purpose: Weights resource selection in roadmap
   - Options: ["PES Slides", "Reference Books", "Video Tutorials", "Hands-on Projects", "Practice Quizzes"]

### Adaptive Follow-ups (0-6 based on responses)

1. **Learning Style** (if goals include "understand fundamentals")
   - "Do you prefer concise notes or detailed explanations?"

2. **Prior Experience** (if skill level is ambiguous)
   - "What related courses or topics have you studied before?"

3. **Assessment Preferences** (if goals include "pass exam")
   - "Do you want regular quizzes and practice tests?"

4. **Project Complexity** (if goals include "build project")
   - "What type of projects interest you most?"

5. **Specific Topics** (if subject is broad)
   - "Are there specific units or topics you want to prioritize?"

6. **Schedule Preferences**
   - "Do you prefer intensive daily study or spaced weekend sessions?"

### Optional Skill Assessment

If self-reported skill level seems unreliable or user requests it:
- 5-10 MCQ diagnostic quiz
- Questions pulled RAG-style from subject chunks
- Used to calibrate actual vs. perceived skill level

## Agent Communication Flow

```
User Query → InterviewAgent → SkillEvaluator → RoadmapBuilder
     ↓              ↓              ↓              ↓
Interview.start → Questions → Assessment → Roadmap.final
```

### Edge Definitions

1. **interview.completed**: Triggers when all core questions answered
2. **skill_check.requested**: Optional diagnostic quiz trigger
3. **skill_check.completed**: Quiz results to skill evaluator
4. **roadmap.build**: Interview + skills → roadmap construction
5. **roadmap.ready**: Final roadmap delivery

## Implementation Checklist

### Phase 1: Core Interview System
- [x] InterviewAgent with 6 core questions
- [x] JSON output format for responses
- [x] Edge connections to RoadmapBuilder
- [ ] Skill assessment quiz integration
- [ ] /roadmap/answer endpoint

### Phase 2: Data Integration
- [ ] MongoDB collection population
- [ ] Vector embeddings for all materials
- [ ] ChromaDB setup with proper collections
- [ ] GridFS file storage for PDFs/videos

### Phase 3: Roadmap Generation
- [ ] RoadmapBuilder with 4-phase structure
- [ ] Material filtering by subject/semester
- [ ] Quiz generation from RAG chunks
- [ ] Timeline and schedule optimization

### Phase 4: API Integration
- [ ] FastAPI endpoints for interview flow
- [ ] Session management for multi-turn conversations
- [ ] Export capabilities (calendar, PDF)
- [ ] Progress tracking integration

## Decision Rules

### Timeline Compression
- If timeline ≤ 4 weeks → 4 intensive phases (1 week each)
- If timeline ≤ 8 weeks → 4 phases (2 weeks each)  
- If timeline ≤ 12 weeks → 4 phases (3 weeks each)
- If timeline > 12 weeks → 4 phases with buffer time

### Resource Prioritization
- If "PES Slides" preferred → 70% slides, 20% books, 10% videos
- If "Reference Books" preferred → 50% books, 30% slides, 20% videos
- If "Video Tutorials" preferred → 60% videos, 25% slides, 15% books
- If "Balanced" → 40% slides, 35% books, 25% videos

### Difficulty Adjustment
- Beginner: Start with prerequisites, gentle progression
- Intermediate: Skip basic concepts, focus on application
- Advanced: Emphasize advanced topics and research papers

### Assessment Integration
- If "Pass Exam" goal → Include practice tests and MCQs
- If "Build Project" goal → Include hands-on assignments
- If "Research Prep" goal → Include paper reviews and analysis

## Example JSON Output

```json
{
  "user_id": "user_123",
  "session_id": "interview_456", 
  "createdAt": "2025-11-13T20:00:00Z",
  "interview": {
    "answers": [
      {"question": "subject", "answer": "Data Structures and Algorithms"},
      {"question": "skill_level", "answer": "Intermediate"},
      {"question": "goals", "answer": ["Pass Exam", "Build Project"]},
      {"question": "hours_per_week", "answer": 8},
      {"question": "timeline", "answer": "12 weeks"},
      {"question": "preferred_resources", "answer": ["PES Slides", "Practice Projects"]}
    ],
    "follow_ups": [
      {"question": "assessment_preference", "answer": "Regular quizzes after each topic"},
      {"question": "project_type", "answer": "Algorithm implementation challenges"}
    ],
    "completed": true
  },
  "skill_evaluation": {
    "self_reported": {
      "algorithms": "intermediate",
      "data_structures": "intermediate", 
      "programming": "advanced"
    },
    "quiz_score": 0.75,
    "confidence_level": 0.8
  },
  "preferences": {
    "timeline_weeks": 12,
    "hours_per_week": 8,
    "study_days": ["Monday", "Wednesday", "Friday", "Sunday"],
    "assessment_frequency": "weekly",
    "project_complexity": "medium"
  }
}
```

## Ollama Integration

### System Prompts for Each Agent

**InterviewAgent**:
```
You are an educational interview specialist. Ask exactly 6 core questions to understand the user's learning needs. Keep responses concise and focused. After each answer, determine if follow-up questions are needed. Output structured JSON when interview is complete.
```

**SkillEvaluator**:
```  
You are a skill assessment expert. Analyze interview responses and optional quiz results to determine accurate skill levels. Output JSON with proficiency scores (0.0-1.0) for each relevant subject area.
```

**RoadmapBuilder**:
```
You are a curriculum designer. Create a 4-phase learning roadmap using available materials (PES slides, books, videos) based on interview and skill assessment data. Each phase should have clear objectives, materials, and assessments.
```

### Ollama Configuration
- Model: llama3.1 (as configured in .env)
- Temperature: 0.0 for structured outputs, 0.3 for creative content
- Max tokens: 2048 for detailed roadmaps, 512 for short responses
- System prompts: Keep under 200 tokens for optimal performance

## Next Steps

1. **Data Ingestion**: Populate MongoDB with PES slides, books, and videos
2. **Vector Setup**: Create embeddings for all materials in ChromaDB  
3. **Interview Flow**: Implement the 6-question interview system
4. **Roadmap Generation**: Build the 4-phase roadmap creator
5. **API Integration**: Connect everything through FastAPI endpoints
6. **Testing**: Validate with sample user journeys
