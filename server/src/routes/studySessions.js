const { Router } = require('express');
const { StudySession, DailyPlan, PerformanceInsight } = require('../models');
const { protect } = require('../middleware/auth');

const router = Router();

// Start a new study session
router.post('/start', protect, async (req, res) => {
  try {
    const { dailyPlanId } = req.body;

    // Check if user has an open session
    const openSession = await StudySession.findOne({
      userId: req.user._id,
      status: 'open'
    });

    if (openSession) {
      return res.status(400).json({ 
        error: 'You already have an active study session',
        session: openSession
      });
    }

    // Validate daily plan if provided
    if (dailyPlanId) {
      const dailyPlan = await DailyPlan.findOne({
        _id: dailyPlanId,
        userId: req.user._id
      });
      
      if (!dailyPlan) {
        return res.status(404).json({ error: 'Daily plan not found' });
      }
    }

    const session = new StudySession({
      userId: req.user._id,
      dailyPlanId,
      startAt: new Date(),
      status: 'open'
    });

    await session.save();

    return res.status(201).json(session);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to start study session' });
  }
});

// Update session pulse (heartbeat)
router.put('/:sessionId/pulse', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { pulseInterval } = req.body;

    const session = await StudySession.findOne({
      _id: sessionId,
      userId: req.user._id,
      status: 'open'
    });

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    // Add pulse interval to array
    if (pulseInterval && typeof pulseInterval === 'number') {
      if (!session.pulseIntervals) {
        session.pulseIntervals = [];
      }
      session.pulseIntervals.push(pulseInterval);
    }

    // Calculate actual minutes from start time
    const now = new Date();
    session.actualMinutes = Math.floor((now.getTime() - session.startAt.getTime()) / (1000 * 60));

    await session.save();

    return res.json({ 
      actualMinutes: session.actualMinutes,
      pulseCount: session.pulseIntervals?.length || 0
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update session pulse' });
  }
});

// End study session
router.put('/:sessionId/end', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await StudySession.findOne({
      _id: sessionId,
      userId: req.user._id,
      status: 'open'
    });

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    // End the session
    session.endAt = new Date();
    session.status = 'closed';
    session.actualMinutes = Math.floor((session.endAt.getTime() - session.startAt.getTime()) / (1000 * 60));

    await session.save();

    // Update streak
    await updateUserStreak(req.user._id, session.endAt);

    // Generate performance insight (if session was long enough)
    if (session.actualMinutes >= 10) {
      await generatePerformanceInsight(req.user._id, session);
    }

    return res.json(session);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to end study session' });
  }
});

// Get current active session
router.get('/current', protect, async (req, res) => {
  try {
    const session = await StudySession.findOne({
      userId: req.user._id,
      status: 'open'
    }).populate('dailyPlanId', 'date goalMinutes tasks');

    if (!session) {
      return res.status(404).json({ error: 'No active session found' });
    }

    // Calculate current actual minutes
    const now = new Date();
    const actualMinutes = Math.floor((now.getTime() - session.startAt.getTime()) / (1000 * 60));

    return res.json({
      ...session.toObject(),
      actualMinutes
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch current session' });
  }
});

// Get user's session history
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { userId: req.user._id };
    if (status) {
      filter.status = status;
    }

    const sessions = await StudySession.find(filter)
      .populate('dailyPlanId', 'date goalMinutes')
      .sort({ startAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await StudySession.countDocuments(filter);

    return res.json({
      sessions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch session history' });
  }
});

// Get session statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
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
        startDate.setDate(startDate.getDate() - 7);
    }

    const stats = await StudySession.aggregate([
      {
        $match: {
          userId: req.user._id,
          startAt: { $gte: startDate },
          status: 'closed'
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMinutes: { $sum: '$actualMinutes' },
          avgMinutes: { $avg: '$actualMinutes' },
          avgPulseIntervals: { $avg: { $size: '$pulseIntervals' } }
        }
      }
    ]);

    const result = stats[0] || {
      totalSessions: 0,
      totalMinutes: 0,
      avgMinutes: 0,
      avgPulseIntervals: 0
    };

    // Get streak info - if Streak model exists
    let streakInfo = null;
    try {
      const { Streak } = require('../models');
      const streak = await Streak.findOne({ userId: req.user._id });
      if (streak) {
        streakInfo = {
          current: streak.current,
          longest: streak.longest,
          freezeLeft: streak.freezeLeft
        };
      }
    } catch (error) {
      // Streak model might not exist yet
      console.log('Streak model not available');
    }

    return res.json({
      period,
      ...result,
      streak: streakInfo
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch session statistics' });
  }
});

// Get session by ID
router.get('/:sessionId', protect, async (req, res) => {
  try {
    const session = await StudySession.findOne({
      _id: req.params.sessionId,
      userId: req.user._id
    }).populate('dailyPlanId', 'date goalMinutes tasks');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json(session);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Helper function to update user streak
async function updateUserStreak(userId, studyDate) {
  try {
    // Try to get Streak model - if it doesn't exist, skip
    try {
      const { Streak } = require('../models');
      let streak = await Streak.findOne({ userId });
      
      if (!streak) {
        streak = new Streak({ userId });
      }
      
      if (streak.updateStreak) {
        streak.updateStreak(studyDate);
        await streak.save();
      }
    } catch (error) {
      // Streak model might not exist yet
      console.log('Streak model not available');
    }
  } catch (error) {
    console.error('Failed to update streak:', error);
  }
}

// Helper function to generate performance insight
async function generatePerformanceInsight(userId, session) {
  try {
    // Simple insight generation based on session data
    const insights = [
      {
        headline: "Great Focus Session! 🎯",
        summary: `You completed a ${session.actualMinutes}-minute study session with consistent focus.`,
        tip: "Keep maintaining this level of concentration for better learning outcomes.",
        emoji: "🎯",
        color: "#10B981"
      },
      {
        headline: "Steady Progress! 📈",
        summary: `Your ${session.pulseIntervals?.length || 0} pulse intervals show active engagement.`,
        tip: "Try to maintain regular study sessions to build a strong learning habit.",
        emoji: "📈", 
        color: "#3B82F6"
      }
    ];

    const randomInsight = insights[Math.floor(Math.random() * insights.length)];

    const performanceInsight = new PerformanceInsight({
      userId,
      sessionId: session._id,
      insight: randomInsight
    });

    await performanceInsight.save();
  } catch (error) {
    console.error('Failed to generate performance insight:', error);
  }
}

module.exports = router;
