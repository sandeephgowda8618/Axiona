import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import LandingPage from '../pages/LandingPage'
import TestLanding from '../pages/TestLanding'
import AuthPage from '../pages/AuthPage'
import ProfileDashboard from '../pages/ProfileDashboard'
import ConferenceLobby from '../pages/ConferenceLobby'
import ConferenceMeeting from '../pages/ConferenceMeeting'
import QuizSelection from '../pages/QuizSelection'
import QuizExam from '../pages/QuizExam'
import QuizExamSecure from '../pages/QuizExamSecure'
import QuizResults from '../pages/QuizResults'
import SettingsPage from '../pages/SettingsPage'
import MyRack from '../pages/MyRack'
import StudyBuddy from '../pages/StudyBuddy'
import StudyMaterialsPES from '../pages/StudyMaterialsPES'
import Library from '../pages/Library'
import TutorialHub from '../pages/TutorialHub'
import VideoPlayer from '../pages/VideoPlayer'
import Workspace from '../pages/Workspace'
import AdminConsole from '../pages/AdminConsole'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import NotFoundPage from '../pages/NotFoundPage'

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes - No Navigation */}
  <Route path="/" element={<LandingPage />} />
  <Route path="/landing" element={<TestLanding />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      {/* Protected Routes - With Navigation */}
      <Route path="/dashboard" element={<Layout><ProfileDashboard /></Layout>} />
      <Route path="/profile" element={<Layout><ProfileDashboard /></Layout>} />
      
      {/* Conference Routes */}
      <Route path="/conference" element={<Layout><ConferenceLobby /></Layout>} />
      <Route path="/conference/:roomId" element={<Layout><ConferenceMeeting /></Layout>} />
      
      {/* Quiz Routes */}
      <Route path="/quiz" element={<Layout><QuizSelection /></Layout>} />
      <Route path="/quiz/:quizId" element={<Layout><QuizExam /></Layout>} />
      <Route path="/quiz/:quizId/secure" element={<Layout><QuizExamSecure /></Layout>} />
      <Route path="/quiz/:quizId/results" element={<Layout><QuizResults /></Layout>} />
      
      {/* Study Material Routes */}
      <Route path="/my-rack" element={<Layout><MyRack /></Layout>} />
      <Route path="/study-materials" element={<Layout><StudyMaterialsPES /></Layout>} />
      <Route path="/library" element={<Layout><Library /></Layout>} />
      <Route path="/tutorial-hub" element={<Layout><TutorialHub /></Layout>} />
      <Route path="/tutorial-player/:tutorialId" element={<Layout><VideoPlayer /></Layout>} />
      <Route path="/video/:id" element={<Layout><VideoPlayer /></Layout>} />
      
      {/* AI Assistant */}
      <Route path="/study-buddy" element={<Layout><StudyBuddy /></Layout>} />
      
      {/* Workspace */}
      <Route path="/workspace" element={<Layout><Workspace /></Layout>} />
      
      {/* Settings */}
      <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
      
      {/* Admin Routes */}
      <Route path="/admin/*" element={<Layout><AdminConsole /></Layout>} />
      
      {/* 404 Page */}
      <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
    </Routes>
  )
}

export default AppRoutes
