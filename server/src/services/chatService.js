// Chat Service for managing AI conversations using Google Gemini
const { aiService } = require('./aiService');
const { StudySession, DailyPlan, User, Video, PDF, StudyMaterial } = require('../models');
const { logger } = require('../utils/logger');

class ChatService {
  constructor() {
    this.aiService = aiService;
  }

  // Generate AI response with context awareness
  async generateResponse(userMessage, conversationHistory = [], context = {}) {
    try {
      let systemContext = this.buildSystemContext(context);
      
      // Enhance system context with user's study data if available
      if (context.userId) {
        const userStudyContext = await this.getUserStudyContext(context.userId);
        systemContext += userStudyContext;
      }

      const response = await this.aiService.generateResponse(
        userMessage, 
        conversationHistory,
        systemContext
      );

      return response;
    } catch (error) {
      logger.error('Error generating chat response', error);
      throw new Error('Failed to generate AI response');
    }
  }

  // Build system context based on current user activity
  buildSystemContext(context = {}) {
    let systemContext = '';

    if (context.resourceType && context.resourceTitle) {
      systemContext += `\nCurrent Context: User is studying ${context.resourceType} titled "${context.resourceTitle}"`;
      
      if (context.resourceType === 'video' && context.currentTime) {
        systemContext += ` at ${Math.floor(context.currentTime / 60)}:${(context.currentTime % 60).toString().padStart(2, '0')}`;
      }
      
      if (context.resourceType === 'pdf' && context.currentPage) {
        systemContext += ` on page ${context.currentPage}`;
      }
    }

    if (context.chatType === 'general') {
      systemContext += '\nContext: This is a general study conversation. Help with study planning, motivation, and academic guidance.';
    }

    if (context.userContext) {
      systemContext += `\nAdditional Context: ${context.userContext}`;
    }

    return systemContext;
  }

  // Get user's study context for personalized responses
  async getUserStudyContext(userId) {
    try {
      let context = '';

      // Get recent study sessions
      const recentSessions = await StudySession.find({
        userId,
        status: 'closed'
      })
      .sort({ startAt: -1 })
      .limit(3);

      if (recentSessions.length > 0) {
        const totalMinutes = recentSessions.reduce((sum, session) => sum + session.actualMinutes, 0);
        context += `\nUser's Recent Activity: Completed ${recentSessions.length} study sessions totaling ${totalMinutes} minutes in recent days.`;
      }

      // Get current daily plan if exists
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dailyPlan = await DailyPlan.findOne({
        userId,
        date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      });

      if (dailyPlan) {
        const completedTasks = dailyPlan.tasks.filter(task => task.done).length;
        context += `\nToday's Plan: ${completedTasks}/${dailyPlan.tasks.length} tasks completed, ${dailyPlan.goalMinutes} minutes goal.`;
      }

      return context;
    } catch (error) {
      logger.error('Error getting user study context', error);
      return '';
    }
  }

  // Generate personalized study suggestions
  async generateStudySuggestions(userId, recentSessions = []) {
    try {
      let prompt = 'Based on the user\'s study history, generate 3-5 specific, actionable study suggestions. ';
      
      if (recentSessions.length > 0) {
        const totalMinutes = recentSessions.reduce((sum, session) => sum + session.actualMinutes, 0);
        const avgSession = totalMinutes / recentSessions.length;
        
        prompt += `Recent activity: ${recentSessions.length} sessions, ${totalMinutes} total minutes, ${Math.round(avgSession)} minutes average. `;
      } else {
        prompt += 'User has no recent study sessions. Provide beginner-friendly suggestions. ';
      }

      prompt += 'Format as a JSON array of objects with "title", "description", and "priority" fields.';

      const response = await this.aiService.generateResponse(prompt);
      
      try {
        return JSON.parse(response);
      } catch (parseError) {
        // Fallback to default suggestions if AI response isn't valid JSON
        return this.getDefaultSuggestions();
      }
    } catch (error) {
      logger.error('Error generating study suggestions', error);
      return this.getDefaultSuggestions();
    }
  }

  // Generate performance analysis
  async generatePerformanceAnalysis(userId, period = '7d') {
    try {
      // Get data for the specified period
      const startDate = new Date();
      const days = parseInt(period.replace('d', ''));
      startDate.setDate(startDate.getDate() - days);

      const sessions = await StudySession.find({
        userId,
        startAt: { $gte: startDate },
        status: 'closed'
      }).sort({ startAt: 1 });

      let prompt = `Analyze this study performance data for the last ${days} days and provide insights: `;
      
      if (sessions.length > 0) {
        const totalMinutes = sessions.reduce((sum, session) => sum + session.actualMinutes, 0);
        const avgSession = totalMinutes / sessions.length;
        const studyDays = new Set(sessions.map(s => s.startAt.toDateString())).size;
        
        prompt += `${sessions.length} study sessions across ${studyDays} days, ${totalMinutes} total minutes, ${Math.round(avgSession)} minutes average per session. `;
        
        // Add daily breakdown
        const dailyMinutes = {};
        sessions.forEach(session => {
          const day = session.startAt.toDateString();
          dailyMinutes[day] = (dailyMinutes[day] || 0) + session.actualMinutes;
        });
        
        prompt += `Daily breakdown: ${Object.entries(dailyMinutes).map(([day, mins]) => `${day}: ${mins}min`).join(', ')}. `;
      } else {
        prompt += 'No study sessions in this period. ';
      }

      prompt += 'Provide insights on patterns, strengths, and recommendations for improvement. Format as JSON with "summary", "strengths", "improvements", and "recommendations" fields.';

      const response = await this.aiService.generateResponse(prompt);
      
      try {
        return JSON.parse(response);
      } catch (parseError) {
        return this.getDefaultAnalysis(sessions.length);
      }
    } catch (error) {
      logger.error('Error generating performance analysis', error);
      return this.getDefaultAnalysis(0);
    }
  }

  // Explain a concept with context
  async explainConcept(concept, context = {}) {
    try {
      let prompt = `Explain the concept: "${concept}" in a clear, educational way. `;
      
      if (context.materialType && context.materialTitle) {
        prompt += `This is in the context of ${context.materialType}: "${context.materialTitle}". `;
      }
      
      prompt += 'Provide a comprehensive but concise explanation suitable for students. Include examples where helpful.';
      
      if (context.userContext) {
        prompt += ` Additional context: ${context.userContext}`;
      }

      return await this.aiService.generateResponse(prompt);
    } catch (error) {
      logger.error('Error explaining concept', error);
      throw new Error('Failed to explain concept');
    }
  }

  // Health check for the service
  async healthCheck() {
    try {
      return await this.aiService.healthCheck();
    } catch (error) {
      logger.error('Chat service health check failed', error);
      return false;
    }
  }

  // Default suggestions fallback
  getDefaultSuggestions() {
    return [
      {
        title: "Start with a Study Plan",
        description: "Create a daily study plan with specific goals and time blocks",
        priority: "high"
      },
      {
        title: "Use Active Learning",
        description: "Take notes, ask questions, and summarize key concepts",
        priority: "medium"
      },
      {
        title: "Take Regular Breaks",
        description: "Use the Pomodoro technique: 25 minutes study, 5 minutes break",
        priority: "medium"
      },
      {
        title: "Review Previous Material",
        description: "Spend 10-15 minutes reviewing yesterday's concepts",
        priority: "low"
      }
    ];
  }

  // Default analysis fallback
  getDefaultAnalysis(sessionCount) {
    if (sessionCount === 0) {
      return {
        summary: "No study sessions recorded in this period",
        strengths: ["Ready to start a new study journey"],
        improvements: ["Begin with short, regular study sessions", "Set achievable daily goals"],
        recommendations: ["Start with 25-30 minute study blocks", "Choose a consistent study time", "Create a comfortable study environment"]
      };
    } else {
      return {
        summary: `Completed ${sessionCount} study sessions`,
        strengths: ["Consistent study effort", "Building good habits"],
        improvements: ["Track specific topics studied", "Monitor comprehension levels"],
        recommendations: ["Continue current schedule", "Add variety to study methods", "Set weekly review sessions"]
      };
    }
  }
}

const chatService = new ChatService();
module.exports = { chatService };
