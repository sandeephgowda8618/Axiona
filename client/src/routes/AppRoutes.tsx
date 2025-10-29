import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ProtectedRoute from '../components/ProtectedRoute'
import LandingPage from '../pages/LandingPage'
import TestLanding from '../pages/TestLanding'
import LoginPage from '../pages/LoginPage'
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
import PDFViewer from '../pages/PDFViewer'
import SubjectViewer from '../pages/SubjectViewer'
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      {/* Protected Routes - With Navigation */}
      <Route path="/dashboard" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><ProfileDashboard /></Layout></ProtectedRoute>} />
      
      {/* Conference Routes */}
      <Route path="/conference" element={<ProtectedRoute><Layout><ConferenceLobby /></Layout></ProtectedRoute>} />
      <Route path="/conference/:roomId" element={<ProtectedRoute><Layout><ConferenceMeeting /></Layout></ProtectedRoute>} />
      
      {/* Quiz Routes */}
      <Route path="/quiz" element={<ProtectedRoute><Layout><QuizSelection /></Layout></ProtectedRoute>} />
      <Route path="/quiz/:quizId" element={<ProtectedRoute><Layout><QuizExam /></Layout></ProtectedRoute>} />
      <Route path="/quiz/:quizId/secure" element={<ProtectedRoute><Layout><QuizExamSecure /></Layout></ProtectedRoute>} />
      <Route path="/quiz/:quizId/results" element={<ProtectedRoute><Layout><QuizResults /></Layout></ProtectedRoute>} />
      
      {/* Study Material Routes */}
      <Route path="/my-rack" element={<ProtectedRoute><Layout><MyRack /></Layout></ProtectedRoute>} />
      <Route path="/study-materials" element={<ProtectedRoute><Layout><StudyMaterialsPES /></Layout></ProtectedRoute>} />
      <Route path="/subject/:domain" element={<ProtectedRoute><Layout><SubjectViewer /></Layout></ProtectedRoute>} />
      <Route path="/pdf/:pdfId" element={<ProtectedRoute><Layout><PDFViewer /></Layout></ProtectedRoute>} />
      <Route path="/library" element={<ProtectedRoute><Layout><Library /></Layout></ProtectedRoute>} />
      <Route path="/tutorial-hub" element={<ProtectedRoute><Layout><TutorialHub /></Layout></ProtectedRoute>} />
      <Route path="/tutorial-player/:tutorialId" element={<ProtectedRoute><Layout><VideoPlayer /></Layout></ProtectedRoute>} />
      <Route path="/video/:id" element={<ProtectedRoute><Layout><VideoPlayer /></Layout></ProtectedRoute>} />
      
      {/* AI Assistant */}
      <Route path="/study-buddy" element={<ProtectedRoute><Layout><StudyBuddy /></Layout></ProtectedRoute>} />
      
      {/* Workspace */}
      <Route path="/workspace" element={<ProtectedRoute><Layout><Workspace /></Layout></ProtectedRoute>} />
      
      {/* Settings */}
      <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin/*" element={<ProtectedRoute><Layout><AdminConsole /></Layout></ProtectedRoute>} />
      
      {/* 404 Page */}
      <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
    </Routes>
  )
}

export default AppRoutes
