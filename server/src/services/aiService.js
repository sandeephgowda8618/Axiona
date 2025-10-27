// AI Service for Google Gemini integration
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logger } = require('../utils/logger');

class AIService {
  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY || 'AIzaSyBuesQHpmMfx-gjkCQ7R6gh4t_FAG0qnYE';
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // System prompt for Study AI context
    this.systemPrompt = `You are StudyBot, an AI assistant for the Study-AI platform. You help students with:
    
1. Study planning and organization
2. Explaining concepts and answering academic questions
3. Providing study tips and techniques
4. Helping with time management
5. Motivating students and tracking progress
6. Recommending study materials and resources

Keep responses helpful, encouraging, and educational. If asked about topics outside academics, politely redirect to study-related matters. Always maintain a friendly and supportive tone.

Current context: You're integrated into a study platform that has videos, PDFs, quizzes, study sessions, and progress tracking.`;
  }

  // Generate AI response for chat
  async generateResponse(userMessage, conversationHistory = []) {
    try {
      // Build conversation context
      let prompt = this.systemPrompt + '\n\n';
      
      // Add conversation history
      if (conversationHistory.length > 0) {
        prompt += 'Previous conversation:\n';
        conversationHistory.slice(-5).forEach(msg => { // Last 5 messages for context
          prompt += `${msg.role}: ${msg.content}\n`;
        });
        prompt += '\n';
      }
      
      prompt += `Student: ${userMessage}\nStudyBot:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      logger.info('AI response generated', { 
        userMessage: userMessage.substring(0, 100),
        responseLength: text.length 
      });

      return {
        success: true,
        message: text,
        metadata: {
          model: 'gemini-1.5-flash',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error generating AI response', error);
      return {
        success: false,
        message: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        error: error.message
      };
    }
  }

  // Generate study plan suggestions
  async generateStudyPlan(subject, duration, currentLevel = 'beginner') {
    try {
      const prompt = `Create a detailed ${duration} study plan for ${subject} at ${currentLevel} level. 
      
Please provide:
1. Weekly breakdown of topics
2. Recommended study time per day
3. Key concepts to focus on
4. Practice exercises or activities
5. Milestones and progress checkpoints

Format the response in a structured way that's easy to follow.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        studyPlan: text,
        subject,
        duration,
        level: currentLevel
      };
    } catch (error) {
      logger.error('Error generating study plan', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate quiz questions
  async generateQuizQuestions(topic, difficulty = 'medium', questionCount = 5) {
    try {
      const prompt = `Generate ${questionCount} multiple-choice questions about ${topic} at ${difficulty} difficulty level.

For each question, provide:
1. The question text
2. Four options (A, B, C, D)
3. The correct answer
4. A brief explanation of why it's correct

Format as JSON array with this structure:
[
  {
    "question": "Question text",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": "A",
    "explanation": "Explanation text"
  }
]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON from response
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            questions,
            topic,
            difficulty
          };
        }
      } catch (parseError) {
        logger.warn('Could not parse JSON from AI response, returning raw text');
      }

      return {
        success: true,
        questions: text,
        topic,
        difficulty,
        note: 'Questions returned as text format'
      };
    } catch (error) {
      logger.error('Error generating quiz questions', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Analyze study performance and provide insights
  async analyzeStudyPerformance(studyData) {
    try {
      const { totalMinutes, sessionsCount, subjects, recentScores } = studyData;
      
      const prompt = `Analyze this student's study performance and provide insights:

Study Statistics:
- Total study time: ${totalMinutes} minutes
- Number of sessions: ${sessionsCount}
- Subjects studied: ${subjects?.join(', ') || 'Various'}
- Recent quiz scores: ${recentScores?.join(', ') || 'No recent scores'}

Please provide:
1. Performance analysis
2. Strengths and areas for improvement
3. Specific recommendations for better study habits
4. Motivational feedback
5. Suggested next steps

Keep the tone encouraging and constructive.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        analysis: text,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error analyzing study performance', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate content explanations
  async explainConcept(concept, context = '', level = 'intermediate') {
    try {
      const prompt = `Explain the concept of "${concept}" at ${level} level${context ? ` in the context of ${context}` : ''}.

Please provide:
1. A clear, concise definition
2. Key points or characteristics
3. Real-world examples or applications
4. Common misconceptions to avoid
5. Related concepts to explore further

Make the explanation engaging and easy to understand.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        explanation: text,
        concept,
        level
      };
    } catch (error) {
      logger.error('Error explaining concept', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Health check for AI service
  async healthCheck() {
    try {
      const testResult = await this.model.generateContent('Say "AI Service is working correctly"');
      const response = await testResult.response;
      const text = response.text();
      
      return {
        status: 'healthy',
        message: 'AI service is operational',
        testResponse: text
      };
    } catch (error) {
      logger.error('AI service health check failed', error);
      return {
        status: 'unhealthy',
        message: 'AI service is not responding',
        error: error.message
      };
    }
  }
}

// Export singleton instance
const aiService = new AIService();
module.exports = aiService;
