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
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between text-white border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="font-semibold">Study-AI</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-gray-300">Room ID:</span>
            <span className="bg-gray-700 px-2 py-1 rounded text-xs font-mono text-blue-200">{roomId}</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">Password Protected</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-300">Connected</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-300">{participants.length} participants</span>
          </div>
          <button 
            onClick={handleLeaveCall}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Leave Call
          </button>
        </div>
      </div>

  {/* Main Content */}
  <div className="flex-1 flex min-h-0">
        {/* Video Grid */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Participant 1 - You (Camera Off) */}
            <div className="bg-gray-800 rounded-lg relative overflow-hidden border border-gray-600">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <span className="text-white text-2xl font-semibold">JS</span>
                  </div>
                  <p className="text-white font-medium">John Smith (You)</p>
                  <p className="text-gray-400 text-sm mt-1">Camera Off</p>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 flex items-center space-x-2">
                <div className="bg-gray-900 bg-opacity-75 px-2 py-1 rounded text-white text-sm font-medium">
                  John Smith (You)
                </div>
                {isMuted && (
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                    <MicOff className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Participant 2 - Sarah */}
            <div className="bg-slate-800 rounded-lg relative overflow-hidden border border-slate-700">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-4xl">👩‍💼</span>
                </div>
              </div>
              <div className="absolute bottom-3 left-3">
                <div className="bg-slate-900 bg-opacity-75 px-2 py-1 rounded text-white text-sm font-medium">
                  Sarah Wilson
                </div>
              </div>
            </div>

            {/* Participant 3 - Mike */}
            <div className="bg-slate-800 rounded-lg relative overflow-hidden border border-slate-700">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-green-600 flex items-center justify-center">
                  <span className="text-white text-4xl">👨‍💻</span>
                </div>
              </div>
              <div className="absolute bottom-3 left-3">
                <div className="bg-slate-900 bg-opacity-75 px-2 py-1 rounded text-white text-sm font-medium">
                  Mike Chen
                </div>
              </div>
            </div>

            {/* Empty Slot */}
            <div className="bg-slate-800 rounded-lg relative overflow-hidden border-2 border-dashed border-slate-600">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mb-2">
                    <span className="text-4xl">➕</span>
                  </div>
                  <p className="text-slate-400 text-sm">Waiting for participant</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-white border-l border-slate-300 flex flex-col min-h-0">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Chat</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <MessageCircle className="h-4 w-4" />
                <span>{chatMessages.length}</span>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </button>
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
