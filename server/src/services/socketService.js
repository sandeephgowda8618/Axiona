const { Server } = require('socket.io');
const firebaseAdmin = require('../config/firebase');

class SocketService {
  constructor() {
    this.io = null;
    this.rooms = new Map(); // Store room data: roomId -> {participants: [], messages: []}
    this.userSockets = new Map(); // Store userId -> socketId mapping
  }

  /**
   * Initialize Socket.IO server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com'] 
          : ['http://localhost:3000', 'http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          console.log('❌ Socket connection rejected: No token provided');
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify Firebase token
        const decodedToken = await firebaseAdmin.verifyIdToken(token);
        
        // Attach user info to socket
        socket.userId = decodedToken.uid;
        socket.userEmail = decodedToken.email;
        socket.userName = decodedToken.name || decodedToken.email.split('@')[0];
        
        console.log(`✅ Socket authenticated: ${socket.userName} (${socket.userId})`);
        next();
      } catch (error) {
        console.log('❌ Socket authentication failed:', error.message);
        next(new Error('Authentication failed'));
      }
    });

    // Handle connections
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('🔌 Socket.IO server initialized');
  }

  /**
   * Handle new socket connection
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    console.log(`🔗 User connected: ${socket.userName} (${socket.id})`);
    
    // Store user socket mapping
    this.userSockets.set(socket.userId, socket.id);

    // Join room event
    socket.on('join-room', async (data) => {
      await this.handleJoinRoom(socket, data);
    });

    // Leave room event
    socket.on('leave-room', async (data) => {
      await this.handleLeaveRoom(socket, data);
    });

    // WebRTC signaling events
    socket.on('offer', (data) => {
      this.handleOffer(socket, data);
    });

    socket.on('answer', (data) => {
      this.handleAnswer(socket, data);
    });

    socket.on('ice-candidate', (data) => {
      this.handleIceCandidate(socket, data);
    });

    // Chat events
    socket.on('chat-message', async (data) => {
      await this.handleChatMessage(socket, data);
    });

    // Participant events
    socket.on('mute-audio', (data) => {
      this.handleMuteAudio(socket, data);
    });

    socket.on('mute-video', (data) => {
      this.handleMuteVideo(socket, data);
    });

    socket.on('hand-raise', (data) => {
      this.handleHandRaise(socket, data);
    });

    // Screen sharing events
    socket.on('start-screen-share', (data) => {
      this.handleStartScreenShare(socket, data);
    });

    socket.on('stop-screen-share', (data) => {
      this.handleStopScreenShare(socket, data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  /**
   * Handle user joining a room
   */
  async handleJoinRoom(socket, { roomId, meetingId }) {
    try {
      console.log(`👥 User ${socket.userName} joining room: ${roomId}`);

      // Leave any previous rooms
      const previousRooms = Array.from(socket.rooms).filter(room => room !== socket.id);
      previousRooms.forEach(room => socket.leave(room));

      // Join the new room
      socket.join(roomId);
      socket.currentRoom = roomId;

      // Initialize room if it doesn't exist
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, {
          participants: [],
          messages: [],
          createdAt: new Date(),
          meetingId: meetingId
        });
      }

      const room = this.rooms.get(roomId);
      
      // Add participant if not already in room
      const existingParticipant = room.participants.find(p => p.userId === socket.userId);
      if (!existingParticipant) {
        const participant = {
          userId: socket.userId,
          userName: socket.userName,
          userEmail: socket.userEmail,
          socketId: socket.id,
          joinedAt: new Date(),
          isAudioMuted: false,
          isVideoMuted: false,
          isHandRaised: false,
          isScreenSharing: false
        };
        
        room.participants.push(participant);
      } else {
        // Update socket ID for existing participant
        existingParticipant.socketId = socket.id;
      }

      // Send current participants to the new user
      socket.emit('room-participants', {
        participants: room.participants,
        roomId: roomId
      });

      // Send recent chat messages to the new user
      socket.emit('chat-history', {
        messages: room.messages.slice(-50), // Last 50 messages
        roomId: roomId
      });

      // Notify others about the new participant
      socket.to(roomId).emit('user-joined', {
        participant: room.participants.find(p => p.userId === socket.userId),
        roomId: roomId,
        totalParticipants: room.participants.length
      });

      // Confirm join to the user
      socket.emit('room-joined', {
        roomId: roomId,
        participantCount: room.participants.length,
        success: true
      });

      console.log(`✅ User ${socket.userName} joined room ${roomId}. Total participants: ${room.participants.length}`);

    } catch (error) {
      console.error('❌ Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room', error: error.message });
    }
  }

  /**
   * Handle user leaving a room
   */
  async handleLeaveRoom(socket, { roomId }) {
    try {
      console.log(`👋 User ${socket.userName} leaving room: ${roomId}`);

      if (this.rooms.has(roomId)) {
        const room = this.rooms.get(roomId);
        
        // Remove participant from room
        room.participants = room.participants.filter(p => p.userId !== socket.userId);

        // Notify others about the departure
        socket.to(roomId).emit('user-left', {
          userId: socket.userId,
          userName: socket.userName,
          roomId: roomId,
          totalParticipants: room.participants.length
        });

        // If room is empty, clean it up
        if (room.participants.length === 0) {
          this.rooms.delete(roomId);
          console.log(`🗑️ Room ${roomId} cleaned up (empty)`);
        }
      }

      socket.leave(roomId);
      socket.currentRoom = null;

      console.log(`✅ User ${socket.userName} left room ${roomId}`);

    } catch (error) {
      console.error('❌ Error leaving room:', error);
    }
  }

  /**
   * Handle WebRTC offer
   */
  handleOffer(socket, { offer, targetUserId, roomId }) {
    const targetSocketId = this.userSockets.get(targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('offer', {
        offer,
        fromUserId: socket.userId,
        fromUserName: socket.userName,
        roomId
      });
      console.log(`📞 Offer sent from ${socket.userName} to ${targetUserId}`);
    }
  }

  /**
   * Handle WebRTC answer
   */
  handleAnswer(socket, { answer, targetUserId, roomId }) {
    const targetSocketId = this.userSockets.get(targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('answer', {
        answer,
        fromUserId: socket.userId,
        fromUserName: socket.userName,
        roomId
      });
      console.log(`📞 Answer sent from ${socket.userName} to ${targetUserId}`);
    }
  }

  /**
   * Handle ICE candidate
   */
  handleIceCandidate(socket, { candidate, targetUserId, roomId }) {
    const targetSocketId = this.userSockets.get(targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('ice-candidate', {
        candidate,
        fromUserId: socket.userId,
        roomId
      });
    }
  }

  /**
   * Handle chat message
   */
  async handleChatMessage(socket, { message, roomId }) {
    try {
      if (!this.rooms.has(roomId)) {
        return socket.emit('error', { message: 'Room not found' });
      }

      const chatMessage = {
        id: Date.now().toString(),
        userId: socket.userId,
        userName: socket.userName,
        message: message.trim(),
        timestamp: new Date(),
        roomId: roomId
      };

      // Store message in room
      const room = this.rooms.get(roomId);
      room.messages.push(chatMessage);

      // Keep only last 100 messages
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }

      // Broadcast message to all room participants
      this.io.to(roomId).emit('chat-message', chatMessage);

      console.log(`💬 Chat message from ${socket.userName} in room ${roomId}: ${message}`);

    } catch (error) {
      console.error('❌ Error handling chat message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Handle audio mute/unmute
   */
  handleMuteAudio(socket, { roomId, isMuted }) {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      const participant = room.participants.find(p => p.userId === socket.userId);
      if (participant) {
        participant.isAudioMuted = isMuted;
        
        // Notify others about the change
        socket.to(roomId).emit('participant-audio-changed', {
          userId: socket.userId,
          isAudioMuted: isMuted
        });
      }
    }
  }

  /**
   * Handle video mute/unmute
   */
  handleMuteVideo(socket, { roomId, isMuted }) {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      const participant = room.participants.find(p => p.userId === socket.userId);
      if (participant) {
        participant.isVideoMuted = isMuted;
        
        // Notify others about the change
        socket.to(roomId).emit('participant-video-changed', {
          userId: socket.userId,
          isVideoMuted: isMuted
        });
      }
    }
  }

  /**
   * Handle hand raise
   */
  handleHandRaise(socket, { roomId, isRaised }) {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      const participant = room.participants.find(p => p.userId === socket.userId);
      if (participant) {
        participant.isHandRaised = isRaised;
        
        // Notify others about the hand raise
        socket.to(roomId).emit('participant-hand-raised', {
          userId: socket.userId,
          userName: socket.userName,
          isHandRaised: isRaised
        });
      }
    }
  }

  /**
   * Handle screen sharing start
   */
  handleStartScreenShare(socket, { roomId }) {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      const participant = room.participants.find(p => p.userId === socket.userId);
      if (participant) {
        participant.isScreenSharing = true;
        
        // Notify others about screen sharing
        socket.to(roomId).emit('participant-screen-share-started', {
          userId: socket.userId,
          userName: socket.userName
        });
      }
    }
  }

  /**
   * Handle screen sharing stop
   */
  handleStopScreenShare(socket, { roomId }) {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      const participant = room.participants.find(p => p.userId === socket.userId);
      if (participant) {
        participant.isScreenSharing = false;
        
        // Notify others about screen sharing stopped
        socket.to(roomId).emit('participant-screen-share-stopped', {
          userId: socket.userId,
          userName: socket.userName
        });
      }
    }
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(socket) {
    console.log(`🔌 User disconnected: ${socket.userName} (${socket.id})`);

    // Remove from user sockets mapping
    this.userSockets.delete(socket.userId);

    // Remove from any rooms
    if (socket.currentRoom && this.rooms.has(socket.currentRoom)) {
      const room = this.rooms.get(socket.currentRoom);
      room.participants = room.participants.filter(p => p.userId !== socket.userId);

      // Notify others about the departure
      socket.to(socket.currentRoom).emit('user-left', {
        userId: socket.userId,
        userName: socket.userName,
        roomId: socket.currentRoom,
        totalParticipants: room.participants.length
      });

      // Clean up empty room
      if (room.participants.length === 0) {
        this.rooms.delete(socket.currentRoom);
        console.log(`🗑️ Room ${socket.currentRoom} cleaned up (empty after disconnect)`);
      }
    }
  }

  /**
   * Get room statistics
   */
  getRoomStats() {
    const stats = {
      totalRooms: this.rooms.size,
      totalParticipants: 0,
      rooms: []
    };

    this.rooms.forEach((room, roomId) => {
      stats.totalParticipants += room.participants.length;
      stats.rooms.push({
        roomId,
        participantCount: room.participants.length,
        createdAt: room.createdAt,
        meetingId: room.meetingId
      });
    });

    return stats;
  }
}

module.exports = new SocketService();
