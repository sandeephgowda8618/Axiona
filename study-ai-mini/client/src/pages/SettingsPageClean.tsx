import React, { useState } from 'react'
import { Link } from 'react-router-dom'

interface SettingsState {
  // Account settings
  currentPassword: string
  newPassword: string
  confirmPassword: string
  
  // General settings
  theme: 'light' | 'dark'
  language: string
  
  // Notification settings
  emailNotifications: boolean
  pushNotifications: boolean
  studyReminderEnabled: boolean
  studyReminderTime: string
  studyReminderFrequency: string
  
  // Security settings
  twoFactorEnabled: boolean
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    theme: 'light',
    language: 'English',
    emailNotifications: true,
    pushNotifications: false,
    studyReminderEnabled: true,
    studyReminderTime: '09:00',
    studyReminderFrequency: 'Daily',
    twoFactorEnabled: false
  })

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: keyof SettingsState, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordUpdate = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      alert('New passwords do not match')
      return
    }
    
    if (settings.newPassword.length < 8) {
      alert('Password must be at least 8 characters long')
      return
    }

    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      alert('Password updated successfully')
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    }, 1000)
  }

  const handleDeleteAccount = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      alert('Account deletion initiated. You will receive a confirmation email.')
      setShowDeleteConfirm(false)
    }, 1000)
  }

  const handleExportData = () => {
    // Create mock data for export
    const userData = {
      profile: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        joinDate: '2024-01-15'
      },
      quizAttempts: [],
      studyProgress: {},
      settings: settings
    }

    const dataStr = JSON.stringify(userData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'study-ai-data.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleSaveChanges = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      alert('Settings saved successfully')
    }, 1000)
  }

  const activeSessions = [
    {
      id: 1,
      device: 'Desktop - Chrome',
      location: 'Current session',
      lastActive: 'Last active now',
      isCurrent: true
    },
    {
      id: 2,
      device: 'iPhone - Safari',
      location: 'Last active 2 hours ago',
      lastActive: '',
      isCurrent: false
    },
    {
      id: 3,
      device: 'MacBook - Firefox',
      location: 'Last active yesterday',
      lastActive: '',
      isCurrent: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Study-AI Mini</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link to="/quiz" className="text-gray-600 hover:text-gray-900">Quizzes</Link>
              <Link to="/profile" className="text-gray-600 hover:text-gray-900">Profile</Link>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600">👤</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your account preferences and security settings</p>
        </div>

        <div className="space-y-8">
          {/* Account Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-6">Account</h2>
            
            {/* Profile Info */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900">John Doe</h3>
                <p className="text-sm text-gray-500">john.doe@example.com</p>
              </div>
            </div>

            {/* Change Password */}
            <div className="space-y-4">
              <h3 className="text-base font-medium text-gray-900">Change Password</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={settings.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={settings.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={settings.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={handlePasswordUpdate}
                disabled={isLoading || !settings.currentPassword || !settings.newPassword || !settings.confirmPassword}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>

            {/* Delete Account */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-base font-medium text-gray-900 mb-2">Delete Account</h3>
              <p className="text-sm text-gray-500 mb-4">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
              >
                Delete Account
              </button>
            </div>
          </div>

          {/* General Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-6">General</h2>
            
            <div className="space-y-6">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Theme</h3>
                  <p className="text-xs text-gray-500">Choose your preferred theme</p>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center text-sm">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={settings.theme === 'light'}
                      onChange={(e) => handleInputChange('theme', e.target.value)}
                      className="mr-2 text-blue-600"
                    />
                    Light
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={settings.theme === 'dark'}
                      onChange={(e) => handleInputChange('theme', e.target.value)}
                      className="mr-2 text-blue-600"
                    />
                    Dark
                  </label>
                </div>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Language</h3>
                  <p className="text-xs text-gray-500">Select your preferred language</p>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Chinese">Chinese</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-6">Notifications</h2>
            
            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-xs text-gray-500">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                  <p className="text-xs text-gray-500">Receive push notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => handleInputChange('pushNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Study Reminder Schedule */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Study Reminder Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={settings.studyReminderTime}
                      onChange={(e) => handleInputChange('studyReminderTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Frequency</label>
                    <select
                      value={settings.studyReminderFrequency}
                      onChange={(e) => handleInputChange('studyReminderFrequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Weekdays">Weekdays</option>
                      <option value="Weekends">Weekends</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-6">Privacy</h2>
            
            <div className="space-y-6">
              {/* Export Data */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Export Data</h3>
                  <p className="text-xs text-gray-500">Download all your data in JSON format</p>
                </div>
                <button
                  onClick={handleExportData}
                  className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-900 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export JSON</span>
                </button>
              </div>

              {/* Delete All Data */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Delete All Data</h3>
                  <p className="text-xs text-gray-500">Permanently delete all your study data and progress</p>
                </div>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700">
                  Delete All Data
                </button>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-6">Security</h2>
            
            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorEnabled}
                    onChange={(e) => handleInputChange('twoFactorEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Active Sessions */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-400">
                          {session.device.includes('Desktop') ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          ) : session.device.includes('iPhone') ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM21 17a2 2 0 11-4 0 2 2 0 014 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17h4m4 0h2m-6 0v1a3 3 0 11-6 0v-1m6 0V9a5 5 0 10-10 0v8a2 2 0 002 2h8a2 2 0 002-2z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{session.device}</p>
                          <p className="text-xs text-gray-500">
                            {session.location} {session.lastActive}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {session.isCurrent ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            Current
                          </span>
                        ) : (
                          <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Save Changes Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSaveChanges}
              disabled={isLoading}
              className="bg-gray-800 text-white px-6 py-2 rounded-md text-sm hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Delete Account</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
