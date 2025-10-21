import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Settings
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isMe?: boolean;
  avatar?: string;
}

const ConferenceMeeting: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'Sarah Wilson',
      message: 'Hey everyone! Ready to start the study session?',
      time: '2:34 PM',
      avatar: '👩‍💼'
    },
    {
      id: 2,
      sender: 'Mike Chen',
      message: 'Yes! I have my notes ready. Should we share screen?',
      time: '2:35 PM',
      avatar: '👨‍💻'
    },
    {
      id: 3,
      sender: 'John Smith (You)',
      message: 'Perfect! Let me start sharing my screen with the presentation.',
      time: '2:36 PM',
      avatar: '👤',
      isMe: true
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);

  // Mock participants data
  const [participants] = useState<Participant[]>([
    {
      id: '1',
      name: 'John Smith (You)',
      isVideoOn: false,
      isAudioOn: true,
      isMe: true,
      avatar: '👤'
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      isVideoOn: true,
      isAudioOn: true,
      avatar: '👩‍💼'
    },
    {
      id: '3',
      name: 'Mike Chen',
      isVideoOn: true,
      isAudioOn: true,
      avatar: '👨‍💻'
    },
    {
      id: '4',
      name: 'Waiting for participant',
      isVideoOn: false,
      isAudioOn: false,
      avatar: '⏳'
    }
  ]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: chatMessages.length + 1,
        sender: 'John Smith (You)',
        message: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: '👤',
        isMe: true
      };
      setChatMessages([...chatMessages, newMsg]);
      setNewMessage('');
    }
  };

  const handleLeaveCall = () => {
    navigate('/conference');
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="font-medium">Study-AI</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span>Room ID:</span>
            <span className="bg-gray-700 px-2 py-1 rounded text-xs font-mono">{roomId}</span>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-gray-300">Password Protected</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Connected</span>
          </div>
          <span>1 participant</span>
          <button 
            onClick={handleLeaveCall}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Leave Call
          </button>
        </div>
      </div>

  {/* Main Content */}
  <div className="flex-1 flex min-h-0">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-2 gap-4 h-full">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="bg-gray-800 rounded-lg overflow-hidden relative flex items-center justify-center"
              >
                {participant.name === 'Waiting for participant' ? (
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">⏳</div>
                    <p className="text-sm">Waiting for participant</p>
                  </div>
                ) : participant.isVideoOn ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-4">{participant.avatar}</div>
                      <div className="bg-black/20 rounded-lg p-4">
                        <div className="text-xl font-medium">{participant.name.split(' ')[0]}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <div className="text-center text-gray-300">
                      <div className="text-4xl mb-2">{participant.avatar}</div>
                      <p className="text-sm">Camera Off</p>
                    </div>
                  </div>
                )}
                
                {/* Participant Name Overlay */}
                <div className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded text-sm font-medium flex items-center space-x-2">
                  <span>{participant.name}</span>
                  {!participant.isAudioOn && (
                    <MicOff className="w-3 h-3 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col min-h-0">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat
                </h3>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-500">3</span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {chatMessages.map((message) => (
                <div key={message.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm">{message.avatar}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {message.sender}
                      </h4>
                      <span className="text-xs text-gray-500">{message.time}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-full transition-colors ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Button */}
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-3 rounded-full transition-colors ${
              !isVideoOn 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Share Screen */}
          <button className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors">
            <Monitor className="w-5 h-5" />
          </button>

          {/* Reactions */}
          <button className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors">
            <span className="text-lg">👍</span>
          </button>

          {/* More Options */}
          <button className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConferenceMeeting;
