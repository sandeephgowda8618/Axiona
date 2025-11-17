import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useProgress } from '../contexts/ProgressContext'
import './VerticalProgressStepper.css'

interface WeekCardData {
  week: number
  phase: string
  studyHours: number
  projectHours: number
  activities: string[]
  materials: {
    videos: number
    pdfs: number
    references: number
    slides: number
  }
}

interface VerticalProgressStepperProps {
  weekData: WeekCardData[]
  onWeekClick?: (weekNumber: number) => void
}

const VerticalProgressStepper: React.FC<VerticalProgressStepperProps> = ({ 
  weekData, 
  onWeekClick 
}) => {
  const { weekProgress, currentWeek, getWeekProgress, isWeekCompleted } = useProgress()

  const getWeekStatus = (weekNumber: number) => {
    const progress = getWeekProgress(weekNumber)
    
    if (!progress) return 'locked'
    
    if (progress.isCompleted) return 'completed'
    if (weekNumber === currentWeek) return 'active'
    if (weekNumber <= currentWeek) return 'available' // Allow access to previous weeks too
    return 'locked'
  }

  const getProgressPercentage = (weekNumber: number) => {
    const progress = getWeekProgress(weekNumber)
    return progress?.completionPercentage || 0
  }

  const handleWeekClick = (weekNumber: number, weekCard: WeekCardData) => {
    const status = getWeekStatus(weekNumber)
    
    if (status === 'locked') {
      console.log(`Week ${weekNumber} is locked, cannot access`)
      return
    }

    // Navigate to reference page with week context
    console.log(`Navigating to study materials for Week ${weekNumber}`)
    if (onWeekClick) {
      onWeekClick(weekNumber)
    }
  }

  const CheckIcon = () => (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.path
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />
    </motion.svg>
  )

  const ActiveDot = () => (
    <motion.div
      className="active-dot"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    />
  )

  return (
    <div className="vertical-progress-stepper">
      <div className="stepper-header">
        <h2>Master Web Development</h2>
        <div className="progress-info">
          <span>Web Development • 8 Weeks • 4 Phases • Intermediate</span>
        </div>
      </div>

      <div className="stepper-container">
        {weekData.map((week, index) => {
          const status = getWeekStatus(week.week)
          const progress = getProgressPercentage(week.week)
          const isConnectorActive = index < weekData.length - 1 && isWeekCompleted(week.week)

          return (
            <div key={week.week} className="step-item">
              {/* Step Indicator */}
              <div className="step-indicator-container">
                <motion.div
                  className={`step-indicator ${status}`}
                  onClick={() => handleWeekClick(week.week, week)}
                  whileTap={{ scale: status !== 'locked' ? 0.95 : 1 }}
                  style={{ cursor: status !== 'locked' ? 'pointer' : 'not-allowed' }}
                >
                  <motion.div
                    className="step-indicator-inner"
                    animate={{
                      backgroundColor: 
                        status === 'completed' ? '#3B82F6' :
                        status === 'active' ? '#6366F1' :
                        status === 'available' ? '#E5E7EB' :
                        '#F3F4F6'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {status === 'completed' && <CheckIcon />}
                    {status === 'active' && <ActiveDot />}
                    {(status === 'available' || status === 'locked') && (
                      <span className={`week-number ${status}`}>
                        {week.week}
                      </span>
                    )}
                  </motion.div>

                  {/* Progress Ring for Active Week */}
                  {status === 'active' && (
                    <motion.div
                      className="progress-ring"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <svg width="56" height="56" className="progress-circle">
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="4"
                        />
                        <motion.circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke="#6366F1"
                          strokeWidth="4"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: progress / 100 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          style={{
                            transformOrigin: "center",
                            transform: "rotate(-90deg)"
                          }}
                        />
                      </svg>
                    </motion.div>
                  )}
                </motion.div>

                {/* Connector Line */}
                {index < weekData.length - 1 && (
                  <div className="step-connector">
                    <motion.div
                      className="connector-line"
                      initial={{ height: "0%" }}
                      animate={{ 
                        height: "100%",
                        backgroundColor: isConnectorActive ? '#3B82F6' : '#E5E7EB'
                      }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                  </div>
                )}
              </div>

              {/* Step Content Card */}
              <motion.div
                className={`step-content ${status}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleWeekClick(week.week, week)
                }}
                whileTap={status !== 'locked' ? { scale: 0.98 } : {}}
                transition={{ duration: 0.2 }}
                style={{ 
                  pointerEvents: status === 'locked' ? 'none' : 'auto',
                  cursor: status === 'locked' ? 'not-allowed' : 'pointer'
                }}
              >
                <div className="card-header">
                  <div className="week-info">
                    <h3 className="week-title">Week {week.week} - {week.phase}</h3>
                    <div className="time-info">
                      <span className="time-badge">
                        📚 Study: {week.studyHours}h
                      </span>
                      <span className="time-badge">
                        🛠️ Project: {week.projectHours}h
                      </span>
                    </div>
                  </div>
                  
                  {status === 'active' && (
                    <div className="progress-badge">
                      <span className="progress-text">{Math.round(progress)}%</span>
                      <div className="progress-bar">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: "0%" }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-content">
                  <div className="activities-section">
                    <h4>Activities</h4>
                    <ul className="activities-list">
                      {week.activities.map((activity, idx) => (
                        <li key={idx} className={`activity-item ${status}`}>
                          <span className="activity-icon">•</span>
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="materials-section">
                    <h4>Materials Required</h4>
                    <div className="materials-grid">
                      <div className="material-item">
                        <span className="material-icon">📹</span>
                        <span>{week.materials.videos} Videos</span>
                      </div>
                      <div className="material-item">
                        <span className="material-icon">📄</span>
                        <span>{week.materials.pdfs} PDFs</span>
                      </div>
                      <div className="material-item">
                        <span className="material-icon">📚</span>
                        <span>{week.materials.references} References</span>
                      </div>
                      <div className="material-item">
                        <span className="material-icon">🎯</span>
                        <span>{week.materials.slides} Slides</span>
                      </div>
                    </div>
                    
                    {status === 'active' && (
                      <motion.div
                        className="completion-tracker"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <p className="tracker-text">
                          Complete {Math.max(0, (getWeekProgress(week.week)?.requiredMaterials || 0) - (getWeekProgress(week.week)?.completedMaterials.length || 0))} more materials to advance
                        </p>
                        <button 
                          className="start-week-btn"
                          onClick={() => onWeekClick?.(week.week)}
                        >
                          Start Week {week.week}
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )
        })}
      </div>

      {/* Overall Progress Summary */}
      <motion.div
        className="progress-summary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3>Overall Progress</h3>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-value">{weekProgress.filter(w => w.isCompleted).length}</span>
            <span className="stat-label">Weeks Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{currentWeek}</span>
            <span className="stat-label">Current Week</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {weekProgress.reduce((sum, w) => sum + w.completedMaterials.length, 0)}
            </span>
            <span className="stat-label">Materials Completed</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default VerticalProgressStepper
