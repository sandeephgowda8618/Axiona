import { socketService, Participant } from './socketService';

interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

class WebRTCService {
  private peers: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private currentRoomId: string | null = null;
  private isScreenSharing: boolean = false;

  private config: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add TURN servers for production
      // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
    ]
  };

  private eventHandlers: {
    onLocalStream?: (stream: MediaStream) => void;
    onRemoteStream?: (userId: string, stream: MediaStream) => void;
    onRemoteStreamRemoved?: (userId: string) => void;
    onPeerConnected?: (userId: string) => void;
    onPeerDisconnected?: (userId: string) => void;
    onError?: (error: Error) => void;
  } = {};

  /**
   * Initialize WebRTC service with event handlers
   */
  initialize(handlers: typeof this.eventHandlers): void {
    this.eventHandlers = handlers;
    this.setupSocketListeners();
  }

  /**
   * Get user media (camera and microphone)
   */
  async getUserMedia(audio: boolean = true, video: boolean = true): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false,
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      });

      this.localStream = stream;
      this.eventHandlers.onLocalStream?.(stream);
      
      console.log('✅ Got user media:', { audio, video });
      return stream;
    } catch (error) {
      console.error('❌ Error getting user media:', error);
      this.eventHandlers.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(): Promise<MediaStream> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true // Include system audio
      });

      this.screenStream = screenStream;
      this.isScreenSharing = true;

      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      
      for (const [userId, peer] of this.peers) {
        const sender = peer.connection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }

      // Notify other participants
      if (this.currentRoomId) {
        socketService.startScreenShare(this.currentRoomId);
      }

      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      console.log('✅ Screen sharing started');
      return screenStream;
    } catch (error) {
      console.error('❌ Error starting screen share:', error);
      this.eventHandlers.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare(): Promise<void> {
    if (!this.isScreenSharing || !this.screenStream) {
      return;
    }

    try {
      // Stop screen stream
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
      this.isScreenSharing = false;

      // Restore camera video in all peer connections
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0];
        
        for (const [userId, peer] of this.peers) {
          const sender = peer.connection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender && videoTrack) {
            await sender.replaceTrack(videoTrack);
          }
        }
      }

      // Notify other participants
      if (this.currentRoomId) {
        socketService.stopScreenShare(this.currentRoomId);
      }

      console.log('✅ Screen sharing stopped');
    } catch (error) {
      console.error('❌ Error stopping screen share:', error);
      this.eventHandlers.onError?.(error as Error);
    }
  }

  /**
   * Join room and start peer connections
   */
  async joinRoom(roomId: string, participants: Participant[]): Promise<void> {
    this.currentRoomId = roomId;
    
    // Create peer connections for existing participants
    for (const participant of participants) {
      if (participant.userId !== this.getCurrentUserId()) {
        await this.createPeerConnection(participant.userId, true); // This peer will create offer
      }
    }
  }

  /**
   * Handle new participant joining
   */
  async handleParticipantJoined(participant: Participant): Promise<void> {
    if (participant.userId !== this.getCurrentUserId()) {
      await this.createPeerConnection(participant.userId, false); // Wait for offer from other peer
    }
  }

  /**
   * Handle participant leaving
   */
  handleParticipantLeft(userId: string): void {
    this.removePeerConnection(userId);
  }

  /**
   * Create peer connection
   */
  private async createPeerConnection(userId: string, shouldCreateOffer: boolean): Promise<void> {
    try {
      const connection = new RTCPeerConnection(this.config);
      const peer: PeerConnection = { userId, connection };
      this.peers.set(userId, peer);

      // Add local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          connection.addTrack(track, this.localStream!);
        });
      }

      // Handle remote stream
      connection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        peer.remoteStream = remoteStream;
        this.eventHandlers.onRemoteStream?.(userId, remoteStream);
        console.log(`✅ Received remote stream from ${userId}`);
      };

      // Handle ICE candidates
      connection.onicecandidate = (event) => {
        if (event.candidate && this.currentRoomId) {
          socketService.sendIceCandidate(event.candidate, userId, this.currentRoomId);
        }
      };

      // Handle connection state changes
      connection.onconnectionstatechange = () => {
        console.log(`🔗 Connection state with ${userId}:`, connection.connectionState);
        
        if (connection.connectionState === 'connected') {
          this.eventHandlers.onPeerConnected?.(userId);
        } else if (connection.connectionState === 'disconnected' || connection.connectionState === 'failed') {
          this.eventHandlers.onPeerDisconnected?.(userId);
        }
      };

      // Create offer if we should initiate
      if (shouldCreateOffer) {
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        
        if (this.currentRoomId) {
          socketService.sendOffer(offer, userId, this.currentRoomId);
        }
      }

      console.log(`✅ Created peer connection for ${userId}`);
    } catch (error) {
      console.error(`❌ Error creating peer connection for ${userId}:`, error);
      this.eventHandlers.onError?.(error as Error);
    }
  }

  /**
   * Remove peer connection
   */
  private removePeerConnection(userId: string): void {
    const peer = this.peers.get(userId);
    if (peer) {
      peer.connection.close();
      this.eventHandlers.onRemoteStreamRemoved?.(userId);
      this.peers.delete(userId);
      console.log(`🗑️ Removed peer connection for ${userId}`);
    }
  }

  /**
   * Setup Socket.IO listeners for WebRTC signaling
   */
  private setupSocketListeners(): void {
    // Handle WebRTC offer
    socketService.on('offer', async (data) => {
      const { offer, fromUserId, roomId } = data;
      
      if (roomId !== this.currentRoomId) return;
      
      try {
        let peer = this.peers.get(fromUserId);
        if (!peer) {
          await this.createPeerConnection(fromUserId, false);
          peer = this.peers.get(fromUserId)!;
        }

        await peer.connection.setRemoteDescription(offer);
        const answer = await peer.connection.createAnswer();
        await peer.connection.setLocalDescription(answer);
        
        socketService.sendAnswer(answer, fromUserId, roomId);
        console.log(`📞 Handled offer from ${fromUserId}`);
      } catch (error) {
        console.error(`❌ Error handling offer from ${fromUserId}:`, error);
      }
    });

    // Handle WebRTC answer
    socketService.on('answer', async (data) => {
      const { answer, fromUserId, roomId } = data;
      
      if (roomId !== this.currentRoomId) return;
      
      try {
        const peer = this.peers.get(fromUserId);
        if (peer) {
          await peer.connection.setRemoteDescription(answer);
          console.log(`📞 Handled answer from ${fromUserId}`);
        }
      } catch (error) {
        console.error(`❌ Error handling answer from ${fromUserId}:`, error);
      }
    });

    // Handle ICE candidate
    socketService.on('ice-candidate', async (data) => {
      const { candidate, fromUserId, roomId } = data;
      
      if (roomId !== this.currentRoomId) return;
      
      try {
        const peer = this.peers.get(fromUserId);
        if (peer) {
          await peer.connection.addIceCandidate(candidate);
        }
      } catch (error) {
        console.error(`❌ Error handling ICE candidate from ${fromUserId}:`, error);
      }
    });

    // Handle participant events
    socketService.on('user-joined', (data) => {
      this.handleParticipantJoined(data.participant);
    });

    socketService.on('user-left', (data) => {
      this.handleParticipantLeft(data.userId);
    });
  }

  /**
   * Mute/unmute local audio
   */
  setAudioMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
      
      if (this.currentRoomId) {
        socketService.setAudioMuted(this.currentRoomId, muted);
      }
    }
  }

  /**
   * Mute/unmute local video
   */
  setVideoMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !muted;
      });
      
      if (this.currentRoomId) {
        socketService.setVideoMuted(this.currentRoomId, muted);
      }
    }
  }

  /**
   * Leave room and cleanup
   */
  leaveRoom(): void {
    // Close all peer connections
    this.peers.forEach((peer, userId) => {
      this.removePeerConnection(userId);
    });
    
    // Stop local streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
      this.isScreenSharing = false;
    }
    
    this.currentRoomId = null;
    console.log('✅ Left WebRTC room');
  }

  /**
   * Get current user ID (from Socket.IO or auth)
   */
  private getCurrentUserId(): string {
    // This should be implemented based on your auth system
    // For now, return a placeholder
    return 'current-user-id';
  }

  /**
   * Get connection stats
   */
  async getConnectionStats(): Promise<Map<string, RTCStatsReport>> {
    const stats = new Map<string, RTCStatsReport>();
    
    for (const [userId, peer] of this.peers) {
      try {
        const peerStats = await peer.connection.getStats();
        stats.set(userId, peerStats);
      } catch (error) {
        console.error(`Error getting stats for ${userId}:`, error);
      }
    }
    
    return stats;
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote streams
   */
  getRemoteStreams(): Map<string, MediaStream> {
    const streams = new Map<string, MediaStream>();
    
    this.peers.forEach((peer, userId) => {
      if (peer.remoteStream) {
        streams.set(userId, peer.remoteStream);
      }
    });
    
    return streams;
  }

  /**
   * Check if screen sharing
   */
  isScreenSharingActive(): boolean {
    return this.isScreenSharing;
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService();
export default webrtcService;
