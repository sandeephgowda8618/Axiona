import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService, Participant, ChatMessage } from '../services/socketService';
import { webrtcService } from '../services/webrtcService';
import { meetingsAPI, Meeting, MeetingInfo } from '../services/meetingsAPI';
import { auth } from '../config/firebase';

interface UseVideoConferenceOptions {
  onError?: (error: Error) => void;
  onConnectionStateChange?: (state: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

interface VideoConferenceState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Meeting state
  meeting: Meeting | null;
  participants: Participant[];
  currentRoomId: string | null;
  
  // Media state
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  
  // Chat state
  messages: ChatMessage[];
  
  // UI state
  isHandRaised: boolean;
}

export const useVideoConference = (options: UseVideoConferenceOptions = {}) => {
  const [state, setState] = useState<VideoConferenceState>({
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    meeting: null,
    participants: [],
    currentRoomId: null,
    localStream: null,
    remoteStreams: new Map(),
    isAudioMuted: false,
    isVideoMuted: false,
    isScreenSharing: false,
    messages: [],
    isHandRaised: false,
  });

  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Initialize services
  useEffect(() => {
    const initializeWebRTC = () => {
      webrtcService.initialize({
        onLocalStream: (stream) => {
          setState(prev => ({ ...prev, localStream: stream }));
        },
        onRemoteStream: (userId, stream) => {
          setState(prev => ({
            ...prev,
            remoteStreams: new Map(prev.remoteStreams).set(userId, stream)
          }));
          
          // Auto-play remote video
          const videoElement = remoteVideoRefs.current.get(userId);
          if (videoElement) {
            videoElement.srcObject = stream;
          }
        },
        onRemoteStreamRemoved: (userId) => {
          setState(prev => {
            const newStreams = new Map(prev.remoteStreams);
            newStreams.delete(userId);
            return { ...prev, remoteStreams: newStreams };
          });
        },
        onPeerConnected: (userId) => {
          console.log(`Peer connected: ${userId}`);
        },
        onPeerDisconnected: (userId) => {
          console.log(`Peer disconnected: ${userId}`);
        },
        onError: (error) => {
          options.onError?.(error);
          setState(prev => ({ ...prev, connectionError: error.message }));
        }
      });
    };

    initializeWebRTC();

    return () => {
      // Cleanup on unmount
      disconnect();
    };
  }, []);

  // Socket event handlers
  useEffect(() => {
    const setupSocketHandlers = () => {
      socketService.on('room-joined', (data) => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          currentRoomId: data.roomId,
          connectionError: null
        }));
        options.onConnectionStateChange?.(('connected'));
      });

      socketService.on('room-participants', (data) => {
        setState(prev => ({ ...prev, participants: data.participants }));
        webrtcService.joinRoom(data.roomId, data.participants);
      });

      socketService.on('user-joined', (data) => {
        setState(prev => ({
          ...prev,
          participants: [...prev.participants, data.participant]
        }));
      });

      socketService.on('user-left', (data) => {
        setState(prev => ({
          ...prev,
          participants: prev.participants.filter(p => p.userId !== data.userId)
        }));
      });

      socketService.on('chat-message', (message) => {
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, message]
        }));
      });

      socketService.on('chat-history', (data) => {
        setState(prev => ({
          ...prev,
          messages: data.messages
        }));
      });

      socketService.on('participant-audio-changed', (data) => {
        setState(prev => ({
          ...prev,
          participants: prev.participants.map(p =>
            p.userId === data.userId ? { ...p, isAudioMuted: data.isAudioMuted } : p
          )
        }));
      });

      socketService.on('participant-video-changed', (data) => {
        setState(prev => ({
          ...prev,
          participants: prev.participants.map(p =>
            p.userId === data.userId ? { ...p, isVideoMuted: data.isVideoMuted } : p
          )
        }));
      });

      socketService.on('participant-hand-raised', (data) => {
        setState(prev => ({
          ...prev,
          participants: prev.participants.map(p =>
            p.userId === data.userId ? { ...p, isHandRaised: data.isHandRaised } : p
          )
        }));
      });

      socketService.on('participant-screen-share-started', (data) => {
        setState(prev => ({
          ...prev,
          participants: prev.participants.map(p =>
            p.userId === data.userId ? { ...p, isScreenSharing: true } : p
          )
        }));
      });

      socketService.on('participant-screen-share-stopped', (data) => {
        setState(prev => ({
          ...prev,
          participants: prev.participants.map(p =>
            p.userId === data.userId ? { ...p, isScreenSharing: false } : p
          )
        }));
      });

      socketService.on('error', (data) => {
        setState(prev => ({
          ...prev,
          connectionError: data.message,
          isConnecting: false
        }));
        options.onConnectionStateChange?.('error');
        options.onError?.(new Error(data.message));
      });
    };

    if (socketService.isConnected()) {
      setupSocketHandlers();
    }

    return () => {
      // Clean up event listeners
      const events = [
        'room-joined', 'room-participants', 'user-joined', 'user-left',
        'chat-message', 'chat-history', 'participant-audio-changed',
        'participant-video-changed', 'participant-hand-raised',
        'participant-screen-share-started', 'participant-screen-share-stopped', 'error'
      ];
      
      events.forEach(event => {
        socketService.off(event as any);
      });
    };
  }, []);

  /**
   * Connect to Socket.IO server
   */
  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, connectionError: null }));
      options.onConnectionStateChange?.('connecting');
      
      await socketService.connect();
      
      setState(prev => ({ ...prev, isConnecting: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectionError: (error as Error).message
      }));
      options.onConnectionStateChange?.('error');
      options.onError?.(error as Error);
    }
  }, []);

  /**
   * Disconnect from server and cleanup
   */
  const disconnect = useCallback(() => {
    socketService.disconnect();
    webrtcService.leaveRoom();
    
    setState({
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      meeting: null,
      participants: [],
      currentRoomId: null,
      localStream: null,
      remoteStreams: new Map(),
      isAudioMuted: false,
      isVideoMuted: false,
      isScreenSharing: false,
      messages: [],
      isHandRaised: false,
    });
    
    options.onConnectionStateChange?.('disconnected');
  }, []);

  /**
   * Join a meeting room
   */
  const joinMeeting = useCallback(async (meetingId: string, password?: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First connect to Socket.IO if not connected
      if (!socketService.isConnected()) {
        await connect();
      }

      // Join meeting via API
      const joinResult = await meetingsAPI.joinMeeting(meetingId, {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userEmail: user.email || '',
        roomPassword: password
      });

      setState(prev => ({ ...prev, meeting: joinResult.data.meeting }));

      // Get user media
      await webrtcService.getUserMedia(true, true);

      // Join Socket.IO room
      await socketService.joinRoom(joinResult.data.roomId, meetingId);

    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }, [connect]);

  /**
   * Leave the current meeting
   */
  const leaveMeeting = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user || !state.meeting) {
        return;
      }

      // Leave meeting via API
      await meetingsAPI.leaveMeeting(state.meeting.meetingId, user.uid);

      // Leave Socket.IO room
      if (state.currentRoomId) {
        await socketService.leaveRoom(state.currentRoomId);
      }

      // Cleanup WebRTC
      webrtcService.leaveRoom();

      // Reset state
      setState(prev => ({
        ...prev,
        meeting: null,
        participants: [],
        currentRoomId: null,
        localStream: null,
        remoteStreams: new Map(),
        messages: [],
        isHandRaised: false,
        isScreenSharing: false
      }));

    } catch (error) {
      options.onError?.(error as Error);
    }
  }, [state.meeting, state.currentRoomId]);

  /**
   * Toggle audio mute
   */
  const toggleAudio = useCallback(() => {
    const newMutedState = !state.isAudioMuted;
    webrtcService.setAudioMuted(newMutedState);
    setState(prev => ({ ...prev, isAudioMuted: newMutedState }));
  }, [state.isAudioMuted]);

  /**
   * Toggle video mute
   */
  const toggleVideo = useCallback(() => {
    const newMutedState = !state.isVideoMuted;
    webrtcService.setVideoMuted(newMutedState);
    setState(prev => ({ ...prev, isVideoMuted: newMutedState }));
  }, [state.isVideoMuted]);

  /**
   * Toggle screen sharing
   */
  const toggleScreenShare = useCallback(async () => {
    try {
      if (state.isScreenSharing) {
        await webrtcService.stopScreenShare();
        setState(prev => ({ ...prev, isScreenSharing: false }));
      } else {
        await webrtcService.startScreenShare();
        setState(prev => ({ ...prev, isScreenSharing: true }));
      }
    } catch (error) {
      options.onError?.(error as Error);
    }
  }, [state.isScreenSharing]);

  /**
   * Toggle hand raise
   */
  const toggleHandRaise = useCallback(() => {
    const newHandRaiseState = !state.isHandRaised;
    
    if (state.currentRoomId) {
      socketService.setHandRaised(state.currentRoomId, newHandRaiseState);
    }
    
    setState(prev => ({ ...prev, isHandRaised: newHandRaiseState }));
  }, [state.isHandRaised, state.currentRoomId]);

  /**
   * Send chat message
   */
  const sendMessage = useCallback((message: string) => {
    if (state.currentRoomId && message.trim()) {
      socketService.sendChatMessage(message.trim(), state.currentRoomId);
    }
  }, [state.currentRoomId]);

  /**
   * Get remote video ref
   */
  const getRemoteVideoRef = useCallback((userId: string) => {
    return (element: HTMLVideoElement | null) => {
      if (element) {
        remoteVideoRefs.current.set(userId, element);
        
        // Set stream if available
        const stream = state.remoteStreams.get(userId);
        if (stream) {
          element.srcObject = stream;
        }
      } else {
        remoteVideoRefs.current.delete(userId);
      }
    };
  }, [state.remoteStreams]);

  return {
    // State
    ...state,
    
    // Actions
    connect,
    disconnect,
    joinMeeting,
    leaveMeeting,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    sendMessage,
    getRemoteVideoRef,
    
    // Utils
    isInMeeting: !!state.meeting,
    participantCount: state.participants.length,
    hasRemoteStreams: state.remoteStreams.size > 0,
  };
};
