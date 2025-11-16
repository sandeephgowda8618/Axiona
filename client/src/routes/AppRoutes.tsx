import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ProtectedRoute from '../components/ProtectedRoute'
import RoadmapCheckRoute from '../components/RoadmapCheckRoute'
import LandingPage from '../pages/LandingPage'
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
import StudyPESSubjectViewer from '../pages/StudyPESSubjectViewer'
import PDFViewer from '../pages/PDFViewer'
import SubjectViewer from '../pages/SubjectViewer'
import Library from '../pages/Library'
import BookReader from '../pages/BookReader'
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      {/* Protected Routes - With Navigation AND Roadmap Check */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <LandingPage />
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><ProfileDashboard /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      
      {/* Conference Routes */}
      <Route path="/conference" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><ConferenceLobby /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      <Route path="/conference/:roomId" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><ConferenceMeeting /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      
      {/* Quiz Routes */}
      <Route path="/quiz" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><QuizSelection /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      <Route path="/quiz/:quizId" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><QuizExam /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      <Route path="/quiz/:quizId/secure" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><QuizExamSecure /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      <Route path="/quiz/:quizId/results" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><QuizResults /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      
      {/* Study Material Routes */}
      <Route path="/my-rack" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><MyRack /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      <Route path="/study-materials" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><StudyMaterialsPES /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      <Route path="/studypes/:subjectName" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><StudyPESSubjectViewer /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      <Route path="/subject/:domain" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><SubjectViewer /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      <Route path="/pdf/:pdfId" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><PDFViewer /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      <Route path="/library" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><Library /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      <Route path="/library/reader/:bookId" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <BookReader />
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      <Route path="/tutorial-hub" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><TutorialHub /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      <Route path="/tutorial-player/:tutorialId" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><VideoPlayer /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      <Route path="/video/:id" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><VideoPlayer /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      
      {/* AI Assistant */}
      <Route path="/study-buddy" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><StudyBuddy /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      
      {/* Workspace */}
      <Route path="/workspace" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><Workspace /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      
      {/* Settings */}
      <Route path="/settings" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><SettingsPage /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute>
          <RoadmapCheckRoute>
            <Layout><AdminConsole /></Layout>
          </RoadmapCheckRoute>
        </ProtectedRoute>
      } />
      
      {/* 404 Page */}
      <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
    </Routes>
  )
}

export default AppRoutes
