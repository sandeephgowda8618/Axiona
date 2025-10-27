// AI Routes for chatbot and AI-powered features aligned with MongoDB data model
const { Router } = require('express');
const { AiThread, WorkspaceSession, StudySession } = require('../models');
const { chatService } = require('../services/chatService');
const { protect } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = Router();

// Health check endpoint (public)
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await chatService.healthCheck();
    
    res.json({
      success: true,
      data: {
        aiService: isHealthy ? 'operational' : 'degraded',
        timestamp: new Date(),
        model: 'gemini-1.5-flash'
      }
    });
  } catch (error) {
    logger.error('AI health check failed', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI service health check failed' 
    });
  }
});

// Start or get AI chat thread for a workspace session
router.post('/workspace/:sessionId/chat', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, context } = req.body;

    // Verify workspace session belongs to user
    const workspaceSession = await WorkspaceSession.findOne({
      _id: sessionId,
      userId: req.user._id,
      status: 'open'
    });

    if (!workspaceSession) {
      return res.status(404).json({ 
        success: false, 
        error: 'Workspace session not found or not active' 
      });
    }

    // Get or create AI thread
    let aiThread = await AiThread.findOne({ sessionId });
    
    if (!aiThread) {
      aiThread = new AiThread({
        sessionId,
        messages: []
      });
    }

    // Add user message
    await aiThread.addMessage('user', message);

    // Generate AI response with context
    const aiResponse = await chatService.generateResponse(
      message, 
      aiThread.getRecentMessages(10),
      {
        resourceType: workspaceSession.resourceType,
        resourceTitle: workspaceSession.resourceTitle,
        resourceUrl: workspaceSession.resourceUrl,
        currentPage: workspaceSession.pageNum,
        currentTime: workspaceSession.videoTime,
        userContext: context
      }
    );

    // Add AI response
    await aiThread.addMessage('assistant', aiResponse);

    // Save thread
    await aiThread.save();

    // Also update workspace session with recent activity
    workspaceSession.updatedAt = new Date();
    await workspaceSession.save();

    res.json({
      success: true,
      data: {
        message: aiResponse,
        threadId: aiThread._id,
        messageCount: aiThread.messages.length
      }
    });

  } catch (error) {
    logger.error('Error in workspace chat', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process chat message' 
    });
  }
});

// Get chat history for a workspace session
router.get('/workspace/:sessionId/chat/history', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;

    // Verify workspace session belongs to user
    const workspaceSession = await WorkspaceSession.findOne({
      _id: sessionId,
      userId: req.user._id
    });

    if (!workspaceSession) {
      return res.status(404).json({ 
        success: false, 
        error: 'Workspace session not found' 
      });
    }

    // Get AI thread
    const aiThread = await AiThread.findOne({ sessionId });
    
    if (!aiThread) {
      return res.json({
        success: true,
        data: {
          messages: [],
          total: 0
        }
      });
    }

    // Get recent messages
    const messages = aiThread.getRecentMessages(parseInt(limit));

    res.json({
      success: true,
      data: {
        messages,
        total: aiThread.messages.length,
        threadId: aiThread._id
      }
    });

  } catch (error) {
    logger.error('Error fetching chat history', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch chat history' 
    });
  }
});

// General AI chat (not tied to specific content) - for StudyBuddy page
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.user._id;

    // For general chat, we can use a simple response without persistent thread
    const aiResponse = await chatService.generateResponse(
      message, 
      [], // No history for general chat
      {
        userId,
        chatType: 'general',
        userContext: context
      }
    );

    // Log general chat interaction
    logger.info('General AI chat interaction', {
      userId,
      messageLength: message.length,
      responseLength: aiResponse.length
    });

    res.json({
      success: true,
      data: {
        message: aiResponse,
        timestamp: new Date()
      }
    });

  } catch (error) {
    logger.error('Error in general chat', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process chat message' 
    });
  }
});

// Get AI study suggestions based on user's current plan and progress
router.get('/suggestions', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's recent study sessions and current progress
    const recentSessions = await StudySession.find({
      userId,
      status: 'closed'
    })
    .sort({ startAt: -1 })
    .limit(10)
    .populate('dailyPlanId', 'goalMinutes tasks');

    // Generate personalized suggestions
    const suggestions = await chatService.generateStudySuggestions(userId, recentSessions);

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    logger.error('Error generating AI suggestions', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate suggestions' 
    });
  }
});

// Get AI analysis of study performance
router.get('/performance-analysis', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '7d' } = req.query;

    // Get performance analysis from AI
    const analysis = await chatService.generatePerformanceAnalysis(userId, period);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Error generating performance analysis', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate performance analysis' 
    });
  }
});

// Explain concept based on study material
router.post('/explain', protect, async (req, res) => {
  try {
    const { concept, context, materialType, materialTitle } = req.body;

    const explanation = await chatService.explainConcept(concept, {
      materialType,
      materialTitle,
      userContext: context
    });

    res.json({
      success: true,
      data: {
        explanation,
        concept,
        timestamp: new Date()
      }
    });

  } catch (error) {
    logger.error('Error explaining concept', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to explain concept' 
    });
  }
});

module.exports = router;
