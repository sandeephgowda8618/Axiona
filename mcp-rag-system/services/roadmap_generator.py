# Roadmap Generation Service using RAG and Lightweight LLM

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import asyncio
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import torch

logger = logging.getLogger(__name__)

class RoadmapGenerator:
    """Generates personalized learning roadmaps using RAG and lightweight LLM"""
    
    def __init__(self, rag_collection_manager=None):
        self.model_name = "microsoft/DialoGPT-small"  # Lightweight conversational model
        self.tokenizer = None
        self.model = None
        self.generator = None
        self.max_length = 512
        self.initialized = False
        self.rag_collection_manager = rag_collection_manager  # Reference to RAG system
        
    async def initialize(self):
        """Initialize the lightweight model"""
        try:
            logger.info("Initializing lightweight Llama model for roadmap generation...")
            
            # Use a smaller, faster model for development
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForCausalLM.from_pretrained(self.model_name)
            
            # Add padding token if it doesn't exist
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Create text generation pipeline
            self.generator = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                max_length=self.max_length,
                do_sample=True,
                temperature=0.7,
                pad_token_id=self.tokenizer.eos_token_id
            )
            
            self.initialized = True
            logger.info("Roadmap generator initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize roadmap generator: {e}")
            raise
    
    def set_rag_collection_manager(self, collection_manager):
        """Set the RAG collection manager for content retrieval"""
        self.rag_collection_manager = collection_manager
        logger.info("RAG collection manager set for roadmap generator")
    
    def ensure_initialized(self):
        """Ensure the model is initialized"""
        if not self.initialized or self.generator is None or self.tokenizer is None:
            raise RuntimeError("RoadmapGenerator not initialized. Call initialize() first.")
    
    def format_user_profile(self, roadmap_data: Dict[str, Any]) -> str:
        """Format comprehensive user profile data into a structured context for enhanced RAG"""
        
        # Extract data from all wizard phases with comprehensive fallbacks
        phase1 = roadmap_data.get('phase1', {})
        phase2 = roadmap_data.get('phase2', {})
        phase3 = roadmap_data.get('phase3', {})
        phase4 = roadmap_data.get('phase4', {})
        phase5 = roadmap_data.get('phase5', {})
        user_context = roadmap_data.get('user_context', {})
        
        # Create a comprehensive, highly structured profile for better RAG understanding
        profile = f"""🎯 COMPREHENSIVE LEARNING PROFILE:

📚 DOMAIN & GOALS:
• Primary Domain: {phase1.get('domain') or user_context.get('domain', 'General Learning')}
• Current Level: {phase1.get('current_level') or user_context.get('current_level', 'beginner')}
• Primary Motivation: {phase1.get('motivation') or user_context.get('motivation', 'personal_interest')}
• Learning Style: {phase1.get('learning_style') or user_context.get('learning_style', 'balanced')}
• Timeline Preference: {phase1.get('timeline_preference') or user_context.get('timeline_preference', 'flexible')}
• Ultimate Goal: {phase5.get('ultimate_goal') or user_context.get('ultimate_goal', 'skill development')}

💪 SKILLS & EXPERIENCE:
• Core Strengths: {', '.join(phase2.get('core_strengths', []) or user_context.get('core_strengths', [])) or 'To be assessed'}
• Struggle Areas: {', '.join(phase2.get('struggle_areas', []) or user_context.get('struggle_areas', [])) or 'General learning challenges'}
• Project Experience: {phase2.get('project_experience') or user_context.get('project_experience', 'Limited practical experience')}
• Self-Learning Confidence: {phase2.get('self_learning_confidence') or user_context.get('self_learning_confidence', 5)}/10
• Problem-Solving Style: {phase2.get('problem_solving_style') or user_context.get('problem_solving_style', 'systematic')}

📖 LEARNING PREFERENCES:
• Material Preference: {phase3.get('material_preference') or user_context.get('material_preference', 'mixed')}
• Consistency Method: {phase3.get('consistency_method') or user_context.get('consistency_method', 'structured_roadmap')}
• Weekly Commitment: {phase3.get('weekly_days') or user_context.get('weekly_days', '3-5 days')}
• Task Preference: {phase3.get('task_preference') or user_context.get('task_preference', 'daily_tasks')}
• Practice Style: {phase3.get('practice_preference') or user_context.get('practice_preference', 'guided_exercises')}

🎯 CHALLENGE & ENGAGEMENT:
• Challenge Level: {phase4.get('challenge_level') or user_context.get('challenge_level', 'balanced')}
• Exam Preparation: {phase4.get('exam_preparation') or user_context.get('exam_preparation', 'No specific preparation')}
• Quiz Preference: {'Yes' if phase4.get('quiz_preference') or user_context.get('quiz_preference') else 'No'}
• Motivation Factor: {phase4.get('motivation_factor') or user_context.get('motivation_factor', 'progress_tracking')}

⏰ TIME & COMMITMENT:
• Daily Time Commitment: {phase5.get('time_commitment') or user_context.get('time_commitment', '1-2 hours')}
• Expected Outcome: {phase5.get('expected_outcome') or user_context.get('expected_outcome', 'practical_skills')}
• Include Assessments: {'Yes' if phase5.get('include_assessments') or user_context.get('include_assessments') else 'No'}"""
        
        return profile
    
    def enhance_rag_search(self, roadmap_data: Dict[str, Any]) -> List[str]:
        """Enhanced RAG search with intelligent query generation for roadmap content"""
        relevant_content = []
        
        if not self.rag_collection_manager:
            logger.warning("No RAG collection manager available, using basic content")
            return []
        
        try:
            # Extract and normalize user data from all phases
            phase1 = roadmap_data.get('phase1', {})
            phase2 = roadmap_data.get('phase2', {})
            phase3 = roadmap_data.get('phase3', {})
            phase4 = roadmap_data.get('phase4', {})
            phase5 = roadmap_data.get('phase5', {})
            
            # Build intelligent search queries
            search_queries = []
            
            # Primary goal-based queries (highest priority)
            main_goal = (phase1.get('goal') or phase1.get('domain') or 
                        phase5.get('ultimate_goal') or phase5.get('ultimateGoal', ''))
            
            if main_goal:
                current_level = (phase2.get('currentLevel') or phase2.get('current_level', 'beginner')).lower()
                
                # Core learning queries
                search_queries.extend([
                    f"learn {main_goal} {current_level} roadmap",
                    f"{main_goal} learning path {current_level}",
                    f"how to learn {main_goal} step by step",
                    f"{main_goal} tutorial {current_level} guide",
                    f"{main_goal} curriculum for {current_level}"
                ])
                
                # Learning style specific queries
                learning_style = (phase4.get('learningStyle') or phase4.get('learning_approach', '')).lower()
                if learning_style:
                    search_queries.extend([
                        f"{learning_style} {main_goal} learning resources",
                        f"{main_goal} {learning_style} approach"
                    ])
                
                # Time-based queries
                time_commitment = phase3.get('timeCommitment') or phase3.get('daily_time_commitment', '')
                if time_commitment:
                    search_queries.append(f"{main_goal} learning {time_commitment} schedule")
            
            # Experience and background-based queries
            experience = phase2.get('experience') or phase2.get('project_experience', '')
            if experience and main_goal:
                search_queries.append(f"{main_goal} for someone with {experience}")
            
            # Motivation and outcome-based queries
            motivation = (phase5.get('primaryMotivation') or phase5.get('motivation_factor') or 
                         phase5.get('expected_outcome', ''))
            if motivation and main_goal:
                search_queries.append(f"{main_goal} for {motivation}")
            
            # Remove duplicates and limit queries
            search_queries = list(dict.fromkeys(search_queries))[:8]
            
            logger.info(f"Generated {len(search_queries)} targeted search queries for RAG")
            
            # Search across different knowledge namespaces
            namespaces = ['studymaterials', 'books', 'videos']
            
            for namespace in namespaces:
                try:
                    collection = self.rag_collection_manager.get_or_create_collection(namespace)
                    
                    # Use top queries per namespace, prioritize by relevance
                    for i, query in enumerate(search_queries[:3]):  # Top 3 queries per namespace
                        results = collection.query(
                            query_texts=[query],
                            n_results=2 if i == 0 else 1,  # More results for primary query
                            where=None
                        )
                        
                        if results["documents"] and results["documents"][0]:
                            for i, doc in enumerate(results["documents"][0]):
                                if len(doc) > 100:  # Only substantial content
                                    # Get full metadata if available
                                    metadata = {}
                                    if results.get("metadatas") and len(results["metadatas"][0]) > i:
                                        metadata = results["metadatas"][0][i] or {}
                                    
                                    # Extract key resource information for frontend display
                                    resource_info = {
                                        'content': doc[:500],  # Limit content length
                                        'namespace': namespace,
                                        'query': query,
                                        'metadata': metadata,
                                        # Extract key fields for frontend display
                                        'title': metadata.get('title', 'Untitled Resource'),
                                        'author': metadata.get('author', 'Unknown Author'),
                                        'subject': metadata.get('subject', 'General'),
                                        'fileName': metadata.get('fileName', ''),
                                        'file_url': metadata.get('file_url', ''),
                                        'document_id': metadata.get('document_id', ''),
                                        'file_type': metadata.get('file_type', metadata.get('source_type', 'unknown')),
                                        'level': metadata.get('level', 'General'),
                                        'tags': metadata.get('tags', ''),
                                        'pages': metadata.get('pages', ''),
                                        'duration': metadata.get('duration', ''),
                                        'views': metadata.get('views', ''),
                                        'topicTags': metadata.get('topicTags', ''),
                                        'semester': metadata.get('semester', ''),
                                        'unit': metadata.get('unit', ''),
                                        'topic': metadata.get('topic', ''),
                                        'url': metadata.get('url', ''),
                                        'videoId': metadata.get('videoId', ''),
                                        'isbn': metadata.get('isbn', ''),
                                        'publisher': metadata.get('publisher', ''),
                                        'publication_year': metadata.get('publication_year', ''),
                                        'category': metadata.get('category', ''),
                                        'approved': metadata.get('approved', 'Unknown')
                                    }
                                    relevant_content.append(resource_info)
                                    
                except Exception as e:
                    logger.warning(f"Failed to search namespace {namespace}: {e}")
                    continue
            
            # Sort by relevance and remove duplicates
            unique_content = []
            seen_content = set()
            
            for item in relevant_content:
                content_hash = hash(item['content'][:100])  # Hash first 100 chars
                if content_hash not in seen_content:
                    seen_content.add(content_hash)
                    unique_content.append(item['content'])
            
            # Limit to top 5 most relevant results
            final_content = unique_content[:5]
            
            logger.info(f"Enhanced RAG search found {len(final_content)} unique relevant resources")
            return final_content
            
        except Exception as e:
            logger.error(f"Enhanced RAG search failed: {e}")
            return []

    def create_roadmap_prompt(self, user_profile: str, relevant_content: List[str]) -> str:
        """Create a structured prompt optimized for fine-tuned roadmap generation LLM"""
        
        # Format relevant content from RAG search
        content_context = ""
        if relevant_content:
            content_context = "\n".join([
                f"📚 Resource {i+1}: {content[:250]}..." 
                for i, content in enumerate(relevant_content[:3])
            ])
        else:
            content_context = "📚 Using general knowledge base for roadmap generation."
        
        # Optimized prompt for fine-tuned roadmap generation LLM
        prompt = f"""🎯 PERSONALIZED LEARNING ROADMAP GENERATION REQUEST

👤 USER PROFILE:
{user_profile}

📖 RELEVANT LEARNING RESOURCES:
{content_context}

🗺️ ROADMAP GENERATION INSTRUCTIONS:
Generate a comprehensive 4-phase learning roadmap that is:
- Personalized to the user's skill level and goals
- Practical with actionable steps
- Progressive from foundation to mastery
- Includes specific milestones and resources

📋 REQUIRED ROADMAP STRUCTURE:

Phase 1: Foundation Building (Weeks 1-2)
🎯 Objectives: [Core concepts and setup]
📚 Resources: [Specific learning materials]
🛠️ Activities: [Hands-on exercises]
✅ Milestone: [Completion criteria]

Phase 2: Skill Development (Weeks 3-4)
🎯 Objectives: [Intermediate concepts and practice]
📚 Resources: [Advanced learning materials]
🛠️ Activities: [Projects and practice]
✅ Milestone: [Progress measurement]

Phase 3: Practical Application (Weeks 5-6)
🎯 Objectives: [Real-world application]
📚 Resources: [Project-based learning]
🛠️ Activities: [Portfolio development]
✅ Milestone: [Tangible outcomes]

Phase 4: Mastery & Specialization (Weeks 7-8)
🎯 Objectives: [Advanced topics and expertise]
📚 Resources: [Specialized content]
🛠️ Activities: [Community contribution]
✅ Milestone: [Mastery demonstration]

🚀 GENERATE PERSONALIZED ROADMAP:"""
        
        return prompt
    
    async def generate_roadmap_content(self, prompt: str) -> str:
        """Generate roadmap content using the fine-tuned LLM optimized for roadmap generation"""
        self.ensure_initialized()
        
        try:
            # Ensure we have valid generator and tokenizer
            if not self.generator or not self.tokenizer:
                logger.warning("Generator or tokenizer not properly initialized, using template")
                return self.generate_template_roadmap()
            
            # Calculate optimal generation parameters
            prompt_length = len(prompt.split())
            max_new_tokens = min(400, self.max_length - prompt_length)
            
            logger.info(f"Generating roadmap with prompt length: {prompt_length}, max new tokens: {max_new_tokens}")
            
            # Generate with optimized parameters for roadmap content
            results = self.generator(
                prompt,
                max_length=prompt_length + max_new_tokens,
                num_return_sequences=1,
                temperature=0.7,  # Slightly lower for more focused content
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id,
                repetition_penalty=1.2,  # Higher to avoid repetition
                no_repeat_ngram_size=3,
                top_p=0.9,  # Nucleus sampling for better quality
                top_k=50   # Limit vocabulary for coherence
            )
            
            generated_text = results[0]['generated_text']
            
            # Extract only the generated part (after the prompt)
            roadmap_content = generated_text[len(prompt):].strip()
            
            # Validate and enhance the generated content
            if len(roadmap_content) < 200:
                logger.warning("Generated content too short, enhancing with template")
                return self.enhance_generated_content(roadmap_content)
            
            logger.info(f"Successfully generated roadmap content: {len(roadmap_content)} characters")
            return roadmap_content
            
        except Exception as e:
            logger.error(f"Failed to generate roadmap content: {e}")
            # Fallback to template-based generation
            return self.generate_template_roadmap()
    
    def enhance_generated_content(self, generated_content: str) -> str:
        """Enhance short generated content with template structure"""
        template = self.generate_template_roadmap()
        
        if generated_content and len(generated_content) > 50:
            return f"{generated_content}\n\n{template}"
        else:
            return template
    
    def generate_template_roadmap(self) -> str:
        """Fallback template-based roadmap generation"""
        return """
Phase 1: Foundation (Weeks 1-2)
- Learn fundamental concepts and terminology
- Complete introductory tutorials and exercises
- Set up your development environment
- Milestone: Basic understanding of core concepts

Phase 2: Building (Weeks 3-4)  
- Practice hands-on exercises and small projects
- Study intermediate concepts and techniques
- Join learning communities and forums
- Milestone: Ability to solve basic problems independently

Phase 3: Application (Weeks 5-6)
- Work on a real-world project
- Apply learned concepts to practical scenarios
- Seek feedback from peers and mentors
- Milestone: Completed project demonstrating skills

Phase 4: Mastery (Weeks 7-8)
- Refine and optimize your knowledge
- Explore advanced topics and specializations
- Contribute to open-source projects or community
- Milestone: Teaching others and continuous learning plan
        """.strip()
    
    async def generate_personalized_roadmap(
        self, 
        roadmap_data: Dict[str, Any], 
        relevant_content: Optional[List[Any]] = None
    ) -> Dict[str, Any]:
        """Generate a complete personalized roadmap using comprehensive user data and RAG content"""
        
        try:
            logger.info("🚀 Starting comprehensive personalized roadmap generation...")
            
            # Check for subject-based phase organization (StudyPES unit structure)
            subject_based_phases = roadmap_data.get('subject_based_phases', [])
            unit_organization = len(subject_based_phases) > 0
            
            if unit_organization:
                logger.info(f"📚 Using StudyPES unit-based organization: {len(subject_based_phases)} phases")
                return await self.generate_unit_based_roadmap(roadmap_data, relevant_content, subject_based_phases)
            else:
                logger.info("📝 Using general knowledge-based roadmap generation")
                return await self.generate_general_roadmap(roadmap_data, relevant_content)
            
        except Exception as e:
            logger.error(f"Failed to generate comprehensive personalized roadmap: {e}")
            raise

    async def generate_unit_based_roadmap(
        self,
        roadmap_data: Dict[str, Any],
        relevant_content: Optional[List[Any]] = None,
        subject_based_phases: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Generate roadmap organized by StudyPES subject units"""
        
        try:
            logger.info("🏗️ Generating unit-based roadmap from StudyPES materials...")
            
            # Format comprehensive user profile
            user_profile = self.format_user_profile(roadmap_data)
            
            # Safety check for subject_based_phases
            if not subject_based_phases:
                subject_based_phases = []
            
            # Create structured phases based on subject units
            structured_phases = []
            total_resources = 0
            
            for phase_info in subject_based_phases:
                phase_resources = phase_info.get('resources', [])
                total_resources += len(phase_resources)
                
                # Extract key information for this unit
                unit_content = []
                for resource in phase_resources:
                    resource_info = {
                        'title': resource.get('title', 'Untitled'),
                        'fileName': resource.get('fileName', ''),
                        'file_url': resource.get('file_url', ''),
                        'pages': resource.get('pages', ''),
                        'level': resource.get('level', ''),
                        'tags': resource.get('tags', ''),
                        'topic': resource.get('topic', ''),
                        'content_preview': resource.get('content', '')[:200]
                    }
                    unit_content.append(resource_info)
                
                # Create phase structure
                phase = {
                    'title': phase_info['title'],
                    'subject': phase_info['subject'],
                    'unit': phase_info['unit'],
                    'semester': phase_info['semester'],
                    'content': f"Study {phase_info['subject']} Unit {phase_info['unit']} materials. This unit covers foundational concepts and practical applications. Work through all provided PDFs and resources systematically.",
                    'duration': f"Week {phase_info['phase_number']}",
                    'objectives': [
                        f"Master {phase_info['subject']} Unit {phase_info['unit']} concepts",
                        "Complete all reading materials and practice exercises",
                        "Apply learned concepts through practical examples",
                        "Prepare for unit assessment and next unit progression"
                    ],
                    'resources': unit_content,
                    'milestones': [
                        f"Complete all Unit {phase_info['unit']} PDFs",
                        "Understand key concepts and definitions",
                        "Practice with exercises and examples",
                        "Ready to progress to next unit"
                    ],
                    'resource_count': len(phase_resources)
                }
                structured_phases.append(phase)
            
            # Generate roadmap content summary
            subject_name = subject_based_phases[0]['subject'] if subject_based_phases else 'Selected Subject'
            roadmap_content = f"""🎯 {subject_name} Learning Roadmap

This roadmap is organized by academic units, following the structured curriculum from StudyPES materials.

📚 Course Structure:
• Subject: {subject_name}
• Total Phases: {len(structured_phases)} units
• Study Resources: {total_resources} PDFs and materials
• Semester: {subject_based_phases[0]['semester'] if subject_based_phases else 'N/A'}

🗓️ Learning Path:
Phase 1 (Week 1-2): {subject_name} Unit 1 - Foundation concepts and fundamentals
Phase 2 (Week 3-4): {subject_name} Unit 2 - Intermediate topics and applications  
Phase 3 (Week 5-6): {subject_name} Unit 3 - Advanced concepts and problem solving
Phase 4 (Week 7-8): {subject_name} Unit 4 - Complex topics and integration

📈 Study Approach:
• Follow unit progression sequentially
• Complete all PDF resources in each unit
• Practice with examples and exercises
• Review and consolidate before moving to next unit

🎯 Learning Outcomes:
By following this unit-based roadmap, you will systematically master {subject_name} 
from foundational concepts to advanced applications, aligned with academic curriculum standards."""

            # Calculate personalization score
            personalization_score = 0.85  # High score for structured curriculum
            
            # Create comprehensive response
            roadmap_response = {
                "user_profile": user_profile,
                "roadmap_content": roadmap_content,
                "generated_at": datetime.utcnow().isoformat(),
                "model_used": "StudyPES Unit-Based Organization",
                "relevant_resources": total_resources,
                "phases": structured_phases,
                "estimated_duration": f"{len(structured_phases)*2} weeks",
                "personalization_score": personalization_score,
                "rag_integration": "StudyPES Unit-Based Curriculum",
                "organization_type": "subject_units",
                "subject_info": {
                    "subject": subject_name,
                    "total_units": len(structured_phases),
                    "semester": subject_based_phases[0]['semester'] if subject_based_phases else 'N/A'
                }
            }
            
            logger.info(f"✅ Unit-based roadmap generated! Subject: {subject_name}, Units: {len(structured_phases)}")
            return roadmap_response
            
        except Exception as e:
            logger.error(f"Failed to generate unit-based roadmap: {e}")
            raise

    async def generate_general_roadmap(
        self, 
        roadmap_data: Dict[str, Any], 
        relevant_content: Optional[List[Any]] = None
    ) -> Dict[str, Any]:
        """Generate a general knowledge-based roadmap when no unit structure is available"""
        
        try:
            logger.info("📝 Generating general knowledge-based roadmap...")
            
            # Format comprehensive user profile
            user_profile = self.format_user_profile(roadmap_data)
            logger.info(f"📋 Created comprehensive user profile: {len(user_profile)} characters")
            
            # Process rich content with metadata if provided
            processed_content = []
            if relevant_content:
                for content_item in relevant_content:
                    if isinstance(content_item, dict):
                        # Rich content with metadata
                        processed_content.append({
                            'text': content_item.get('content', ''),
                            'source': content_item.get('source', 'unknown'),
                            'relevance': content_item.get('relevance_score', 0.5),
                            'metadata': content_item.get('metadata', {})
                        })
                    else:
                        # Simple string content
                        processed_content.append({
                            'text': str(content_item),
                            'source': 'rag_search',
                            'relevance': 0.7,
                            'metadata': {}
                        })
            
            logger.info(f"📚 Processed {len(processed_content)} content sources for roadmap")
            
            # Create enhanced generation prompt with rich context
            prompt = self.create_enhanced_roadmap_prompt(user_profile, processed_content, roadmap_data)
            
            # Generate roadmap content
            roadmap_content = await self.generate_roadmap_content(prompt)
            logger.info(f"📝 Generated roadmap content: {len(roadmap_content)} characters")
            
            # Extract structured phases from content
            phases = self.extract_enhanced_phases(roadmap_content, roadmap_data)
            
            # Calculate enhanced personalization score
            personalization_score = self.calculate_enhanced_personalization_score(roadmap_data, processed_content)
            
            # Create comprehensive response
            roadmap_response = {
                "user_profile": user_profile,
                "roadmap_content": roadmap_content,
                "generated_at": datetime.utcnow().isoformat(),
                "model_used": self.model_name,
                "relevant_resources": len(processed_content),
                "phases": phases,
                "estimated_duration": self.calculate_dynamic_duration(roadmap_data),
                "personalization_score": personalization_score,
                "rag_integration": "Enhanced MCP-based RAG system with metadata",
                "content_sources": {
                    source: len([c for c in processed_content if c['source'] == source])
                    for source in set(c['source'] for c in processed_content)
                } if processed_content else {},
                "search_effectiveness": sum(c['relevance'] for c in processed_content) / len(processed_content) if processed_content else 0.0
            }
            
            logger.info(f"✅ Comprehensive roadmap generated! Score: {personalization_score:.2f}")
            return roadmap_response
            
        except Exception as e:
            logger.error(f"Failed to generate general roadmap: {e}")
            raise
    
    def create_enhanced_roadmap_prompt(self, user_profile: str, processed_content: List[Dict], roadmap_data: Dict) -> str:
        """Create an enhanced prompt that fully utilizes user data and RAG content"""
        
        # Format rich content context
        content_context = ""
        if processed_content:
            high_quality_content = sorted(processed_content, key=lambda x: x['relevance'], reverse=True)[:5]
            content_sections = []
            
            for i, content in enumerate(high_quality_content):
                source_info = f"[{content['source'].upper()}]"
                relevance_info = f"(Relevance: {content['relevance']:.2f})"
                content_sections.append(
                    f"📚 Resource {i+1} {source_info} {relevance_info}:\n{content['text'][:400]}..."
                )
            
            content_context = "\n\n".join(content_sections)
        else:
            content_context = "📚 Using general knowledge base for roadmap generation."
        
        # Extract specific user preferences for targeted roadmap
        user_context = roadmap_data.get('user_context', {})
        phase1 = roadmap_data.get('phase1', {})
        phase5 = roadmap_data.get('phase5', {})
        
        domain = phase1.get('domain') or user_context.get('domain', 'general learning')
        ultimate_goal = phase5.get('ultimate_goal') or user_context.get('ultimate_goal', 'skill development')
        time_commitment = phase5.get('time_commitment') or user_context.get('time_commitment', '1-2 hours')
        
        # Enhanced prompt with full context utilization
        prompt = f"""🎯 COMPREHENSIVE PERSONALIZED LEARNING ROADMAP GENERATION

👤 DETAILED USER PROFILE:
{user_profile}

📖 CURATED LEARNING RESOURCES FROM RAG SEARCH:
{content_context}

🗺️ INTELLIGENT ROADMAP GENERATION INSTRUCTIONS:
Create a highly personalized learning roadmap for {domain} that:
- Matches the user's {ultimate_goal} goal
- Fits their {time_commitment} daily commitment
- Leverages their existing strengths and addresses weaknesses
- Incorporates the learning style and preferences mentioned
- Uses the curated resources above when relevant
- Provides actionable, measurable steps

📋 REQUIRED COMPREHENSIVE ROADMAP STRUCTURE:

🚀 Phase 1: Foundation & Setup (Duration based on user level)
🎯 Objectives: [Tailored to user's current level and domain]
📚 Key Resources: [From RAG search + recommended materials]
🛠️ Daily Activities: [Matching time commitment and learning style]
📊 Progress Metrics: [Specific to user's goals]
✅ Completion Milestone: [Measurable achievement]

📈 Phase 2: Core Skill Development
🎯 Objectives: [Building on user's strengths, addressing gaps]
📚 Key Resources: [Advanced materials matching preferences]
🛠️ Practical Exercises: [Projects relevant to ultimate goal]
📊 Progress Metrics: [Skills assessment and feedback]
✅ Completion Milestone: [Demonstrable competency]

🔥 Phase 3: Advanced Application & Practice
🎯 Objectives: [Real-world application toward ultimate goal]
📚 Key Resources: [Specialized content for user's path]
🛠️ Portfolio Projects: [Aligned with career/academic goals]
📊 Progress Metrics: [Portfolio quality and complexity]
✅ Completion Milestone: [Professional-level deliverable]

🌟 Phase 4: Mastery & Specialization
🎯 Objectives: [Expert-level skills for ultimate goal achievement]
📚 Key Resources: [Cutting-edge, advanced materials]
🛠️ Leadership Activities: [Teaching, contributing, innovating]
📊 Progress Metrics: [Community recognition, expert validation]
✅ Completion Milestone: [Goal achievement and next-level planning]

🚀 GENERATE PERSONALIZED ROADMAP FOR {domain.upper()}:"""
        
        return prompt
    
    def extract_enhanced_phases(self, roadmap_content: str, roadmap_data: Dict) -> List[Dict[str, Any]]:
        """Extract enhanced phase information with more detail"""
        phases = []
        
        # More sophisticated phase extraction
        lines = roadmap_content.split('\n')
        current_phase = None
        current_phase_data = {}
        
        for line in lines:
            line = line.strip()
            
            # Detect phase headers
            if ('Phase' in line or '🚀' in line or '📈' in line or '🔥' in line or '🌟' in line) and ':' in line:
                # Save previous phase
                if current_phase and current_phase_data:
                    phases.append({
                        "title": current_phase,
                        "content": current_phase_data.get('content', ''),
                        "duration": current_phase_data.get('duration', 'Variable'),
                        "objectives": current_phase_data.get('objectives', []),
                        "resources": current_phase_data.get('resources', []),
                        "milestones": current_phase_data.get('milestones', [])
                    })
                
                # Start new phase
                current_phase = line
                current_phase_data = {'content': '', 'objectives': [], 'resources': [], 'milestones': []}
            
            elif line and current_phase:
                # Categorize content
                if line.startswith('🎯') or 'Objectives:' in line:
                    current_phase_data['objectives'].append(line)
                elif line.startswith('📚') or 'Resources:' in line:
                    current_phase_data['resources'].append(line)
                elif line.startswith('✅') or 'Milestone:' in line:
                    current_phase_data['milestones'].append(line)
                else:
                    current_phase_data['content'] += line + '\n'
        
        # Save last phase
        if current_phase and current_phase_data:
            phases.append({
                "title": current_phase,
                "content": current_phase_data.get('content', ''),
                "duration": current_phase_data.get('duration', 'Variable'),
                "objectives": current_phase_data.get('objectives', []),
                "resources": current_phase_data.get('resources', []),
                "milestones": current_phase_data.get('milestones', [])
            })
        
        return phases
    
    def calculate_enhanced_personalization_score(self, roadmap_data: Dict[str, Any], processed_content: List[Dict]) -> float:
        """Calculate enhanced personalization score considering all factors"""
        
        # Weight different aspects of personalization
        weights = {
            'user_data_completeness': 0.4,  # How complete is user data
            'content_relevance': 0.3,       # How relevant is RAG content
            'goal_alignment': 0.2,          # How well aligned with user goals
            'preference_matching': 0.1      # How well preferences are incorporated
        }
        
        scores = {}
        
        # 1. User data completeness
        total_fields = 0
        filled_fields = 0
        for phase_key, phase_data in roadmap_data.items():
            if isinstance(phase_data, dict) and phase_key.startswith('phase'):
                for value in phase_data.values():
                    total_fields += 1
                    if value and str(value).strip() and str(value) != 'None':
                        filled_fields += 1
        
        scores['user_data_completeness'] = filled_fields / total_fields if total_fields > 0 else 0.0
        
        # 2. Content relevance (from RAG)
        if processed_content:
            avg_relevance = sum(c['relevance'] for c in processed_content) / len(processed_content)
            scores['content_relevance'] = avg_relevance
        else:
            scores['content_relevance'] = 0.3  # Default for template-based
        
        # 3. Goal alignment
        user_context = roadmap_data.get('user_context', {})
        has_clear_goal = bool(user_context.get('ultimate_goal') or user_context.get('domain'))
        has_timeline = bool(user_context.get('time_commitment'))
        has_level = bool(user_context.get('current_level'))
        
        scores['goal_alignment'] = (has_clear_goal + has_timeline + has_level) / 3.0
        
        # 4. Preference matching
        preferences_count = sum([
            bool(user_context.get('learning_style')),
            bool(user_context.get('material_preference')),
            bool(user_context.get('challenge_level')),
            bool(user_context.get('core_strengths'))
        ])
        scores['preference_matching'] = preferences_count / 4.0
        
        # Calculate weighted final score
        final_score = sum(scores[aspect] * weights[aspect] for aspect in weights)
        
        logger.info(f"📊 Personalization breakdown: {scores}")
        return round(final_score, 3)
    
    def calculate_dynamic_duration(self, roadmap_data: Dict[str, Any]) -> str:
        """Calculate dynamic duration based on user preferences and commitment"""
        
        user_context = roadmap_data.get('user_context', {})
        time_commitment = user_context.get('time_commitment', '1-2 hours')
        current_level = user_context.get('current_level', 'beginner')
        weekly_days = user_context.get('weekly_days', '3-5')
        
        # Base duration mapping
        duration_mapping = {
            ('beginner', '1-2 hours'): '10-12 weeks',
            ('beginner', '3-5 hours'): '8-10 weeks', 
            ('beginner', '5+ hours'): '6-8 weeks',
            ('intermediate', '1-2 hours'): '8-10 weeks',
            ('intermediate', '3-5 hours'): '6-8 weeks',
            ('intermediate', '5+ hours'): '4-6 weeks',
            ('advanced', '1-2 hours'): '6-8 weeks',
            ('advanced', '3-5 hours'): '4-6 weeks',
            ('advanced', '5+ hours'): '3-4 weeks'
        }
        
        # Adjust based on weekly commitment
        base_duration = duration_mapping.get((current_level, time_commitment), '8-10 weeks')
        
        if '1-2' in weekly_days:
            # Less frequent learning, extend duration
            if 'weeks' in base_duration:
                numbers = [int(x) for x in base_duration.split() if x.isdigit()]
                if numbers:
                    extended = [n + 2 for n in numbers]
                    base_duration = f"{extended[0]}-{extended[-1]} weeks"
        
        return base_duration
    
    def extract_phases(self, roadmap_content: str) -> List[Dict[str, str]]:
        """Extract phase information from generated content"""
        phases = []
        
        # Simple extraction based on common patterns
        lines = roadmap_content.split('\n')
        current_phase = None
        current_content = []
        
        for line in lines:
            line = line.strip()
            if 'Phase' in line and ':' in line:
                # Save previous phase
                if current_phase:
                    phases.append({
                        "title": current_phase,
                        "content": '\n'.join(current_content)
                    })
                
                # Start new phase
                current_phase = line
                current_content = []
            elif line and current_phase:
                current_content.append(line)
        
        # Save last phase
        if current_phase:
            phases.append({
                "title": current_phase,
                "content": '\n'.join(current_content)
            })
        
        return phases
    
    def calculate_personalization_score(self, roadmap_data: Dict[str, Any]) -> float:
        """Calculate how well the roadmap is personalized (0.0 to 1.0)"""
        
        # Count filled fields across all phases
        filled_fields = 0
        total_fields = 0
        
        for phase_data in roadmap_data.values():
            if isinstance(phase_data, dict):
                for value in phase_data.values():
                    total_fields += 1
                    if value and str(value).strip():
                        filled_fields += 1
        
        return filled_fields / total_fields if total_fields > 0 else 0.0

# Global instance
roadmap_generator = RoadmapGenerator()
