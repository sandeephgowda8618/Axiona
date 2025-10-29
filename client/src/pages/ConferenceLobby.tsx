import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Users, Lock, Lightbulb, Save, FileText } from 'lucide-react';

const ConferenceLobby: React.FC = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [createRoomPassword, setCreateRoomPassword] = useState('');

  // Generate random room ID
  const generateRoomId = () => {
    return `STUDY-AI-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const [generatedRoomId] = useState(generateRoomId());
  const [createRoomId, setCreateRoomId] = useState(generatedRoomId);

  const handleCreateRoom = () => {
    // Navigate to conference meeting with the current room ID
    navigate(`/conference/${createRoomId}${createRoomPassword ? `?password=${createRoomPassword}` : ''}`);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      navigate(`/conference/${roomId}${password ? `?password=${password}` : ''}`);
    }
  };

  const openWorkspace = () => {
    // This would open the workspace in a new window/tab
    window.open('/workspace', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Conference Lobby</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose how you want to join your study session. Create a new room or join an existing one.
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Create Room */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Room</h2>
              <p className="text-gray-600">Start a new study session and invite others to join</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room ID</label>
                <div className="flex">
                  <input
                    type="text"
                    value={createRoomId}
                    onChange={(e) => setCreateRoomId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-white text-gray-900 focus:outline-none"
                  />
                  <button className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300 transition-colors">
                    <FileText className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Room ID generated automatically — you can edit it before creating</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Enter room password"
                  value={createRoomPassword}
                  onChange={(e) => setCreateRoomPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Add password for extra security</p>
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full bg-gray-900 text-white py-3 px-4 rounded-md font-medium hover:bg-gray-800 transition-colors"
              >
                Create & Enter Room
              </button>
            </div>
          </div>

          {/* Join Room */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Room</h2>
              <p className="text-gray-600">Enter an existing study session with Room ID</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room ID</label>
                <input
                  type="text"
                  placeholder="Enter Room ID (e.g., STUDY-AI-7B34)"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Get Room ID from the room creator</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  placeholder="Enter room password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Enter password if room is protected</p>
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={!roomId.trim()}
                className="w-full bg-gray-900 text-white py-3 px-4 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Quick Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Share your Room ID with study partners</h4>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Lock className="w-5 h-5 text-green-600 mt-0.5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Use passwords for private sessions</h4>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Users className="w-5 h-5 text-purple-600 mt-0.5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Up to 200 participants supported</h4>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Sessions auto-save your progress</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Open Workspace Button */}
        <button
          onClick={openWorkspace}
          className="fixed bottom-6 right-6 bg-gray-900 text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-colors z-50 flex items-center space-x-2"
        >
          <Save className="w-5 h-5" />
          <span className="text-sm font-medium">Open Workspace</span>
        </button>
      </main>
    </div>
  );
};

export default ConferenceLobby;
