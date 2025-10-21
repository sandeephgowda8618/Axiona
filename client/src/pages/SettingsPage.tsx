import React, { useState } from 'react'
import '../styles/settings.css'
import { Monitor, Smartphone, Laptop, Download, Trash2, Shield, Bell, Globe, User, ChevronDown } from 'lucide-react'

interface UserProfile {
  name: string
  email: string
  avatar?: string
}

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

interface ActiveSession {
  id: number
  device: string
  platform: string
  lastActive: string
  isCurrent: boolean
  icon: React.ReactNode
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

  const [userProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'john.doe@example.com'
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
    setTimeout(() => {
      setIsLoading(false)
      alert('Account deletion initiated. You will receive a confirmation email.')
      setShowDeleteConfirm(false)
    }, 1000)
  }

  const handleDeleteAllData = async () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      alert('All study data and progress has been permanently deleted.')
    }, 1000)
  }

  const handleExportData = () => {
    const userData = {
      profile: userProfile,
      settings: settings,
      studyProgress: {},
      exportDate: new Date().toISOString()
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

  const handleRevokeSession = (sessionId: number) => {
    alert(`Session ${sessionId} has been revoked`)
  }

  const handleSaveChanges = async () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      alert('Settings saved successfully')
    }, 1000)
  }

  const activeSessions: ActiveSession[] = [
    {
      id: 1,
      device: 'Desktop',
      platform: 'Chrome',
      lastActive: 'Current session • Last active now',
      isCurrent: true,
      icon: <Monitor className="h-5 w-5" />
    },
    {
      id: 2,
      device: 'iPhone',
      platform: 'Safari',
      lastActive: 'Last active 2 hours ago',
      isCurrent: false,
      icon: <Smartphone className="h-5 w-5" />
    },
    {
      id: 3,
      device: 'MacBook',
      platform: 'Firefox',
      lastActive: 'Last active yesterday',
      isCurrent: false,
      icon: <Laptop className="h-5 w-5" />
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="settings-container">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account preferences and security settings</p>
        </div>

        <div className="space-y-8">
          {/* Account Section */}
          <div className="settings-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Account</h2>
            
            {/* Profile Info */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{userProfile.name}</h3>
                <p className="text-sm text-gray-500">{userProfile.email}</p>
              </div>
            </div>

            {/* Change Password */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Change Password</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={settings.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              <button
                onClick={handlePasswordUpdate}
                disabled={isLoading || !settings.currentPassword || !settings.newPassword || !settings.confirmPassword}
                className="btn-primary-action"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>

            {/* Delete Account */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Delete Account</h3>
              <p className="text-sm text-gray-500 mb-4">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-danger"
              >
                Delete Account
              </button>
            </div>
          </div>

          {/* General Section */}
          <div className="settings-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">General</h2>
            
            <div className="space-y-6">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Theme</h3>
                  <p className="text-sm text-gray-500">Choose your preferred theme</p>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleInputChange('theme', 'light')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      settings.theme === 'light' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => handleInputChange('theme', 'dark')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      settings.theme === 'dark' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Language</h3>
                  <p className="text-sm text-gray-500">Select your preferred language</p>
                </div>
                <div className="relative">
                  <select
                    value={settings.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Español</option>
                    <option value="French">Français</option>
                    <option value="German">Deutsch</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="settings-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Notifications</h2>
            
            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Push Notifications</h3>
                  <p className="text-sm text-gray-500">Receive push notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => handleInputChange('pushNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Study Reminder Schedule */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Study Reminder Schedule</h3>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={settings.studyReminderTime}
                      onChange={(e) => handleInputChange('studyReminderTime', e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={settings.studyReminderFrequency}
                      onChange={(e) => handleInputChange('studyReminderFrequency', e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Weekdays">Weekdays</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="settings-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Privacy</h2>
            
            <div className="space-y-6">
              {/* Export Data */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Export Data</h3>
                  <p className="text-sm text-gray-500">Download all your data in JSON format</p>
                </div>
                <button
                  onClick={handleExportData}
                  className="inline-flex items-center px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-md hover:bg-slate-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </button>
              </div>

              {/* Delete All Data */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Delete All Data</h3>
                  <p className="text-sm text-gray-500">Permanently delete all your study data and progress</p>
                </div>
                <button
                  onClick={handleDeleteAllData}
                  className="inline-flex items-center px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-md hover:bg-slate-700"
                >
                  Delete All Data
                </button>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="settings-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Security</h2>
            
            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorEnabled}
                    onChange={(e) => handleInputChange('twoFactorEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Active Sessions */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-400">
                          {session.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{session.device} - {session.platform}</p>
                          <p className="text-sm text-gray-500">{session.lastActive}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {session.isCurrent ? (
                          <span className="text-sm text-green-600 font-medium">Current</span>
                        ) : (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="text-sm text-gray-600 hover:text-red-600"
                          >
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
          <div className="flex justify-end">
            <button
              onClick={handleSaveChanges}
              disabled={isLoading}
              className="btn-primary-action px-6 py-3"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Account Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPage
