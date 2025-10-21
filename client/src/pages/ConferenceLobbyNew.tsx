import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Copy, Lock, Users, Clock, Shield } from 'lucide-react';

const ConferenceLobbyNew: React.FC = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('STUDY-AI-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'));
  const [password, setPassword] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    // You could add a toast notification here
  };

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      // TODO: Connect to backend API
      // await conferenceAPI.createRoom({ roomId, password });
      
      // For now, navigate directly to conference
      navigate(`/conference/${roomId}`, { 
        state: { isHost: true, password } 
      });
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) return;
    
    setIsJoining(true);
    try {
      // TODO: Connect to backend API
      // await conferenceAPI.joinRoom({ roomId: joinRoomId, password: joinPassword });
      
      // For now, navigate directly to conference
      navigate(`/conference/${joinRoomId}`, { 
        state: { isHost: false, password: joinPassword } 
      });
    } catch (error) {
      console.error('Failed to join room:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const generateNewRoomId = () => {
    setRoomId('STUDY-AI-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <span className="text-lg font-bold text-gray-900">StudySpace</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={() => navigate('/')} className="text-sm text-gray-700 hover:text-indigo-600 transition-colors">
                Home
              </button>
              <button onClick={() => navigate('/workspace')} className="text-sm text-gray-700 hover:text-indigo-600 transition-colors">
                Workspace
              </button>
              <button onClick={() => navigate('/profile')} className="text-sm text-gray-700 hover:text-indigo-600 transition-colors">
                Profile
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Conference Lobby</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose how you want to join your study session. Create a new room or join an existing one.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Create Room */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Room</h2>
              <p className="text-gray-600">
                Start a new study session and invite others to join
              </p>
            </div>

            <div className="space-y-4">
              {/* Room ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room ID
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={roomId}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-900 font-mono text-sm"
                  />
                  <button
                    onClick={copyRoomId}
                    className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300 transition-colors"
                    title="Copy Room ID"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Room ID generated automatically
                </p>
                <button
                  onClick={generateNewRoomId}
                  className="text-xs text-indigo-600 hover:text-indigo-700 mt-1"
                >
                  Generate new ID
                </button>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password (Optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter room password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add password for private sessions
                </p>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 px-4 rounded-md font-medium transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create & Enter Room'}
              </button>
            </div>
          </div>

          {/* Join Room */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Join Room</h2>
              <p className="text-gray-600">
                Enter an existing study session with Room ID
              </p>
            </div>

            <div className="space-y-4">
              {/* Room ID Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  placeholder="STUDY-AI-XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get Room ID from the room creator
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Enter room password if required"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for password-protected rooms
                </p>
              </div>

              {/* Join Button */}
              <button
                onClick={handleJoinRoom}
                disabled={!joinRoomId.trim() || isJoining}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-md font-medium transition-colors"
              >
                {isJoining ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Tips Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Quick Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-700">
                Share your Room ID with study partners
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm text-gray-700">
                Up to 200 participants supported
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-sm text-gray-700">
                Use passwords for private sessions
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-700">
                Sessions auto-save your progress
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Workspace Button */}
      <button
        onClick={() => navigate('/workspace')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 hover:scale-110 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center"
        title="Open Workspace"
        style={{ boxShadow: '0 8px 32px rgba(79, 70, 229, 0.3)' }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </button>
    </div>
  );
};

export default ConferenceLobbyNew;