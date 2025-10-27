// Progress controller for tracking user learning progress

const { StudySession, DailyPlan, PerformanceInsight } = require('../models');
const { logger } = require('../utils/logger');

// Get user's overall progress
const getOverallProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get study sessions statistics
    const sessionStats = await StudySession.aggregate([
      {
        $match: {
          userId,
          startAt: { $gte: startDate },
          status: 'closed'
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMinutes: { $sum: '$actualMinutes' },
          averageMinutes: { $avg: '$actualMinutes' }
        }
      }
    ]);

    // Get daily plan completion rate
    const dailyPlanStats = await DailyPlan.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalPlans: { $sum: 1 },
          completedPlans: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const progress = {
      period,
      sessions: sessionStats[0] || { totalSessions: 0, totalMinutes: 0, averageMinutes: 0 },
      dailyPlans: dailyPlanStats[0] || { totalPlans: 0, completedPlans: 0 },
      completionRate: dailyPlanStats[0] 
        ? (dailyPlanStats[0].completedPlans / dailyPlanStats[0].totalPlans * 100)
        : 0
    };

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    logger.error('Error getting overall progress', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress data'
    });
  }
};

// Get daily progress breakdown
const getDailyProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get daily study minutes
    const dailyData = await StudySession.aggregate([
      {
        $match: {
          userId,
          startAt: { $gte: startDate },
          status: 'closed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$startAt'
            }
          },
          totalMinutes: { $sum: '$actualMinutes' },
          sessionCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: dailyData
    });
  } catch (error) {
    logger.error('Error getting daily progress', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily progress'
    });
  }
};

// Get subject-wise progress
const getSubjectProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    let startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period.replace('d', '')));

    // This would require subject tracking in study sessions
    // For now, returning mock data
    const subjectProgress = [
      {
        subject: 'Mathematics',
        totalMinutes: 450,
        sessionsCount: 12,
        averageMinutes: 37.5,
        lastStudied: new Date()
      },
      {
        subject: 'Computer Science',
        totalMinutes: 380,
        sessionsCount: 8,
        averageMinutes: 47.5,
        lastStudied: new Date()
      },
      {
        subject: 'Physics',
        totalMinutes: 290,
        sessionsCount: 6,
        averageMinutes: 48.3,
        lastStudied: new Date()
      }
    ];

    res.json({
      success: true,
      data: subjectProgress
    });
  } catch (error) {
    logger.error('Error getting subject progress', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subject progress'
    });
  }
};

// Get weekly goals progress
const getWeeklyGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current week's start and end
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));

    // Get this week's study time
    const weeklyStats = await StudySession.aggregate([
      {
        $match: {
          userId,
          startAt: { $gte: startOfWeek, $lte: endOfWeek },
          status: 'closed'
        }
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$actualMinutes' },
          sessionCount: { $sum: 1 }
        }
      }
    ]);

    // Mock weekly goals - in production, these would come from user settings
    const weeklyGoals = {
      studyMinutes: 600, // 10 hours per week
      sessionsCount: 14, // 2 sessions per day
      currentMinutes: weeklyStats[0]?.totalMinutes || 0,
      currentSessions: weeklyStats[0]?.sessionCount || 0
    };

    weeklyGoals.minutesProgress = (weeklyGoals.currentMinutes / weeklyGoals.studyMinutes * 100);
    weeklyGoals.sessionsProgress = (weeklyGoals.currentSessions / weeklyGoals.sessionsCount * 100);

    res.json({
      success: true,
      data: weeklyGoals
    });
  } catch (error) {
    logger.error('Error getting weekly goals', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weekly goals'
    });
  }
};

// Get performance insights
const getPerformanceInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5 } = req.query;

    const insights = await PerformanceInsight.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('sessionId', 'actualMinutes startAt')
      .lean();

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    logger.error('Error getting performance insights', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance insights'
    });
  }
};

module.exports = {
  getOverallProgress,
  getDailyProgress,
  getSubjectProgress,
  getWeeklyGoals,
  getPerformanceInsights
};
