import { io, Socket } from 'socket.io-client';
import { auth } from '../config/firebase';

interface SocketServiceEvents {
  // Room events
  'room-joined': (data: { roomId: string; participantCount: number; success: boolean }) => void;
  'room-participants': (data: { participants: Participant[]; roomId: string }) => void;
  'user-joined': (data: { participant: Participant; roomId: string; totalParticipants: number }) => void;
  'user-left': (data: { userId: string; userName: string; roomId: string; totalParticipants: number }) => void;
  
  // WebRTC signaling events
  'offer': (data: { offer: RTCSessionDescriptionInit; fromUserId: string; fromUserName: string; roomId: string }) => void;
  'answer': (data: { answer: RTCSessionDescriptionInit; fromUserId: string; fromUserName: string; roomId: string }) => void;
  'ice-candidate': (data: { candidate: RTCIceCandidateInit; fromUserId: string; roomId: string }) => void;
  
  // Chat events
  'chat-message': (message: ChatMessage) => void;
  'chat-history': (data: { messages: ChatMessage[]; roomId: string }) => void;
  
  // Participant control events
  'participant-audio-changed': (data: { userId: string; isAudioMuted: boolean }) => void;
  'participant-video-changed': (data: { userId: string; isVideoMuted: boolean }) => void;
  'participant-hand-raised': (data: { userId: string; userName: string; isHandRaised: boolean }) => void;
  'participant-screen-share-started': (data: { userId: string; userName: string }) => void;
  'participant-screen-share-stopped': (data: { userId: string; userName: string }) => void;
  
  // Error events
  'error': (data: { message: string; error?: string }) => void;
}

export interface Participant {
  userId: string;
  userName: string;
  userEmail: string;
  socketId: string;
  joinedAt: Date;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  roomId: string;
}

class SocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private queuedHandlers: Array<{event: string, handler: Function}> = [];

  /**
   * Connect to Socket.IO server with Firebase authentication
   */
  async connect(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    try {
      // Get Firebase ID token
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      
      // Connect to server
      const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050';
      this.socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      // Set up connection handlers
      this.socket.on('connect', () => {
        console.log('✅ Connected to video conference server');
        
        // Process queued handlers
        this.queuedHandlers.forEach(({ event, handler }) => {
          this.socket!.on(event, handler as any);
        });
        this.queuedHandlers = []; // Clear the queue
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        throw error;
      });

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        this.socket!.on('connect', resolve);
        this.socket!.on('connect_error', reject);
      });

      return this.socket;
    } catch (error) {
      console.error('Failed to connect to Socket.IO server:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.eventHandlers.clear();
      console.log('🔌 Disconnected from video conference server');
    }
  }

  /**
   * Join a video conference room
   */
  async joinRoom(roomId: string, meetingId: string): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('join-room', { roomId, meetingId });
  }

  /**
   * Leave a video conference room
   */
  async leaveRoom(roomId: string): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('leave-room', { roomId });
  }

  /**
   * Send WebRTC offer
   */
  sendOffer(offer: RTCSessionDescriptionInit, targetUserId: string, roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('offer', { offer, targetUserId, roomId });
  }

  /**
   * Send WebRTC answer
   */
  sendAnswer(answer: RTCSessionDescriptionInit, targetUserId: string, roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('answer', { answer, targetUserId, roomId });
  }

  /**
   * Send ICE candidate
   */
  sendIceCandidate(candidate: RTCIceCandidateInit, targetUserId: string, roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('ice-candidate', { candidate, targetUserId, roomId });
  }

  /**
   * Send chat message
   */
  sendChatMessage(message: string, roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('chat-message', { message, roomId });
  }

  /**
   * Mute/unmute audio
   */
  setAudioMuted(roomId: string, isMuted: boolean): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('mute-audio', { roomId, isMuted });
  }

  /**
   * Mute/unmute video
   */
  setVideoMuted(roomId: string, isMuted: boolean): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('mute-video', { roomId, isMuted });
  }

  /**
   * Raise/lower hand
   */
  setHandRaised(roomId: string, isRaised: boolean): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('hand-raise', { roomId, isRaised });
  }

  /**
   * Start screen sharing
   */
  startScreenShare(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('start-screen-share', { roomId });
  }

  /**
   * Stop screen sharing
   */
  stopScreenShare(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('stop-screen-share', { roomId });
  }

  /**
   * Register event handler
   */
  on<K extends keyof SocketServiceEvents>(event: K, handler: SocketServiceEvents[K]): void {
    if (!this.socket) {
      console.warn('Socket not connected yet, queuing event handler for:', event);
      // Queue the handler to be registered when socket connects
      if (!this.queuedHandlers) {
        this.queuedHandlers = [];
      }
      this.queuedHandlers.push({ event, handler });
      return;
    }

    this.socket.on(event, handler as any);
    
    // Store handler for cleanup
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler as Function);
  }

  /**
   * Remove event handler
   */
  off<K extends keyof SocketServiceEvents>(event: K, handler?: SocketServiceEvents[K]): void {
    if (!this.socket) {
      return;
    }

    if (handler) {
      this.socket.off(event, handler as any);
      
      // Remove from stored handlers
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler as Function);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    } else {
      this.socket.off(event);
      this.eventHandlers.delete(event);
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
