const express = require('express');
const { Meeting } = require('../models/Meeting');
const { Message } = require('../models/Message');
const socketService = require('../services/socketService');
const FirebaseUserService = require('../services/firebaseUserService');
const router = express.Router();

// Get all meetings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    // Validate Firebase UID
    if (!FirebaseUserService.isValidFirebaseUID(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const skip = (page - 1) * limit;
    const meetings = await Meeting.findUserMeetings(userId, { 
      status, 
      limit: parseInt(limit), 
      skip 
    });

    const total = await Meeting.countDocuments({
      $or: [
        { createdBy: userId },
        { 'participants.userId': userId }
      ],
      ...(status && { status })
    });

    res.json({
      success: true,
      data: meetings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meetings',
      error: error.message
    });
  }
});

// Get meeting by ID
router.get('/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({ meetingId })
      .populate('participants.userId', 'fullName email avatarUrl');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    res.json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('❌ Error fetching meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting',
      error: error.message
    });
  }
});

// Get meeting info for joining (without sensitive data)
router.get('/:meetingId/info', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Return public meeting info
    const meetingInfo = {
      meetingId: meeting.meetingId,
      title: meeting.title,
      description: meeting.description,
      status: meeting.status,
      maxParticipants: meeting.settings.maxParticipants,
      currentParticipants: meeting.activeParticipants,
      requiresPassword: !!meeting.roomPassword,
      allowChat: meeting.settings.allowChat,
      allowScreenShare: meeting.settings.allowScreenShare,
      isJoinable: meeting.status === 'scheduled' || meeting.status === 'active',
      isFull: meeting.activeParticipants >= meeting.settings.maxParticipants
    };

    res.json({
      success: true,
      data: meetingInfo
    });
  } catch (error) {
    console.error('❌ Error fetching meeting info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting info',
      error: error.message
    });
  }
});

// Create new meeting
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      createdBy,
      scheduledStartTime,
      settings = {},
      roomPassword
    } = req.body;

    // Validate required fields
    if (!title || !createdBy) {
      return res.status(400).json({
        success: false,
        message: 'Title and createdBy are required'
      });
    }

    // Validate Firebase UID
    if (!FirebaseUserService.isValidFirebaseUID(createdBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Validate room password if provided
    if (roomPassword && (roomPassword.length < 4 || roomPassword.length > 20)) {
      return res.status(400).json({
        success: false,
        message: 'Room password must be between 4 and 20 characters'
      });
    }

    // Generate unique meeting ID
    let meetingId;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 5) {
      meetingId = Meeting.generateMeetingId();
      const existingMeeting = await Meeting.findOne({ meetingId });
      if (!existingMeeting) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unique meeting ID'
      });
    }

    // Create meeting
    const meeting = new Meeting({
      meetingId,
      title: title.trim(),
      description: description?.trim(),
      createdBy,
      hostUserId: createdBy,
      scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : undefined,
      settings: {
        maxParticipants: 6, // Always set to 6
        isPublic: settings.isPublic || false,
        requireApproval: settings.requireApproval || false,
        allowChat: settings.allowChat !== false, // Default true
        allowScreenShare: settings.allowScreenShare !== false, // Default true
        allowRecording: settings.allowRecording || false,
        muteOnEntry: settings.muteOnEntry || false
      },
      roomPassword: roomPassword?.trim() || undefined,
      roomId: `room_${meetingId}`, // Socket.IO room ID
      status: 'scheduled'
    });

    await meeting.save();

    console.log(`✅ Meeting created: ${meetingId} by ${createdBy}`);

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: meeting
    });
  } catch (error) {
    console.error('❌ Error creating meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meeting',
      error: error.message
    });
  }
});

// Join meeting
router.post('/:meetingId/join', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userId, userName, userEmail, roomPassword } = req.body;

    // Validate required fields
    if (!userId || !userName) {
      return res.status(400).json({
        success: false,
        message: 'userId and userName are required'
      });
    }

    // Validate Firebase UID
    if (!FirebaseUserService.isValidFirebaseUID(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user can join (includes password verification and participant limit)
    const joinCheck = meeting.canJoin(roomPassword);
    if (!joinCheck.success) {
      return res.status(400).json({
        success: false,
        message: joinCheck.message
      });
    }

    // Add participant to meeting
    try {
      await meeting.addParticipant(userId, userName, userEmail, roomPassword);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Start meeting if it's the first participant and it's scheduled
    if (meeting.status === 'scheduled' && meeting.activeParticipants === 1) {
      await meeting.startMeeting();
    }

    console.log(`👥 User ${userName} joined meeting ${meetingId}`);

    res.json({
      success: true,
      message: 'Joined meeting successfully',
      data: {
        meeting,
        roomId: meeting.roomId,
        participantCount: meeting.activeParticipants
      }
    });
  } catch (error) {
    console.error('❌ Error joining meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join meeting',
      error: error.message
    });
  }
});

// Leave meeting
router.post('/:meetingId/leave', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userId } = req.body;

    // Validate Firebase UID
    if (!FirebaseUserService.isValidFirebaseUID(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Remove participant from meeting
    await meeting.removeParticipant(userId);

    console.log(`👋 User ${userId} left meeting ${meetingId}`);

    res.json({
      success: true,
      message: 'Left meeting successfully',
      data: {
        participantCount: meeting.activeParticipants
      }
    });
  } catch (error) {
    console.error('❌ Error leaving meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave meeting',
      error: error.message
    });
  }
});

// End meeting
router.post('/:meetingId/end', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userId } = req.body;

    // Validate Firebase UID
    if (!FirebaseUserService.isValidFirebaseUID(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is host
    if (meeting.hostUserId !== userId && meeting.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can end the meeting'
      });
    }

    // End the meeting
    await meeting.endMeeting();

    console.log(`🔚 Meeting ${meetingId} ended by ${userId}`);

    res.json({
      success: true,
      message: 'Meeting ended successfully',
      data: meeting
    });
  } catch (error) {
    console.error('❌ Error ending meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end meeting',
      error: error.message
    });
  }
});

// Get meeting chat messages
router.get('/:meetingId/messages', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { limit = 50, skip = 0, since } = req.query;

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    const messages = await Message.getMessagesByMeeting(meetingId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      since
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

// Get active meetings
router.get('/status/active', async (req, res) => {
  try {
    const activeMeetings = await Meeting.findActiveMeetings();

    res.json({
      success: true,
      data: activeMeetings,
      count: activeMeetings.length
    });
  } catch (error) {
    console.error('❌ Error fetching active meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active meetings',
      error: error.message
    });
  }
});

// Get Socket.IO room statistics
router.get('/stats/rooms', async (req, res) => {
  try {
    const roomStats = socketService.getRoomStats();

    res.json({
      success: true,
      data: roomStats
    });
  } catch (error) {
    console.error('❌ Error fetching room stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room statistics',
      error: error.message
    });
  }
});

module.exports = router;
