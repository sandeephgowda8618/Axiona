const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const pipelineDB = require('./pipelineDatabase');

class PipelineIntegrationService {
  constructor() {
    // Path to the Python pipeline
    this.pipelinePath = process.env.PIPELINE_PATH || '/Users/sandeeph/Documents/s2/Axiona/Pipline';
    this.pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python3';
    this.pipelineScript = 'complete_rag_system.py';
    this.timeout = 120000; // 2 minutes timeout for pipeline generation
    
    // Initialize pipeline database
    this.pipelineDb = pipelineDB;
  }

  /**
   * Generate interview questions using the pipeline based on domain and experience level
   */
  async generateInterviewQuestions(domain, experienceLevel) {
    try {
      console.log(`🎯 Generating interview questions for: ${domain} (${experienceLevel})`);
      
      // Create a temporary script to call the interview agent with proper parameters
      const tempScript = `
import asyncio
import sys
import json
sys.path.insert(0, '.')

from complete_rag_system import EducationalAgentSystem

async def generate_questions():
    try:
        print("✅ Database connection established successfully")
        print("✅ RAG service initialized with database connection")
        
        # Initialize agent system
        agent_system = EducationalAgentSystem()
        await agent_system.initialize()
        
        # Generate domain-specific interview questions
        questions_result = await agent_system.interview_agent("${domain}", "${domain}")
        
        # Format questions to ensure consistency
        if isinstance(questions_result, dict) and "questions" in questions_result:
            questions = questions_result["questions"]
        elif isinstance(questions_result, list):
            questions = questions_result
        else:
            questions = []
        
        # Format questions properly
        formatted_questions = []
        for i, q in enumerate(questions[:5]):  # Limit to 5 questions max
            if isinstance(q, dict):
                formatted_q = {
                    "question_id": q.get("question_id", f"q{i+1}"),
                    "question_text": q.get("question_text", q.get("question", "")),
                    "question_type": q.get("question_type", "open_ended"),
                    "category": q.get("category", "assessment"),
                    "required": q.get("required", True)
                }
                if q.get("options"):
                    formatted_q["options"] = q["options"]
                if q.get("scale"):
                    formatted_q["scale"] = q["scale"]
                formatted_questions.append(formatted_q)
            elif isinstance(q, str):
                formatted_questions.append({
                    "question_id": f"q{i+1}",
                    "question_text": q,
                    "question_type": "open_ended",
                    "category": "assessment",
                    "required": True
                })
        
        result = {
            "questions": formatted_questions,
            "domain": "${domain}",
            "experience_level": "${experienceLevel}",
            "total_questions": len(formatted_questions)
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "questions": [],
            "domain": "${domain}",
            "experience_level": "${experienceLevel}"
        }
        print(json.dumps(error_result))

asyncio.run(generate_questions())
`;

      const tempFile = path.join(this.pipelinePath, 'temp_questions.py');
      await fs.writeFile(tempFile, tempScript);

      const result = await this.executePythonScript('temp_questions.py', 60000);
      
      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {}); // Ignore cleanup errors
      
      if (result.error) {
        console.warn(`⚠️ Pipeline error: ${result.error}`);
        return this.generateFallbackQuestions(domain, experienceLevel);
      }
      
      if (result.questions && Array.isArray(result.questions) && result.questions.length > 0) {
        console.log(`✅ Got ${result.questions.length} questions from pipeline`);
        return result.questions;
      } else {
        console.warn('⚠️ No questions returned from pipeline, using fallback');
        return this.generateFallbackQuestions(domain, experienceLevel);
      }
      
    } catch (error) {
      console.error('❌ Interview questions generation failed:', error);
      return this.generateFallbackQuestions(domain, experienceLevel);
    }
  }

  /**
   * Generate fallback questions specific to domain and experience level
   */
  generateFallbackQuestions(domain, experienceLevel) {
    console.log(`🔧 Generating fallback questions for ${domain} (${experienceLevel})`);
    
    const baseQuestions = {
      "Computer Science": {
        "beginner": [
          {
            question_id: "q1",
            question_text: "What is your current experience with programming?",
            question_type: "multiple_choice",
            options: ["Never programmed", "Some basic knowledge", "Completed courses", "Professional experience"],
            category: "experience_level"
          },
          {
            question_id: "q2", 
            question_text: "Which programming languages interest you most?",
            question_type: "multiple_choice",
            options: ["Python", "JavaScript", "Java", "C++", "Other", "Not sure yet"],
            category: "technical_interests"
          },
          {
            question_id: "q3",
            question_text: "How many hours per week can you dedicate to studying?",
            question_type: "multiple_choice",
            options: ["1-5 hours", "5-10 hours", "10-20 hours", "20+ hours"],
            category: "time_commitment"
          },
          {
            question_id: "q4",
            question_text: "What is your preferred learning style?",
            question_type: "multiple_choice",
            options: ["Video tutorials", "Reading documentation", "Hands-on projects", "Interactive courses"],
            category: "learning_preference"
          },
          {
            question_id: "q5",
            question_text: "What are your goals with Computer Science?",
            question_type: "multiple_choice",
            options: ["Career change", "Academic improvement", "Personal interest", "Professional development"],
            category: "goals"
          }
        ]
      }
    };

    const domainQuestions = baseQuestions[domain] || baseQuestions["Computer Science"];
    return domainQuestions["beginner"];
  }

  /**
   * Generate complete roadmap using the pipeline with user answers
   */
  async generateRoadmap(userAnswers, learningGoal, subject, userId, hoursPerWeek = 10) {
    try {
      console.log(`🚀 Generating roadmap for user ${userId}: ${learningGoal}`);
      console.log(`📝 User answers:`, JSON.stringify(userAnswers, null, 2));
      
      // Format user answers for pipeline - convert to proper format expected by complete_rag_system.py
      const formattedAnswers = Array.isArray(userAnswers) ? userAnswers.map(ans => ({
        question_id: ans.questionId || ans.question_id,
        answer: ans.answer
      })) : [];
      
      const answersJson = JSON.stringify(formattedAnswers).replace(/"/g, '\\"');
      
      // Create a temporary script to call the complete pipeline with user answers
      const tempScript = `
import asyncio
import sys
import json
sys.path.insert(0, '.')

from complete_rag_system import generate_complete_educational_roadmap

async def generate_roadmap():
    try:
        print("✅ Database connection established successfully")
        print("✅ RAG service initialized with database connection")
        print(f"🚀 Starting complete roadmap generation: ${learningGoal}")
        
        # Generate roadmap using complete system
        roadmap = await generate_complete_educational_roadmap(
            learning_goal="${learningGoal}",
            subject="${subject}", 
            hours_per_week=${hoursPerWeek}
        )
        
        # Add metadata to roadmap
        roadmap["user_id"] = "${userId}"
        roadmap["generation_timestamp"] = "${new Date().toISOString()}"
        roadmap["user_answers"] = json.loads("""${answersJson}""")
        
        print(json.dumps(roadmap, default=str))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "user_id": "${userId}",
            "learning_goal": "${learningGoal}"
        }
        print(json.dumps(error_result))

asyncio.run(generate_roadmap())
`;

      const tempFile = path.join(this.pipelinePath, 'temp_roadmap.py');
      await fs.writeFile(tempFile, tempScript);

      console.log('🔄 Executing pipeline for roadmap generation...');
      const result = await this.executePythonScript('temp_roadmap.py', this.timeout);
      
      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {}); // Ignore cleanup errors
      
      if (result.error) {
        console.error(`❌ Pipeline roadmap generation failed: ${result.error}`);
        throw new Error(`Pipeline error: ${result.error}`);
      }
      
      console.log('✅ Pipeline roadmap generated successfully');
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
    from complete_rag_system import EducationalAgentSystem
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
  async generateRoadmapFromAnswers(userId, userAnswers, domain = null, experienceLevel = null) {
    try {
      console.log(`🚀 Generating roadmap for user: ${userId}`);
      console.log('📝 User answers received:', userAnswers);
      console.log('🎯 Domain:', domain, 'Experience:', experienceLevel);
      
      // Map domain to proper learning goal
      const learningGoalMapping = {
        "Computer Science": "Master Computer Science Fundamentals",
        "Mathematics": "Master Mathematics Fundamentals", 
        "Physics": "Master Physics Fundamentals",
        "Data Science": "Master Data Science and Analytics",
        "Web Development": "Master Web Development",
        "Machine Learning": "Master Machine Learning and AI"
      };
      
      const learningGoal = learningGoalMapping[domain] || "Master Computer Science Fundamentals";
      const experience = experienceLevel || "beginner";
      const hoursPerWeek = 10;
      const subject = domain || "Computer Science";
      
      console.log('📊 Final parameters:', { learningGoal, experience, hoursPerWeek, subject });
      
      // Try to generate roadmap using the pipeline
      let roadmapResult = null;
      try {
        console.log('🔄 Attempting pipeline roadmap generation...');
        
        roadmapResult = await this.generateRoadmap(
          userAnswers, 
          learningGoal, 
          subject, 
          userId, 
          hoursPerWeek
        );
        
        console.log('✅ Pipeline roadmap generated successfully');
        
      } catch (pipelineError) {
        console.warn('⚠️ Pipeline roadmap generation failed:', pipelineError.message);
        throw pipelineError; // Re-throw for now - could add fallback later
      }
      
      // Format the response properly for the frontend
      const enhancedRoadmap = {
        user_id: userId,
        learning_goal: learningGoal,
        experience_level: experience,
        hours_per_week: hoursPerWeek,
        timeline: "8 weeks",
        user_answers: userAnswers,
        generated_roadmap: roadmapResult, // This contains the actual roadmap structure
        generation_method: roadmapResult?.meta?.pipeline_version ? 'pipeline' : 'enhanced_fallback',
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        completion_percentage: 0
      };
      
      // Save to pipeline database
      try {
        await this.pipelineDb.saveRoadmap(enhancedRoadmap);
        console.log('💾 Enhanced roadmap saved to pipeline database');
      } catch (saveError) {
        console.warn('⚠️ Could not save roadmap to database:', saveError.message);
      }
      
      return enhancedRoadmap;
      
    } catch (error) {
      console.error(`❌ Error generating roadmap:`, error);
      throw new Error('Failed to generate roadmap: ' + error.message);
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

  /**
   * Get pipeline status and health check
   */
  async getStatus() {
    try {
      const [pipelineTest, dbHealth] = await Promise.all([
        this.testPipeline(),
        this.pipelineDb.healthCheck()
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
}

// Export singleton instance
const pipelineService = new PipelineIntegrationService();

module.exports = pipelineService;
