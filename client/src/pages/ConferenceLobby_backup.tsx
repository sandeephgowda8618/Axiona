import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Users, Lock, Lightbulb, Save, FileText } from 'lucide-react';
import { meetingsAPI } from '../services/meetingsAPI';
import { auth } from '../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const ConferenceLobby: React.FC = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [createRoomPassword, setCreateRoomPassword] = useState('');
  const [createRoomTitle, setCreateRoomTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    if (!user) {
      setError('Please log in to create a meeting');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await meetingsAPI.createMeeting({
        title: createRoomTitle || 'Study Session',
        description: 'Video conference study session',
        roomPassword: createRoomPassword || undefined,
        createdBy: user.uid
      });

      // Navigate to the newly created meeting
      navigate(`/conference/${response.data.meetingId}`, {
        state: { meeting: response.data }
      });
    } catch (err) {
      setError('Failed to create meeting. Please try again.');
      console.error('Create meeting error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    if (!user) {
      setError('Please log in to join a meeting');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      // Get meeting info first to check if password is required
      const response = await meetingsAPI.getMeetingInfo(roomId);
      const meetingInfo = response.data;
      
      if (meetingInfo.requiresPassword && !password) {
        setError('This meeting requires a password');
        setIsJoining(false);
        return;
      }

      if (meetingInfo.isFull) {
        setError('This meeting is full (maximum 6 participants)');
        setIsJoining(false);
        return;
      }

      // Navigate to meeting - the MeetingRoom component will handle joining
      navigate(`/conference/${roomId}`, {
        state: { password, requiresPassword: meetingInfo.requiresPassword }
      });
    } catch (err) {
      setError('Meeting not found or invalid room ID');
      console.error('Join meeting error:', err);
    } finally {
      setIsJoining(false);
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Title</label>
                <input
                  type="text"
                  value={createRoomTitle}
                  onChange={(e) => setCreateRoomTitle(e.target.value)}
                  placeholder="Enter meeting title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Give your meeting a descriptive title</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password (Optional)</label>
                <input
                  type="password"
                  value={createRoomPassword}
                  onChange={(e) => setCreateRoomPassword(e.target.value)}
                  placeholder="Set a password to secure your room"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for public rooms</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleCreateRoom}
                disabled={isCreating || !user}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Room
                  </>
                )}
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
                  placeholder="Enter Room ID (e.g., abc123def456)"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password (if required)</label>
                <input
                  type="password"
                  placeholder="Enter room password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleJoinRoom}
                disabled={isJoining || !user || !roomId.trim()}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isJoining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Join Room
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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
