import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MessageCircle, 
  MoreHorizontal,
  PhoneOff,
  Send,
  Settings,
  Users,
  Hand
} from 'lucide-react';
import { useVideoConference } from '../hooks/useVideoConference';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const ConferenceMeeting: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const {
    // State
    isConnected,
    isConnecting,
    connectionError,
    meeting,
    participants,
    currentRoomId,
    localStream,
    remoteStreams,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    messages,
    isHandRaised,
    // Actions
    connect,
    disconnect,
    joinMeeting,
    leaveMeeting,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    sendMessage,
    toggleHandRaise
  } = useVideoConference({
    onError: (error) => {
      console.error('Video conference error:', error);
      alert(`Error: ${error.message}`);
    },
    onConnectionStateChange: (connectionState) => {
      console.log('Connection state:', connectionState);
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;

    const initializeConference = async () => {
      try {
        // Connect to Socket.IO first
        await connect();
        
        // Join the meeting with password if provided
        const password = location.state?.password;
        await joinMeeting(roomId, password);
      } catch (error) {
        console.error('Failed to join meeting:', error);
        alert('Failed to join meeting. Please try again.');
        navigate('/conference');
      }
    };

    initializeConference();

    return () => {
      leaveMeeting();
      disconnect();
    };
  }, [roomId, user, connect, disconnect, joinMeeting, leaveMeeting, location.state, navigate]);

  useEffect(() => {
    // Set local video stream
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    // Update remote video streams
    remoteStreams.forEach((stream: MediaStream, userId: string) => {
      const videoElement = remoteVideoRefs.current.get(userId);
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleLeaveMeeting = () => {
    leaveMeeting();
    disconnect();
    navigate('/conference');
  };

  const renderParticipantVideo = (participant: any, index: number) => {
    const isMe = participant.userId === user?.uid;
    
    return (
      <div 
        key={participant.userId || index}
        className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video"
      >
        <video
          ref={isMe ? localVideoRef : (el) => {
            if (el && participant.userId) {
              remoteVideoRefs.current.set(participant.userId, el);
            }
          }}
          autoPlay
          playsInline
          muted={isMe}
          className="w-full h-full object-cover"
        />
        
        {/* Participant overlay */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
          {participant.userName || participant.userEmail} {isMe && '(You)'}
        </div>
        
        {/* Audio/Video status indicators */}
        <div className="absolute top-2 right-2 flex space-x-1">
          {!participant.isAudioMuted && (
            <div className="bg-green-500 p-1 rounded">
              <Mic className="w-3 h-3 text-white" />
            </div>
          )}
          {participant.isVideoMuted && (
            <div className="bg-red-500 p-1 rounded">
              <VideoOff className="w-3 h-3 text-white" />
            </div>
          )}
          {participant.isHandRaised && (
            <div className="bg-yellow-500 p-1 rounded">
              <Hand className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Screen sharing indicator */}
        {participant.isScreenSharing && (
          <div className="absolute top-2 left-2 bg-blue-500 px-2 py-1 rounded text-xs text-white">
            Sharing Screen
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to join the meeting</h2>
          <button 
            onClick={() => navigate('/auth')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Meeting header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-lg font-semibold">
              {meeting?.title || `Meeting ${roomId}`}
            </h1>
            <p className="text-gray-400 text-sm">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-lg ${showChat ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="p-2 bg-gray-600 text-white rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Video grid */}
        <div className={`flex-1 p-4 ${showChat ? 'mr-80' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {participants.map(renderParticipantVideo)}
            
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 6 - participants.length) }).map((_, index) => (
              <div 
                key={`empty-${index}`}
                className="bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center"
              >
                <div className="text-gray-500 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2" />
                  <p>Waiting for participant</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">Chat</h3>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message: any, index: number) => (
                <div key={index} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-blue-400 text-sm font-medium">
                      {message.userName}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-white text-sm">{message.message}</p>
                </div>
              ))}
            </div>
            
            {/* Message input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-l-lg focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${isAudioMuted ? 'bg-red-600' : 'bg-gray-600'} text-white`}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoMuted ? 'bg-red-600' : 'bg-gray-600'} text-white`}
          >
            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
          
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
          >
            <Monitor className="w-5 h-5" />
          </button>
          
          <button
            onClick={toggleHandRaise}
            className={`p-3 rounded-full ${isHandRaised ? 'bg-yellow-600' : 'bg-gray-600'} text-white`}
          >
            <Hand className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleLeaveMeeting}
            className="p-3 rounded-full bg-red-600 text-white"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Connection status */}
      {isConnecting && (
        <div className="fixed top-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg">
          Connecting...
        </div>
      )}
      
      {connectionError && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg">
          {connectionError}
        </div>
      )}
    </div>
  );
};

export default ConferenceMeeting;
