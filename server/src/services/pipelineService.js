const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const pipelineDB = require('./pipelineDatabase');

class PipelineIntegrationService {
  constructor() {
    // Path to the Python pipeline
    this.pipelinePath = process.env.PIPELINE_PATH || '/Users/sandeeph/Documents/s2/Axiona/Pipline';
    this.pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python3';
    this.pipelineScript = 'ultimate_production_pipeline.py';
    this.timeout = 120000; // 2 minutes timeout for pipeline generation
  }

  /**
   * Generate interview questions using the pipeline
   */
  async generateInterviewQuestions(learningGoal, subject) {
    try {
      console.log(`🎯 Generating interview questions for: ${learningGoal} (${subject})`);
      
      // Create a temporary script to call just the interview agent
      const tempScript = `
import asyncio
import sys
import json
sys.path.insert(0, '.')

from ultimate_production_pipeline import ProductionLLMService, ProductionAgentSystem, ProductionRAGService

async def generate_questions():
    try:
        # Initialize services
        llm_service = ProductionLLMService()
        
        # Initialize database manager
        from core.db_manager import DatabaseManager
        db_manager = DatabaseManager()
        
        # Initialize RAG service
        rag_service = ProductionRAGService(db_manager)
        await rag_service.initialize()
        
        # Initialize agent system
        agent_system = ProductionAgentSystem(llm_service, rag_service)
        
        # Generate interview questions
        questions = await agent_system.interview_agent("${learningGoal}", "${subject}")
        
        print(json.dumps(questions))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

asyncio.run(generate_questions())
`;

      const tempFile = path.join(this.pipelinePath, 'temp_questions.py');
      await fs.writeFile(tempFile, tempScript);

      const result = await this.executePythonScript('temp_questions.py');
      
      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {}); // Ignore cleanup errors
      
      if (result.error) {
        throw new Error(`Pipeline error: ${result.error}`);
      }
      
      return result.questions || [];
      
    } catch (error) {
      console.error('❌ Interview questions generation failed:', error);
      
      // Return fallback questions
      return [
        {
          question_id: "q1",
          question_text: `What is your current experience with ${subject}?`,
          question_type: "open_ended",
          category: "current_knowledge",
          required: true,
          context: "Assess background knowledge"
        },
        {
          question_id: "q2",
          question_text: "What learning style works best for you?",
          question_type: "open_ended", 
          category: "learning_preferences",
          required: true,
          context: "Understand learning preferences"
        },
        {
          question_id: "q3",
          question_text: "How many hours per week can you dedicate to learning?",
          question_type: "rating_scale",
          category: "time_availability", 
          required: true,
          context: "Plan appropriate schedule"
        },
        {
          question_id: "q4",
          question_text: `What specific topics in ${subject} interest you most?`,
          question_type: "open_ended",
          category: "goals",
          required: true,
          context: "Customize learning focus"
        },
        {
          question_id: "q5",
          question_text: "What programming or technical background do you have?",
          question_type: "open_ended",
          category: "prerequisites", 
          required: true,
          context: "Assess technical readiness"
        }
      ];
    }
  }

  /**
   * Generate complete roadmap using the pipeline
   */
  async generateRoadmap(answers, learningGoal, subject, userId, hoursPerWeek = 10) {
    try {
      console.log(`🚀 Generating roadmap for user ${userId}: ${learningGoal}`);
      
      // Create a temporary script to call the complete pipeline
      const tempScript = `
import asyncio
import sys
import json
sys.path.insert(0, '.')

from ultimate_production_pipeline import UltimateRoadmapOrchestrator

async def generate_roadmap():
    try:
        # Initialize orchestrator
        orchestrator = UltimateRoadmapOrchestrator()
        await orchestrator.initialize()
        
        # Generate roadmap
        roadmap = await orchestrator.generate_complete_roadmap(
            learning_goal="${learningGoal}",
            subject="${subject}",
            user_background="intermediate",
            hours_per_week=${hoursPerWeek}
        )
        
        # Add user ID to roadmap
        roadmap["user_id"] = "${userId}"
        
        print(json.dumps(roadmap, default=str))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

asyncio.run(generate_roadmap())
`;

      const tempFile = path.join(this.pipelinePath, 'temp_roadmap.py');
      await fs.writeFile(tempFile, tempScript);

      console.log('🔄 Executing pipeline for roadmap generation...');
      const result = await this.executePythonScript('temp_roadmap.py', this.timeout);
      
      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {}); // Ignore cleanup errors
      
      if (result.error) {
        throw new Error(`Pipeline error: ${result.error}`);
      }
      
      // Save roadmap to pipeline database
      if (result.roadmap_id) {
        await pipelineDB.saveRoadmap(result);
        console.log('✅ Roadmap saved to pipeline database');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Roadmap generation failed:', error);
      throw error;
    }
  }

  /**
   * Execute Python script and return parsed JSON result
   */
  async executePythonScript(scriptName, timeoutMs = 60000) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.pipelinePath, scriptName);
      
      console.log(`🐍 Executing: ${this.pythonExecutable} ${scriptPath}`);
      
      const pythonProcess = spawn(this.pythonExecutable, [scriptPath], {
        cwd: this.pipelinePath,
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let finished = false;

      // Set timeout
      const timeout = setTimeout(() => {
        if (!finished) {
          finished = true;
          pythonProcess.kill();
          reject(new Error(`Pipeline execution timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log('Pipeline stderr:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        
        if (finished) return; // Already handled by timeout
        finished = true;

        console.log(`🏁 Pipeline process finished with code: ${code}`);
        
        if (code !== 0) {
          console.error('Pipeline stderr:', stderr);
          reject(new Error(`Pipeline process failed with exit code ${code}: ${stderr}`));
          return;
        }

        try {
          // Parse JSON from stdout
          const lines = stdout.trim().split('\n');
          let jsonResult = null;
          
          // Find the JSON output (usually the last valid JSON line)
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('{') || line.startsWith('[')) {
              try {
                jsonResult = JSON.parse(line);
                break;
              } catch (e) {
                continue;
              }
            }
          }
          
          if (!jsonResult) {
            // If no JSON found, try to parse entire stdout
            jsonResult = JSON.parse(stdout.trim());
          }
          
          resolve(jsonResult);
          
        } catch (error) {
          console.error('❌ Failed to parse pipeline output as JSON:', error);
          console.log('Raw stdout:', stdout);
          reject(new Error(`Failed to parse pipeline output: ${error.message}`));
        }
      });

      pythonProcess.on('error', (error) => {
        clearTimeout(timeout);
        if (!finished) {
          finished = true;
          reject(new Error(`Failed to start pipeline process: ${error.message}`));
        }
      });
    });
  }

  /**
   * Test pipeline connectivity
   */
  async testPipeline() {
    try {
      console.log('🧪 Testing pipeline connectivity...');
      
      // Simple test script
      const testScript = `
import sys
import json
sys.path.insert(0, '.')

try:
    from ultimate_production_pipeline import ProductionLLMService
    print(json.dumps({"status": "success", "message": "Pipeline accessible"}))
except Exception as e:
    print(json.dumps({"status": "error", "message": str(e)}))
`;

      const tempFile = path.join(this.pipelinePath, 'temp_test.py');
      await fs.writeFile(tempFile, testScript);

      const result = await this.executePythonScript('temp_test.py', 30000);
      
      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {});
      
      return result;
      
    } catch (error) {
      console.error('❌ Pipeline test failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Get pipeline status and health check
   */
  async getStatus() {
    try {
      const [pipelineTest, dbHealth] = await Promise.all([
        this.testPipeline(),
        pipelineDB.healthCheck()
      ]);
      
      return {
        pipeline: pipelineTest,
        database: dbHealth,
        overall_status: (pipelineTest.status === 'success' && dbHealth.status === 'healthy') ? 'healthy' : 'unhealthy'
      };
      
    } catch (error) {
      return {
        pipeline: { status: 'error', message: 'Pipeline unreachable' },
        database: { status: 'unhealthy', message: error.message },
        overall_status: 'unhealthy'
      };
    }
  }

  /**
   * Get interview questions (enhanced to call pipeline when available)
   */
  async getInterviewQuestions(learningGoal = "Software Engineering", subject = "Computer Science") {
    try {
      console.log('🎯 Fetching interview questions from pipeline...');
      
      // Try to get questions from pipeline first
      try {
        const pipelineQuestions = await this.generateInterviewQuestions(learningGoal, subject);
        if (pipelineQuestions && pipelineQuestions.length > 0) {
          console.log('✅ Got questions from pipeline:', pipelineQuestions.length);
          return pipelineQuestions;
        }
      } catch (pipelineError) {
        console.warn('⚠️ Pipeline questions unavailable, using fallback:', pipelineError.message);
      }
      
      // Fallback to enhanced default questions with more detailed options
      console.log('🔄 Using enhanced default interview questions...');
      const defaultQuestions = [
        {
          id: 1,
          question: "What is your primary learning goal?",
          type: "multiple-choice",
          category: "learning_goals",
          required: true,
          options: [
            "Software Engineering Career",
            "Data Science & Analytics", 
            "Web Development",
            "Mobile Development",
            "DevOps & Cloud Computing",
            "Machine Learning & AI",
            "Cybersecurity",
            "Game Development",
            "Backend Development",
            "Frontend Development",
            "Full Stack Development",
            "Other"
          ]
        },
        {
          id: 2,
          question: "What is your current experience level in technology?",
          type: "multiple-choice", 
          category: "experience_level",
          required: true,
          options: [
            "Complete Beginner (No programming experience)",
            "Hobbyist (Basic programming knowledge)",
            "Student (Currently learning CS/IT)",
            "Junior Developer (0-2 years experience)",
            "Mid-level Developer (2-5 years experience)",
            "Senior Developer (5+ years experience)",
            "Expert/Technical Lead (10+ years experience)"
          ]
        },
        {
          id: 3,
          question: "How much time can you dedicate to learning per week?",
          type: "multiple-choice",
          category: "time_commitment", 
          required: true,
          options: [
            "1-3 hours (Casual learning)",
            "3-7 hours (Part-time commitment)",
            "7-15 hours (Serious commitment)",
            "15-25 hours (Intensive learning)",
            "25+ hours (Full-time dedication)"
          ]
        },
        {
          id: 4,
          question: "What are your preferred learning methods? (Select all that apply)",
          type: "multiple-select",
          category: "learning_style",
          required: true,
          options: [
            "Video tutorials and courses",
            "Reading technical documentation",
            "Hands-on coding projects",
            "Interactive coding challenges", 
            "Books and written resources",
            "Online courses with assignments",
            "Mentorship and guidance",
            "Study groups and peer learning",
            "Building real-world applications",
            "Open source contributions"
          ]
        },
        {
          id: 5,
          question: "What is your target timeline for achieving your main goal?",
          type: "multiple-choice",
          category: "timeline",
          required: true,
          options: [
            "1-3 months (Quick skill boost)",
            "3-6 months (Career transition prep)",
            "6-12 months (Comprehensive learning)",
            "1-2 years (Deep expertise building)",
            "2+ years (Long-term mastery)",
            "No specific timeline (Flexible learning)"
          ]
        },
        {
          id: 6,
          question: "What specific areas interest you most within your chosen field?",
          type: "multiple-select",
          category: "specialization",
          required: false,
          options: [
            "Algorithms and Data Structures",
            "System Design and Architecture", 
            "Database Design and Management",
            "Cloud Computing and Infrastructure",
            "API Development and Integration",
            "User Interface and User Experience",
            "Mobile App Development",
            "Artificial Intelligence and Machine Learning",
            "Cybersecurity and Privacy",
            "DevOps and Automation",
            "Testing and Quality Assurance",
            "Performance Optimization"
          ]
        }
      ];
      
      return defaultQuestions;
      
    } catch (error) {
      console.error('❌ Error getting interview questions:', error);
      throw new Error('Failed to get interview questions');
    }
  }

  /**
   * Get user's roadmap from database
   */
  async getUserRoadmap(userId) {
    try {
      console.log(`🔍 Fetching roadmap for user: ${userId}`);
      
      const roadmap = await this.pipelineDb.getRoadmapByUserId(userId);
      return roadmap;
      
    } catch (error) {
      console.error(`❌ Error fetching roadmap for user ${userId}:`, error);
      throw new Error('Failed to fetch user roadmap');
    }
  }

  /**
   * Generate roadmap based on user answers (Enhanced pipeline integration)
   */
  async generateRoadmapFromAnswers(userId, userAnswers) {
    try {
      console.log(`🚀 Generating roadmap for user: ${userId}`);
      console.log('📝 User answers received:', userAnswers);
      
      // Extract learning parameters from answers with better parsing
      let learningGoal = "Software Engineering";
      let experienceLevel = "Beginner"; 
      let hoursPerWeek = 10;
      let timeline = "6 months";
      let learningMethods = ["hands-on projects"];
      let specializations = [];
      
      // Parse user answers with improved logic
      if (userAnswers && Array.isArray(userAnswers)) {
        userAnswers.forEach(answer => {
          switch(parseInt(answer.questionId) || answer.questionId) {
            case 1:
              learningGoal = answer.answer || learningGoal;
              break;
            case 2:
              experienceLevel = answer.answer || experienceLevel;
              break;
            case 3:
              // Enhanced time mapping
              const timeMapping = {
                "1-3 hours (Casual learning)": 2,
                "3-7 hours (Part-time commitment)": 5,
                "7-15 hours (Serious commitment)": 11,
                "15-25 hours (Intensive learning)": 20,
                "25+ hours (Full-time dedication)": 30,
                // Legacy support
                "1-5 hours": 3,
                "5-10 hours": 7,
                "10-20 hours": 15,
                "20+ hours": 25
              };
              hoursPerWeek = timeMapping[answer.answer] || 10;
              break;
            case 4:
              learningMethods = Array.isArray(answer.answer) ? answer.answer : [answer.answer];
              break;
            case 5:
              timeline = answer.answer || timeline;
              break;
            case 6:
              specializations = Array.isArray(answer.answer) ? answer.answer : [answer.answer];
              break;
          }
        });
      }
      
      console.log('📊 Parsed parameters:', { learningGoal, experienceLevel, hoursPerWeek, timeline, learningMethods, specializations });
      
      // Try to generate roadmap using the enhanced pipeline
      let roadmapResult = null;
      try {
        console.log('🔄 Attempting pipeline roadmap generation...');
        
        // Create enhanced input for pipeline
        const pipelineInput = {
          userId,
          learning_goal: learningGoal,
          experience_level: experienceLevel,
          hours_per_week: hoursPerWeek,
          timeline: timeline,
          learning_methods: learningMethods,
          specializations: specializations,
          user_answers: userAnswers
        };
        
        roadmapResult = await this.generateRoadmapWithPipeline(
          userAnswers, 
          learningGoal, 
          "Computer Science", 
          userId, 
          hoursPerWeek
        );
        
        console.log('✅ Pipeline roadmap generated successfully');
        
      } catch (pipelineError) {
        console.warn('⚠️ Pipeline roadmap generation failed, using enhanced fallback:', pipelineError.message);
        
        // Create enhanced fallback roadmap using our knowledge
        roadmapResult = await this.generateFallbackRoadmap(learningGoal, experienceLevel, hoursPerWeek, timeline, specializations, userId);
      }
      
      // Enhance roadmap with pipeline database resources
      if (roadmapResult) {
        roadmapResult = await this.enhanceRoadmapWithResources(roadmapResult, learningGoal);
      }
      
      // Save to pipeline database with enhanced structure
      const enhancedRoadmap = {
        user_id: userId,
        learning_goal: learningGoal,
        experience_level: experienceLevel,
        hours_per_week: hoursPerWeek,
        timeline: timeline,
        learning_methods: learningMethods,
        specializations: specializations,
        user_answers: userAnswers,
        generated_roadmap: roadmapResult,
        generation_method: roadmapResult?.source || 'enhanced_fallback',
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
      
      await pipelineDB.saveRoadmap(enhancedRoadmap);
      console.log('💾 Enhanced roadmap saved to pipeline database');
      
      return enhancedRoadmap;
      
    } catch (error) {
      console.error(`❌ Error generating roadmap:`, error);
      throw new Error('Failed to generate roadmap: ' + error.message);
    }
  }

  /**
   * Generate roadmap with pipeline (wrapper for the original method)
   */
  async generateRoadmapWithPipeline(answers, learningGoal, subject, userId, hoursPerWeek = 10) {
    return await this.generateRoadmap(answers, learningGoal, subject, userId, hoursPerWeek);
  }

  /**
   * Generate enhanced fallback roadmap
   */
  async generateFallbackRoadmap(learningGoal, experienceLevel, hoursPerWeek, timeline, specializations, userId) {
    console.log('🔧 Generating enhanced fallback roadmap...');
    
    const roadmapTemplates = {
      "Software Engineering Career": {
        phases: [
          {
            title: "Programming Fundamentals",
            duration: "4-6 weeks",
            description: "Master basic programming concepts and syntax",
            milestones: ["Variables and data types", "Control structures", "Functions", "Object-oriented programming"],
            resources: ["Python/Java basics", "Algorithm fundamentals"]
          },
          {
            title: "Data Structures & Algorithms",
            duration: "6-8 weeks", 
            description: "Learn essential computer science concepts",
            milestones: ["Arrays and linked lists", "Trees and graphs", "Sorting algorithms", "Big O notation"],
            resources: ["LeetCode practice", "Algorithm visualization tools"]
          },
          {
            title: "System Design Basics",
            duration: "4-6 weeks",
            description: "Understand how large systems are built",
            milestones: ["Database design", "API development", "Caching strategies", "Load balancing"],
            resources: ["System design primers", "Architecture patterns"]
          },
          {
            title: "Project Development",
            duration: "8-12 weeks",
            description: "Build real-world applications",
            milestones: ["Personal portfolio", "Full-stack application", "API integration", "Deployment"],
            resources: ["GitHub projects", "Cloud platforms", "CI/CD tools"]
          }
        ]
      },
      "Web Development": {
        phases: [
          {
            title: "Frontend Fundamentals", 
            duration: "3-4 weeks",
            description: "Learn HTML, CSS, and JavaScript basics",
            milestones: ["HTML structure", "CSS styling", "JavaScript programming", "DOM manipulation"],
            resources: ["MDN documentation", "Frontend tutorials"]
          },
          {
            title: "Modern Frontend",
            duration: "6-8 weeks",
            description: "Master modern frameworks and tools",
            milestones: ["React/Vue components", "State management", "Build tools", "Testing"],
            resources: ["React documentation", "Frontend frameworks"]
          },
          {
            title: "Backend Development",
            duration: "6-8 weeks", 
            description: "Server-side development skills",
            milestones: ["REST APIs", "Database integration", "Authentication", "Security"],
            resources: ["Node.js/Python", "Database tutorials"]
          },
          {
            title: "Full Stack Projects",
            duration: "8-10 weeks",
            description: "Build complete web applications", 
            milestones: ["Full-stack app", "Database design", "Deployment", "Performance optimization"],
            resources: ["Project templates", "Hosting platforms"]
          }
        ]
      },
      "Data Science & Analytics": {
        phases: [
          {
            title: "Python & Statistics",
            duration: "4-5 weeks",
            description: "Programming and mathematical foundations",
            milestones: ["Python basics", "Statistics concepts", "NumPy/Pandas", "Data visualization"],
            resources: ["Python tutorials", "Statistics courses"]
          },
          {
            title: "Machine Learning",
            duration: "8-10 weeks",
            description: "ML algorithms and techniques",
            milestones: ["Supervised learning", "Unsupervised learning", "Model evaluation", "Feature engineering"],
            resources: ["Scikit-learn", "ML courses", "Kaggle datasets"]
          },
          {
            title: "Data Engineering", 
            duration: "6-8 weeks",
            description: "Data pipeline and infrastructure",
            milestones: ["Data cleaning", "ETL processes", "Big data tools", "Cloud platforms"],
            resources: ["SQL tutorials", "Apache tools", "Cloud services"]
          },
          {
            title: "Advanced Analytics",
            duration: "8-12 weeks",
            description: "Advanced techniques and deployment",
            milestones: ["Deep learning", "MLOps", "Model deployment", "Business analytics"],
            resources: ["TensorFlow/PyTorch", "MLOps tools", "Analytics platforms"]
          }
        ]
      }
    };
    
    // Get template or default
    const template = roadmapTemplates[learningGoal] || roadmapTemplates["Software Engineering Career"];
    
    // Adjust timeline based on experience and time commitment
    const adjustmentFactor = this.calculateAdjustmentFactor(experienceLevel, hoursPerWeek);
    
    return {
      user_id: userId,
      learning_goal: learningGoal,
      experience_level: experienceLevel,
      estimated_duration: timeline,
      total_phases: template.phases.length,
      phases: template.phases.map((phase, index) => ({
        ...phase,
        phase_number: index + 1,
        adjusted_duration: this.adjustPhaseDuration(phase.duration, adjustmentFactor),
        status: 'not_started',
        progress: 0
      })),
      personalization_notes: `Roadmap customized for ${experienceLevel} level with ${hoursPerWeek} hours/week commitment`,
      source: 'enhanced_fallback',
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Calculate adjustment factor based on experience and time commitment
   */
  calculateAdjustmentFactor(experienceLevel, hoursPerWeek) {
    let factor = 1.0;
    
    // Experience adjustments
    if (experienceLevel.includes("Complete Beginner")) factor *= 1.5;
    else if (experienceLevel.includes("Junior") || experienceLevel.includes("Student")) factor *= 1.2;
    else if (experienceLevel.includes("Mid-level")) factor *= 0.8;
    else if (experienceLevel.includes("Senior") || experienceLevel.includes("Expert")) factor *= 0.6;
    
    // Time commitment adjustments
    if (hoursPerWeek <= 5) factor *= 1.3;
    else if (hoursPerWeek >= 20) factor *= 0.7;
    
    return factor;
  }

  /**
   * Adjust phase duration based on factor
   */
  adjustPhaseDuration(duration, factor) {
    // Simple duration adjustment logic
    const match = duration.match(/(\d+)-(\d+)\s*weeks/);
    if (match) {
      const min = Math.ceil(parseInt(match[1]) * factor);
      const max = Math.ceil(parseInt(match[2]) * factor);
      return `${min}-${max} weeks`;
    }
    return duration;
  }

  /**
   * Enhance roadmap with resources from pipeline database
   */
  async enhanceRoadmapWithResources(roadmap, learningGoal) {
    try {
      console.log('🔍 Enhancing roadmap with pipeline database resources...');
      
      // Get relevant PES materials
      const pesSubjectMap = {
        "Software Engineering Career": ["Computer Science", "Programming", "Software Engineering"],
        "Web Development": ["Web Development", "JavaScript", "Programming"],
        "Data Science & Analytics": ["Data Science", "Statistics", "Machine Learning", "Python"],
        "Machine Learning & AI": ["Machine Learning", "Artificial Intelligence", "Data Science"],
        "Mobile Development": ["Mobile Development", "Programming", "Software Engineering"]
      };
      
      const searchSubjects = pesSubjectMap[learningGoal] || ["Computer Science"];
      let allMaterials = [];
      
      // Search for materials in each subject
      for (const subject of searchSubjects) {
        try {
          const materials = await pipelineDB.getPESMaterialsBySubjectAndUnit(subject);
          allMaterials = allMaterials.concat(materials.slice(0, 3)); // Limit per subject
        } catch (error) {
          console.warn(`Could not fetch materials for subject ${subject}:`, error.message);
        }
      }
      
      // Get relevant reference books
      const bookFilters = { subject: learningGoal };
      const books = await pipelineDB.getReferenceBooks(bookFilters, { page: 1, limit: 5 });
      
      // Add resources to roadmap phases
      if (roadmap.phases && Array.isArray(roadmap.phases)) {
        roadmap.phases.forEach((phase, index) => {
          // Add PES materials to relevant phases
          if (allMaterials.length > 0) {
            const relevantMaterials = allMaterials.slice(index * 2, (index + 1) * 2);
            phase.pes_materials = relevantMaterials.map(material => ({
              title: material.title,
              gridfs_id: material.gridfs_id,
              pages: material.pages,
              subject: material.subject,
              unit: material.unit
            }));
          }
          
          // Add reference books to later phases
          if (books.books && books.books.length > 0 && index >= 1) {
            const relevantBooks = books.books.slice(0, 2);
            phase.reference_books = relevantBooks.map(book => ({
              title: book.title,
              author: book.author,
              gridfs_id: book.gridfs_id,
              pages: book.pages,
              description: book.description
            }));
          }
        });
      }
      
      // Add resource summary
      roadmap.resource_summary = {
        total_pes_materials: allMaterials.length,
        total_reference_books: books.totalBooks || 0,
        database_enhanced: true
      };
      
      console.log('✅ Roadmap enhanced with database resources');
      return roadmap;
      
    } catch (error) {
      console.warn('⚠️ Could not enhance roadmap with resources:', error.message);
      return roadmap; // Return original roadmap if enhancement fails
    }
  }

  /**
   * Update roadmap progress
   */
  async updateRoadmapProgress(userId, progressData) {
    try {
      console.log(`📊 Updating progress for user: ${userId}`);
      
      const updatedRoadmap = await this.pipelineDb.updateRoadmapProgress(userId, progressData);
      return updatedRoadmap;
      
    } catch (error) {
      console.error(`❌ Error updating roadmap progress:`, error);
      throw new Error('Failed to update roadmap progress');
    }
  }
}

// Export singleton instance
const pipelineService = new PipelineIntegrationService();

module.exports = pipelineService;
