from agents.base_agent import BaseAgent, AgentState
from typing import List, Dict, Any

class RoadmapBuilderAgent(BaseAgent):
    """Agent responsible for building the 4-phase personalized roadmap"""
    
    def __init__(self):
        super().__init__("RoadmapBuilderAgent", temperature=0.0, max_tokens=800)
    
    def get_system_prompt(self) -> str:
        return """You are RoadmapBuilderAgent. Input: { session_id, missing_concepts, prerequisite_dag, top_chunks_by_phase, user_context }.

Build 4 phases: Foundation, Core, Application, Projects. For each phase include:
- duration_weeks
- ordered_materials: [{chunk_id, gridfs_id, order, notes}]
- book_chapters: [{ref_id}]
- 2 quizzes: reference quiz IDs (created later)
- learning_objectives: 3-5 concise objectives

Output: { phases, rationale }

Rules: Keep phase progression coherent and aligned to prerequisites. Use DifficultyEstimator outputs to pace content."""
    
    def process(self, state: AgentState) -> AgentState:
        """Build the 4-phase roadmap structure"""
        try:
            self.log_action(state, "Starting roadmap construction")
            
            roadmap = state.data.get("roadmap", {})
            
            # Get necessary data
            skill_evaluation = roadmap.get("skill_evaluation", {})
            concept_gaps = roadmap.get("concept_gaps", [])
            prerequisite_graph = roadmap.get("prerequisite_graph", {})
            ranked_materials = roadmap.get("ranked_materials", {})
            difficulty_scores = roadmap.get("difficulty_scores", [])
            interview = roadmap.get("interview", {})
            
            # Extract user preferences
            user_context = self._extract_user_context(interview)
            
            # Build 4 phases
            phases = self._build_four_phases(
                user_context=user_context,
                skill_level=skill_evaluation.get("final_score", 0.5),
                concept_gaps=concept_gaps,
                ranked_materials=ranked_materials,
                difficulty_scores=difficulty_scores
            )
            
            # Store phases in roadmap
            roadmap["phases"] = phases
            state.data["roadmap"] = roadmap
            state.data["status"] = "phases_built"
            state.data["next_agent"] = "QuizGeneratorAgent"
            
            self.log_action(state, f"Built {len(phases)} phases successfully")
            
            return state
            
        except Exception as e:
            self.logger.error(f"Error building roadmap: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
    
    def _extract_user_context(self, interview: Dict) -> Dict[str, Any]:
        """Extract user context from interview data"""
        context = {
            "target_subject": "general",
            "experience_level": "beginner",
            "time_per_week": 8,
            "learning_style": "mixed",
            "goals": [],
            "deadline": None
        }
        
        answers = interview.get("answers", [])
        for answer in answers:
            question_id = answer.get("question_id", "")
            answer_text = answer.get("answer", "").lower()
            
            if question_id == "q1":  # Target subject
                context["target_subject"] = self._map_subject(answer_text)
            elif question_id == "q2":  # Experience level
                context["experience_level"] = self._map_experience_level(answer_text)
            elif question_id == "q3":  # Time availability
                context["time_per_week"] = self._map_time_commitment(answer_text)
            elif question_id == "q4":  # Learning style
                context["learning_style"] = self._map_learning_style(answer_text)
            elif question_id == "q5":  # Goals/deadline
                context["goals"] = [answer_text]
        
        return context
    
    def _build_four_phases(self, user_context: Dict, skill_level: float, 
                          concept_gaps: List[Dict], ranked_materials: Dict,
                          difficulty_scores: List[Dict]) -> Dict[str, Dict]:
        """Build the 4 phases of the roadmap"""
        
        phases = {}
        
        # Phase 1: Foundation
        phases["phase_1"] = self._build_foundation_phase(
            user_context, skill_level, concept_gaps
        )
        
        # Phase 2: Core Concepts
        phases["phase_2"] = self._build_core_phase(
            user_context, skill_level, ranked_materials
        )
        
        # Phase 3: Applications
        phases["phase_3"] = self._build_application_phase(
            user_context, ranked_materials
        )
        
        # Phase 4: Projects
        phases["phase_4"] = self._build_projects_phase(
            user_context, skill_level
        )
        
        return phases
    
    def _build_foundation_phase(self, user_context: Dict, skill_level: float, 
                               concept_gaps: List[Dict]) -> Dict[str, Any]:
        """Build Phase 1: Foundation"""
        
        # Adjust duration based on skill level
        duration_weeks = 3 if skill_level < 0.4 else 2
        
        # Mock materials - in real implementation, would query database
        foundation_materials = [
            {
                "material_id": "mat_101",
                "title": f"{user_context['target_subject'].title()} Fundamentals",
                "file_url": "/api/materials/stream/mat_101",
                "gridfs_id": "gridfs_101",
                "order": 1,
                "estimated_hours": 3
            },
            {
                "material_id": "mat_102", 
                "title": "Basic Concepts and Terminology",
                "file_url": "/api/materials/stream/mat_102",
                "gridfs_id": "gridfs_102",
                "order": 2,
                "estimated_hours": 2
            }
        ]
        
        # Add remediation materials for concept gaps
        for gap in concept_gaps[:2]:  # Top 2 gaps
            foundation_materials.append({
                "material_id": f"gap_{gap.get('concept', 'unknown').replace(' ', '_')}",
                "title": f"Review: {gap.get('concept', 'Unknown Concept')}",
                "file_url": f"/api/materials/stream/gap_material",
                "gridfs_id": "gap_gridfs",
                "order": len(foundation_materials) + 1,
                "estimated_hours": 1.5,
                "gap_remediation": True
            })
        
        foundation_books = [
            {
                "book_id": "book_001",
                "title": f"Introduction to {user_context['target_subject'].title()}",
                "chapters": [1, 2],
                "file_url": "/api/books/stream/book_001",
                "estimated_hours": 4
            }
        ]
        
        foundation_videos = [
            {
                "video_id": "vid_001",
                "title": f"{user_context['target_subject'].title()} - Getting Started",
                "url": "https://youtube.com/watch?v=example1",
                "duration_minutes": 45,
                "playlist_id": "playlist_foundations"
            }
        ]
        
        learning_objectives = [
            f"Understand basic {user_context['target_subject']} terminology and concepts",
            "Identify key components and their relationships",
            "Recognize fundamental principles and patterns"
        ]
        
        if concept_gaps:
            learning_objectives.append("Address identified knowledge gaps")
        
        return {
            "name": "Foundation",
            "duration_weeks": duration_weeks,
            "pes_materials": foundation_materials,
            "book_chapters": foundation_books,
            "one_shot_videos": foundation_videos,
            "quizzes": [
                {"quiz_id": "foundation_quiz_1"},
                {"quiz_id": "foundation_quiz_2"}
            ],
            "learning_objectives": learning_objectives,
            "estimated_total_hours": sum(m.get("estimated_hours", 2) for m in foundation_materials) + 4
        }
    
    def _build_core_phase(self, user_context: Dict, skill_level: float, 
                         ranked_materials: Dict) -> Dict[str, Any]:
        """Build Phase 2: Core Concepts"""
        
        duration_weeks = 4 if skill_level < 0.6 else 3
        
        core_materials = [
            {
                "material_id": "mat_201",
                "title": f"Intermediate {user_context['target_subject'].title()} Concepts", 
                "file_url": "/api/materials/stream/mat_201",
                "gridfs_id": "gridfs_201",
                "order": 1,
                "estimated_hours": 4
            },
            {
                "material_id": "mat_202",
                "title": "Advanced Techniques and Methods",
                "file_url": "/api/materials/stream/mat_202", 
                "gridfs_id": "gridfs_202",
                "order": 2,
                "estimated_hours": 3
            }
        ]
        
        core_books = [
            {
                "book_id": "book_002",
                "title": f"Comprehensive {user_context['target_subject'].title()} Guide",
                "chapters": [3, 4, 5],
                "file_url": "/api/books/stream/book_002",
                "estimated_hours": 6
            }
        ]
        
        learning_objectives = [
            "Master core concepts and principles",
            "Apply techniques to solve intermediate problems", 
            "Analyze and compare different approaches",
            "Understand best practices and common patterns"
        ]
        
        return {
            "name": "Core",
            "duration_weeks": duration_weeks,
            "pes_materials": core_materials,
            "book_chapters": core_books,
            "playlists": [
                {
                    "playlist_id": "pl_core_concepts",
                    "title": f"{user_context['target_subject'].title()} Core Concepts Playlist",
                    "videos": [
                        {"video_id": "vid_201", "title": "Core Concept 1", "url": "https://youtube.com/playlist_core"},
                        {"video_id": "vid_202", "title": "Core Concept 2", "url": "https://youtube.com/playlist_core"}
                    ]
                }
            ],
            "quizzes": [
                {"quiz_id": "core_quiz_1"}, 
                {"quiz_id": "core_quiz_2"}
            ],
            "learning_objectives": learning_objectives,
            "estimated_total_hours": 13
        }
    
    def _build_application_phase(self, user_context: Dict, ranked_materials: Dict) -> Dict[str, Any]:
        """Build Phase 3: Applications"""
        
        application_materials = [
            {
                "material_id": "mat_301",
                "title": f"Real-world {user_context['target_subject'].title()} Applications",
                "file_url": "/api/materials/stream/mat_301",
                "gridfs_id": "gridfs_301", 
                "order": 1,
                "estimated_hours": 3
            },
            {
                "material_id": "mat_302",
                "title": "Case Studies and Examples",
                "file_url": "/api/materials/stream/mat_302",
                "gridfs_id": "gridfs_302",
                "order": 2,
                "estimated_hours": 4
            }
        ]
        
        learning_objectives = [
            "Apply knowledge to real-world scenarios",
            "Analyze case studies and examples",
            "Design solutions for practical problems",
            "Evaluate different implementation approaches"
        ]
        
        return {
            "name": "Application",
            "duration_weeks": 3,
            "pes_materials": application_materials,
            "book_chapters": [
                {
                    "book_id": "book_003",
                    "title": f"{user_context['target_subject'].title()} Applications",
                    "chapters": [6, 7],
                    "file_url": "/api/books/stream/book_003",
                    "estimated_hours": 5
                }
            ],
            "one_shot_videos": [
                {
                    "video_id": "vid_301",
                    "title": f"{user_context['target_subject'].title()} in Industry",
                    "url": "https://youtube.com/watch?v=application_example",
                    "duration_minutes": 60
                }
            ],
            "quizzes": [
                {"quiz_id": "application_quiz_1"},
                {"quiz_id": "application_quiz_2"}
            ],
            "learning_objectives": learning_objectives,
            "estimated_total_hours": 12
        }
    
    def _build_projects_phase(self, user_context: Dict, skill_level: float) -> Dict[str, Any]:
        """Build Phase 4: Projects"""
        
        # Adjust project complexity based on skill level
        project_complexity = "intermediate" if skill_level > 0.6 else "basic"
        
        learning_objectives = [
            "Design and implement complete projects",
            "Integrate multiple concepts and techniques",
            "Demonstrate practical mastery",
            "Build portfolio-worthy applications",
            "Present and document work effectively"
        ]
        
        return {
            "name": "Projects",
            "duration_weeks": 4,
            "pes_materials": [
                {
                    "material_id": "mat_401",
                    "title": "Project Guidelines and Best Practices",
                    "file_url": "/api/materials/stream/mat_401",
                    "gridfs_id": "gridfs_401",
                    "order": 1,
                    "estimated_hours": 2
                }
            ],
            "book_chapters": [
                {
                    "book_id": "book_004", 
                    "title": f"{user_context['target_subject'].title()} Project Handbook",
                    "chapters": [8, 9],
                    "file_url": "/api/books/stream/book_004",
                    "estimated_hours": 3
                }
            ],
            "projects": [
                {
                    "project_id": "proj_001",
                    "title": f"Beginner {user_context['target_subject'].title()} Project",
                    "complexity": project_complexity,
                    "estimated_hours": 15
                },
                {
                    "project_id": "proj_002",
                    "title": f"Capstone {user_context['target_subject'].title()} Project",
                    "complexity": project_complexity,
                    "estimated_hours": 25
                }
            ],
            "quizzes": [
                {"quiz_id": "projects_quiz_1"}
            ],
            "learning_objectives": learning_objectives,
            "estimated_total_hours": 45
        }
    
    def _map_subject(self, subject_text: str) -> str:
        """Map user input to standardized subject"""
        subject_mapping = {
            "machine learning": "machine_learning",
            "ml": "machine_learning", 
            "ai": "machine_learning",
            "data structures": "data_structures",
            "algorithms": "data_structures",
            "dsa": "data_structures",
            "database": "database",
            "sql": "database",
            "dbms": "database",
            "python": "programming",
            "programming": "programming"
        }
        
        for key, value in subject_mapping.items():
            if key in subject_text.lower():
                return value
        
        return "general"
    
    def _map_experience_level(self, level_text: str) -> str:
        """Map experience level text to standard levels"""
        if any(term in level_text for term in ["beginner", "complete", "new"]):
            return "beginner"
        elif any(term in level_text for term in ["intermediate", "some", "basic"]):
            return "intermediate"
        elif any(term in level_text for term in ["advanced", "experienced"]):
            return "advanced"
        return "beginner"
    
    def _map_time_commitment(self, time_text: str) -> int:
        """Map time commitment text to hours per week"""
        if "2-4" in time_text:
            return 3
        elif "5-8" in time_text:
            return 6  
        elif "9-12" in time_text:
            return 10
        elif "13+" in time_text:
            return 15
        return 8  # Default
    
    def _map_learning_style(self, style_text: str) -> str:
        """Map learning style preferences"""
        if "video" in style_text.lower():
            return "visual"
        elif "reading" in style_text.lower() or "pdf" in style_text.lower():
            return "reading"
        elif "interactive" in style_text.lower() or "quiz" in style_text.lower():
            return "interactive"
        elif "project" in style_text.lower():
            return "hands_on"
        return "mixed"
