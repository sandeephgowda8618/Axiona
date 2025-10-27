// AI Controller for handling chatbot API endpoints
const chatService = require('../services/chatService');
const aiService = require('../services/aiService');
const { logger } = require('../utils/logger');
const { validators } = require('../utils/validators');

// Start a new conversation
const startConversation = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    // Validate message if provided
    if (message && !validators.isValidLength(message, 1, 2000)) {
      return res.status(400).json({
        success: false,
        error: 'Message must be between 1 and 2000 characters'
      });
    }

    const result = await chatService.startConversation(userId, message);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in startConversation controller', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Send a message to existing conversation
const sendMessage = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { message } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    // Validate inputs
    if (!validators.isValidObjectId(threadId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid thread ID'
      });
    }

    if (!validators.isValidLength(message, 1, 2000)) {
      return res.status(400).json({
        success: false,
        error: 'Message must be between 1 and 2000 characters'
      });
    }

    const result = await chatService.sendMessage(threadId, message);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error in sendMessage controller', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get conversation history
const getConversation = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { limit } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    if (!validators.isValidObjectId(threadId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid thread ID'
      });
    }

    const messageLimit = limit ? parseInt(limit) : 50;
    if (!validators.isValidRange(messageLimit, 1, 200)) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 200'
      });
    }

    const result = await chatService.getConversation(threadId, messageLimit);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    logger.error('Error in getConversation controller', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get user's conversations
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (!validators.isValidRange(pageNum, 1, 1000)) {
      return res.status(400).json({
        success: false,
        error: 'Page must be between 1 and 1000'
      });
    }

    if (!validators.isValidRange(limitNum, 1, 100)) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100'
      });
    }

    const result = await chatService.getUserConversations(userId, pageNum, limitNum);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in getUserConversations controller', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// End a conversation
const endConversation = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    if (!validators.isValidObjectId(threadId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid thread ID'
      });
    }

    const result = await chatService.endConversation(threadId, userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    logger.error('Error in endConversation controller', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get study help (quick AI assistance)
const getStudyHelp = async (req, res) => {
  try {
    const { question, subject, topic, difficulty } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    if (!validators.isValidLength(question, 1, 2000)) {
      return res.status(400).json({
        success: false,
        error: 'Question must be between 1 and 2000 characters'
      });
    }

    const context = { subject, topic, difficulty };
    const result = await chatService.getStudyHelp(userId, question, context);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in getStudyHelp controller', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Generate study plan
const generateStudyPlan = async (req, res) => {
  try {
    const { subject, duration, currentLevel } = req.body;

    if (!validators.isValidLength(subject, 2, 100)) {
      return res.status(400).json({
        success: false,
        error: 'Subject must be between 2 and 100 characters'
      });
    }

    if (!validators.isValidLength(duration, 2, 50)) {
      return res.status(400).json({
        success: false,
        error: 'Duration must be between 2 and 50 characters'
      });
    }

    const result = await aiService.generateStudyPlan(subject, duration, currentLevel);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in generateStudyPlan controller', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Generate quiz questions
const generateQuiz = async (req, res) => {
  try {
    const { topic, difficulty = 'medium', questionCount = 5 } = req.body;

    if (!validators.isValidLength(topic, 2, 100)) {
      return res.status(400).json({
        success: false,
        error: 'Topic must be between 2 and 100 characters'
      });
    }

    if (!validators.isValidRange(questionCount, 1, 20)) {
      return res.status(400).json({
        success: false,
        error: 'Question count must be between 1 and 20'
      });
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        error: 'Difficulty must be easy, medium, or hard'
      });
    }

    const result = await aiService.generateQuizQuestions(topic, difficulty, questionCount);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in generateQuiz controller', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Explain a concept
const explainConcept = async (req, res) => {
  try {
    const { concept, context, level = 'intermediate' } = req.body;

    if (!validators.isValidLength(concept, 2, 200)) {
      return res.status(400).json({
        success: false,
        error: 'Concept must be between 2 and 200 characters'
      });
    }

    if (context && !validators.isValidLength(context, 2, 500)) {
      return res.status(400).json({
        success: false,
        error: 'Context must be between 2 and 500 characters'
      });
    }

    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        error: 'Level must be beginner, intermediate, or advanced'
      });
    }

    const result = await aiService.explainConcept(concept, context, level);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error('Error in explainConcept controller', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// AI health check
const healthCheck = async (req, res) => {
  try {
    const result = await chatService.healthCheck();
    
    const statusCode = result.status === 'healthy' ? 200 : 
                       result.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Error in AI healthCheck controller', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
};

module.exports = {
  startConversation,
  sendMessage,
  getConversation,
  getUserConversations,
  endConversation,
  getStudyHelp,
  generateStudyPlan,
  generateQuiz,
  explainConcept,
  healthCheck
};
