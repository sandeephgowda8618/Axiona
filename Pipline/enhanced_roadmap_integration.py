"""
Enhanced Roadmap Builder Integration
===================================

This script demonstrates how to integrate the enhanced semantic filtering
into the existing roadmap builder to fix the resource relevance issues.
"""

import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class EnhancedRoadmapBuilder:
    """
    Enhanced roadmap builder with improved semantic filtering
    
    This class shows how to integrate the enhanced filtering functions
    into the existing roadmap builder to ensure:
    1. PES materials are filtered by subject and unit
    2. Reference books are selected by subject relevance  
    3. Videos are curated with proper allocation (2 playlists + 1 oneshot)
    4. Progressive difficulty across 4 phases
    """
    
    def __init__(self):
        # Import enhanced filtering with graceful fallback
        try:
            from agents.enhanced_filtering import enhanced_filtering
            self.filtering = enhanced_filtering
            self.enhanced_filtering_available = True
        except ImportError as e:
            logger.warning(f"Enhanced filtering not available: {e}")
            self.enhanced_filtering_available = False
    
    def build_interview_driven_roadmap(self, learning_goal: str, interview_responses: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build roadmap with enhanced semantic filtering
        
        Args:
            learning_goal: Subject area (e.g., "Operating Systems")
            interview_responses: User responses from interview
            
        Returns:
            Complete roadmap JSON with semantically filtered resources
        """
        # Extract subject from learning goal (simplified)
        subject = learning_goal.strip()
        
        # Build 4-phase structure with enhanced filtering
        phases = self._build_enhanced_phases(subject, interview_responses)
        
        # Generate course project
        course_project = self._generate_course_project(subject, phases)
        
        # Create learning schedule
        learning_schedule = self._create_learning_schedule(phases, course_project)
        
        # Assemble final roadmap
        roadmap = {
            "roadmap_id": f"roadmap_enhanced_{subject.lower().replace(' ', '_')}",
            "learning_goal": learning_goal,
            "subject_area": subject,
            "user_profile": {
                "skill_level": interview_responses.get("skill_level", "beginner"),
                "preferences": interview_responses.get("learning_style", "mixed"),
                "time_commitment": interview_responses.get("time_per_week", "8 hours")
            },
            "phases": phases,
            "course_project": course_project,
            "learning_schedule": learning_schedule,
            "meta": {
                "enhanced_filtering": self.enhanced_filtering_available,
                "semantic_validation": True,
                "total_phases": len(phases),
                "generation_timestamp": "2025-11-15T20:00:00Z"
            }
        }
        
        # Add validation report
        roadmap["validation_report"] = self._validate_roadmap_resources(roadmap)
        
        return roadmap
    
    def _build_enhanced_phases(self, subject: str, interview_responses: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Build 4 phases with enhanced semantic filtering"""
        
        phase_templates = [
            {
                "id": 1, 
                "title": "Foundations", 
                "difficulty": "beginner",
                "concepts": self._get_foundational_concepts(subject),
                "estimated_hours": 12
            },
            {
                "id": 2, 
                "title": "Core Implementation", 
                "difficulty": "intermediate",
                "concepts": self._get_core_concepts(subject),
                "estimated_hours": 15
            },
            {
                "id": 3, 
                "title": "Advanced Topics", 
                "difficulty": "intermediate",
                "concepts": self._get_advanced_concepts(subject),
                "estimated_hours": 18
            },
            {
                "id": 4, 
                "title": "Integration & Projects", 
                "difficulty": "advanced",
                "concepts": self._get_integration_concepts(subject),
                "estimated_hours": 15
            }
        ]
        
        phases = []
        
        for template in phase_templates:
            phase = self._build_enhanced_phase(
                phase_id=template["id"],
                phase_title=template["title"],
                subject=subject,
                concepts=template["concepts"],
                difficulty=template["difficulty"],
                estimated_hours=template["estimated_hours"]
            )
            phases.append(phase)
        
        return phases
    
    def _build_enhanced_phase(self, phase_id: int, phase_title: str, subject: str, 
                             concepts: List[str], difficulty: str, estimated_hours: int) -> Dict[str, Any]:
        """Build a single phase with enhanced filtering"""
        
        # Initialize phase structure
        phase = {
            "phase_id": phase_id,
            "phase_title": f"Phase {phase_id}: {phase_title}",
            "difficulty": difficulty,
            "estimated_hours": estimated_hours,
            "concepts": concepts,
            "learning_objectives": [f"Master {concept}" for concept in concepts[:3]],
            "resources": {
                "pes_materials": [],
                "reference_book": {},
                "videos": {
                    "playlists": [],
                    "oneshot": {}
                }
            },
            "validation_errors": []
        }
        
        # Apply enhanced filtering if available
        if self.enhanced_filtering_available:
            try:
                # Get PES materials for this phase/unit
                pes_result = self.filtering.filter_pes_materials_by_phase(subject, phase_id, max_results=8)
                
                if pes_result.get("results"):
                    phase["resources"]["pes_materials"] = pes_result["results"]
                else:
                    error_msg = pes_result.get("meta", {}).get("error", f"No PES materials for Phase {phase_id}")
                    phase["validation_errors"].append(error_msg)
                
                # Get reference book for this phase
                book_result = self.filtering.filter_reference_books_by_subject(subject, concepts, difficulty)
                
                if book_result.get("result"):
                    phase["resources"]["reference_book"] = book_result["result"]
                else:
                    error_msg = book_result.get("meta", {}).get("error", f"No reference book for {subject}")
                    phase["validation_errors"].append(error_msg)
                
                # Get videos for this phase
                video_result = self.filtering.filter_videos_by_phase(subject, concepts, difficulty)
                
                if video_result.get("playlists") and video_result.get("oneshot"):
                    phase["resources"]["videos"]["playlists"] = video_result["playlists"]
                    phase["resources"]["videos"]["oneshot"] = video_result["oneshot"]
                else:
                    warning_msg = video_result.get("meta", {}).get("warning", f"Insufficient videos for Phase {phase_id}")
                    phase["validation_errors"].append(warning_msg)
                
            except Exception as e:
                error_msg = f"Enhanced filtering error in Phase {phase_id}: {str(e)}"
                phase["validation_errors"].append(error_msg)
                logger.error(error_msg)
        
        else:
            # Fallback to basic resource allocation
            phase["validation_errors"].append("Enhanced filtering not available - using fallback resources")
            phase["resources"] = self._get_fallback_resources(subject, phase_id, concepts)
        
        return phase
    
    def _get_foundational_concepts(self, subject: str) -> List[str]:
        """Get foundational concepts for a subject"""
        concept_map = {
            "Operating Systems": ["introduction", "system calls", "processes", "threads"],
            "Data Structures": ["arrays", "linked lists", "basic algorithms", "complexity"],
            "Databases": ["introduction", "relational model", "basic SQL", "ER diagrams"],
            "Computer Networks": ["introduction", "protocols", "OSI model", "basic networking"]
        }
        return concept_map.get(subject, ["introduction", "fundamentals", "basics"])
    
    def _get_core_concepts(self, subject: str) -> List[str]:
        """Get core implementation concepts"""
        concept_map = {
            "Operating Systems": ["memory management", "paging", "segmentation", "virtual memory"],
            "Data Structures": ["trees", "graphs", "sorting", "searching"],
            "Databases": ["normalization", "indexing", "query optimization", "transactions"],
            "Computer Networks": ["routing", "switching", "TCP/IP", "network protocols"]
        }
        return concept_map.get(subject, ["implementation", "algorithms", "core concepts"])
    
    def _get_advanced_concepts(self, subject: str) -> List[str]:
        """Get advanced concepts"""
        concept_map = {
            "Operating Systems": ["file systems", "synchronization", "deadlocks", "distributed systems"],
            "Data Structures": ["advanced trees", "graph algorithms", "dynamic programming", "optimization"],
            "Databases": ["distributed databases", "NoSQL", "big data", "data warehousing"],
            "Computer Networks": ["network security", "wireless networks", "network management", "QoS"]
        }
        return concept_map.get(subject, ["advanced topics", "optimization", "complex algorithms"])
    
    def _get_integration_concepts(self, subject: str) -> List[str]:
        """Get integration and project concepts"""
        concept_map = {
            "Operating Systems": ["system design", "performance tuning", "security", "real-world applications"],
            "Data Structures": ["system design", "performance analysis", "optimization", "real-world problems"],
            "Databases": ["system architecture", "performance tuning", "scalability", "real-world design"],
            "Computer Networks": ["network design", "performance optimization", "security", "system integration"]
        }
        return concept_map.get(subject, ["integration", "projects", "real-world applications"])
    
    def _get_fallback_resources(self, subject: str, phase_id: int, concepts: List[str]) -> Dict[str, Any]:
        """Provide fallback resources when enhanced filtering is not available"""
        return {
            "pes_materials": [
                {
                    "title": f"{subject} - Unit {phase_id} (Fallback)",
                    "unit": phase_id,
                    "content_type": "pes_material",
                    "fallback": True
                }
            ],
            "reference_book": {
                "title": f"Standard {subject} Textbook (Fallback)",
                "content_type": "reference_book",
                "fallback": True
            },
            "videos": {
                "playlists": [
                    {
                        "title": f"{subject} Basics Playlist (Fallback)",
                        "content_type": "youtube_playlist",
                        "fallback": True
                    },
                    {
                        "title": f"{subject} Advanced Playlist (Fallback)",
                        "content_type": "youtube_playlist", 
                        "fallback": True
                    }
                ],
                "oneshot": {
                    "title": f"{subject} Complete Tutorial (Fallback)",
                    "content_type": "youtube_video",
                    "fallback": True
                }
            }
        }
    
    def _generate_course_project(self, subject: str, phases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a course-level project using all phases"""
        project_map = {
            "Operating Systems": {
                "title": "Mini Operating System Simulator",
                "description": "Build a comprehensive OS simulator covering process management, memory management, file systems, and synchronization",
                "modules": [
                    "Process Scheduler",
                    "Memory Manager", 
                    "File System",
                    "Synchronization Primitives"
                ]
            },
            "Data Structures": {
                "title": "Advanced Data Structure Library",
                "description": "Implement a comprehensive library of advanced data structures with performance analysis",
                "modules": [
                    "Basic Structures",
                    "Tree Implementations",
                    "Graph Algorithms",
                    "Performance Benchmarks"
                ]
            }
        }
        
        default_project = {
            "title": f"Comprehensive {subject} Project",
            "description": f"End-to-end project covering all aspects of {subject}",
            "modules": [f"Module {i+1}" for i in range(4)]
        }
        
        project_template = project_map.get(subject, default_project)
        
        return {
            "project_id": f"proj_{subject.lower().replace(' ', '_')}",
            "title": project_template["title"],
            "description": project_template["description"],
            "estimated_time_hours": 25,
            "modules": [
                {
                    "module_id": i+1,
                    "title": project_template["modules"][i],
                    "aligned_phase": i+1,
                    "estimated_hours": 6,
                    "prerequisites": phases[i]["concepts"]
                }
                for i in range(min(4, len(project_template["modules"])))
            ],
            "deliverables": ["Source Code", "Documentation", "Test Suite", "Performance Report"],
            "complexity": "Advanced"
        }
    
    def _create_learning_schedule(self, phases: List[Dict[str, Any]], course_project: Dict[str, Any]) -> Dict[str, Any]:
        """Create detailed learning schedule"""
        total_study_hours = sum(phase["estimated_hours"] for phase in phases)
        total_project_hours = course_project["estimated_time_hours"]
        total_hours = total_study_hours + total_project_hours
        
        # Assume 10 hours per week
        total_weeks = max(6, (total_hours // 10) + 1)
        
        return {
            "total_duration_weeks": total_weeks,
            "total_hours": total_hours,
            "study_hours": total_study_hours,
            "project_hours": total_project_hours,
            "weekly_breakdown": [
                {
                    "week": i+1,
                    "focus": f"Phase {((i//2) % 4) + 1}" if i < 8 else "Project Work",
                    "study_hours": 7 if i < 8 else 3,
                    "project_hours": 3 if i < 8 else 7
                }
                for i in range(total_weeks)
            ],
            "milestones": [
                {
                    "week": 2 * (i+1),
                    "milestone": f"Complete Phase {i+1}",
                    "deliverables": [f"Phase {i+1} assessment", f"Project Module {i+1}"]
                }
                for i in range(4)
            ]
        }
    
    def _validate_roadmap_resources(self, roadmap: Dict[str, Any]) -> Dict[str, Any]:
        """Validate that roadmap has appropriate resources"""
        validation = {
            "total_phases": len(roadmap["phases"]),
            "valid_phases": 0,
            "issues": [],
            "resource_coverage": {
                "pes_materials": 0,
                "reference_books": 0, 
                "video_playlists": 0,
                "video_oneshots": 0
            }
        }
        
        for phase in roadmap["phases"]:
            phase_issues = []
            resources = phase.get("resources", {})
            
            # Check PES materials
            pes_count = len(resources.get("pes_materials", []))
            if pes_count > 0:
                validation["resource_coverage"]["pes_materials"] += 1
            else:
                phase_issues.append("No PES materials")
            
            # Check reference book
            if resources.get("reference_book"):
                validation["resource_coverage"]["reference_books"] += 1
            else:
                phase_issues.append("No reference book")
            
            # Check videos
            playlists = resources.get("videos", {}).get("playlists", [])
            oneshot = resources.get("videos", {}).get("oneshot")
            
            if len(playlists) >= 2:
                validation["resource_coverage"]["video_playlists"] += 1
            else:
                phase_issues.append(f"Insufficient playlists ({len(playlists)}/2)")
                
            if oneshot:
                validation["resource_coverage"]["video_oneshots"] += 1
            else:
                phase_issues.append("No oneshot video")
            
            # Add validation errors from phase
            if phase.get("validation_errors"):
                phase_issues.extend(phase["validation_errors"])
            
            if not phase_issues:
                validation["valid_phases"] += 1
            else:
                validation["issues"].append({
                    "phase_id": phase["phase_id"],
                    "issues": phase_issues
                })
        
        validation["success_rate"] = validation["valid_phases"] / max(validation["total_phases"], 1)
        validation["enhanced_filtering_used"] = roadmap["meta"]["enhanced_filtering"]
        
        return validation

# Example usage function
def example_enhanced_roadmap_generation():
    """Example of how to use the enhanced roadmap builder"""
    
    # Sample interview responses
    interview_responses = {
        "skill_level": "beginner",
        "learning_style": "hands-on",
        "time_per_week": "10 hours",
        "interests": ["memory management", "process scheduling"],
        "experience": "Basic programming knowledge"
    }
    
    # Create enhanced roadmap builder
    builder = EnhancedRoadmapBuilder()
    
    # Generate roadmap with enhanced filtering
    roadmap = builder.build_interview_driven_roadmap("Operating Systems", interview_responses)
    
    return roadmap

if __name__ == "__main__":
    print("Enhanced Roadmap Builder Integration Test")
    print("=" * 50)
    
    try:
        roadmap = example_enhanced_roadmap_generation()
        
        print(f"Generated roadmap for: {roadmap['learning_goal']}")
        print(f"Total phases: {roadmap['meta']['total_phases']}")
        print(f"Enhanced filtering: {roadmap['meta']['enhanced_filtering']}")
        
        validation = roadmap["validation_report"]
        print(f"Valid phases: {validation['valid_phases']}/{validation['total_phases']}")
        print(f"Success rate: {validation['success_rate']:.2f}")
        
        if validation["issues"]:
            print("Issues found:")
            for issue in validation["issues"][:3]:  # Show first 3
                print(f"  Phase {issue['phase_id']}: {issue['issues'][0]}")
        
    except Exception as e:
        print(f"Error: {e}")
        print("This is expected if database connection is not available")
