import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Users, Lock, Copy, MessageCircle } from 'lucide-react';

const ConferenceLobby: React.FC = () => {
  const navigate = useNavigate();
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [createRoomPassword, setCreateRoomPassword] = useState('');

  // Generate random room ID
  const generateRoomId = () => {
    return `STUDY-AI-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const [generatedRoomId] = useState(generateRoomId());

  const handleCreateRoom = () => {
    // Navigate to conference meeting with generated room ID
    navigate(`/conference/${generatedRoomId}${createRoomPassword ? `?password=${createRoomPassword}` : ''}`);
  };

  const handleJoinRoom = () => {
    if (joinRoomId.trim()) {
      navigate(`/conference/${joinRoomId}${joinPassword ? `?password=${joinPassword}` : ''}`);
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(generatedRoomId);
    alert('Room ID copied to clipboard!');
  };

  const openWorkspace = () => {
    // This would open the workspace in a new window/tab
    window.open('/workspace', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Study-AI</h1>
              </div>
              <nav className="hidden md:ml-10 flex space-x-8">
                <a href="/tutorial-hub" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Tutorial Hub
                </a>
                <a href="/study-pes" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  StudyPES
                </a>
                <a href="/conference" className="text-gray-900 border-b-2 border-blue-500 px-3 py-2 text-sm font-medium">
                  Conference
                </a>
                <a href="/my-rack" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  My Rack
                </a>
                <a href="/profile" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Profile
                </a>
              </nav>
            </div>
            <div>
              <button className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Conference Lobby</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose how you want to join your study session. Create a new room or join an existing one.
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          {/* Create Room */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Create Room</h2>
              <p className="text-gray-600 text-sm">
                Start a new study session and invite others to join
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room ID</label>
                <div className="flex">
                  <input
                    type="text"
                    value={generatedRoomId}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-700 text-sm font-mono"
                  />
                  <button 
                    onClick={copyRoomId}
                    className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors border border-l-0 border-blue-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Room ID generated automatically</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Enter room password"
                  value={createRoomPassword}
                  onChange={(e) => setCreateRoomPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Add password for extra security</p>
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full bg-slate-700 text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors mt-4"
              >
                Create & Enter Room
              </button>
            </div>
          </div>

          {/* Join Room */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Join Room</h2>
              <p className="text-gray-600 text-sm">
                Enter an existing study session with Room ID
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room ID</label>
                <input
                  type="text"
                  placeholder="Enter Room ID (e.g., STUDY-AI-7834)"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Get Room ID from the room creator</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  placeholder="Enter room password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Enter password if room is protected</p>
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={!joinRoomId.trim()}
                className="w-full bg-slate-700 text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-4"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Quick Tips</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Share your Room ID with study partners</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Up to 200 participants supported</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Lock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Use passwords for private sessions</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="h-4 w-4 bg-orange-600 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Sessions auto-save your progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Workspace */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={openWorkspace}
          className="bg-slate-700 text-white p-4 rounded-full shadow-lg hover:bg-slate-800 transition-colors group"
          title="Open Workspace"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Open Workspace
          </span>
        </button>
      </div>
    </div>
  );
};

export default ConferenceLobby;
