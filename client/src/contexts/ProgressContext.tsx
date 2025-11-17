import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

interface MaterialActivity {
  type: 'pdf' | 'reference' | 'video' | 'slide'
  id: string
  title: string
  timestamp: number
  duration?: number // for videos
  pages?: number // for PDFs
}

interface WeekProgress {
  weekNumber: number
  requiredMaterials: number
  completedMaterials: MaterialActivity[]
  isCompleted: boolean
  completionPercentage: number
}

interface ProgressContextType {
  weekProgress: WeekProgress[]
  currentWeek: number
  totalWeeks: number
  trackMaterialActivity: (activity: MaterialActivity, weekNumber: number) => void
  trackWorkspaceOpen: (materialId: string, materialTitle: string, materialType: 'pdf' | 'reference' | 'video' | 'slide') => void
  getWeekProgress: (weekNumber: number) => WeekProgress | undefined
  isWeekCompleted: (weekNumber: number) => boolean
  getOverallProgress: () => number
  initializeWeeks: (totalWeeks: number) => void
  updateWeekMaterialRequirement: (weekNumber: number, totalMaterials: number) => void
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

export const useProgress = () => {
  const context = useContext(ProgressContext)
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return context
}

interface ProgressProviderProps {
  children: React.ReactNode
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [weekProgress, setWeekProgress] = useState<WeekProgress[]>([])
  const [currentWeek, setCurrentWeek] = useState(1)
  const [totalWeeks, setTotalWeeks] = useState(8) // Default to 8 weeks

  // Load progress from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedProgress = localStorage.getItem(`progress_${user.id}`)
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress)
          setWeekProgress(parsed.weekProgress || [])
          setCurrentWeek(parsed.currentWeek || 1)
          setTotalWeeks(parsed.totalWeeks || 8)
        } catch (error) {
          console.error('Failed to parse saved progress:', error)
          initializeWeeks(8)
        }
      } else {
        initializeWeeks(8)
      }
    }
  }, [user])

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (user && weekProgress.length > 0) {
      localStorage.setItem(`progress_${user.id}`, JSON.stringify({
        weekProgress,
        currentWeek,
        totalWeeks
      }))
    }
  }, [weekProgress, currentWeek, totalWeeks, user])

  const initializeWeeks = (weeks: number) => {
    const initialProgress: WeekProgress[] = Array.from({ length: weeks }, (_, index) => ({
      weekNumber: index + 1,
      requiredMaterials: 0, // Will be set dynamically when week data is available
      completedMaterials: [],
      isCompleted: false,
      completionPercentage: 0
    }))
    setWeekProgress(initialProgress)
    setTotalWeeks(weeks)
    setCurrentWeek(1)
  }

  const updateWeekMaterialRequirement = (weekNumber: number, totalMaterials: number) => {
    setWeekProgress(prevProgress => {
      const updatedProgress = [...prevProgress]
      const weekIndex = updatedProgress.findIndex(w => w.weekNumber === weekNumber)
      
      if (weekIndex !== -1) {
        updatedProgress[weekIndex].requiredMaterials = totalMaterials
        // Recalculate completion percentage
        const week = updatedProgress[weekIndex]
        week.completionPercentage = totalMaterials > 0 
          ? Math.min((week.completedMaterials.length / totalMaterials) * 100, 100)
          : 0
        week.isCompleted = week.completedMaterials.length >= totalMaterials && totalMaterials > 0
      }
      
      return updatedProgress
    })
  }

  const trackMaterialActivity = (activity: MaterialActivity, weekNumber: number) => {
    setWeekProgress(prevProgress => {
      const updatedProgress = [...prevProgress]
      const weekIndex = updatedProgress.findIndex(w => w.weekNumber === weekNumber)
      
      if (weekIndex !== -1) {
        const week = updatedProgress[weekIndex]
        
        // Check if this material was already tracked (prevent duplicates)
        const existingActivity = week.completedMaterials.find(m => m.id === activity.id)
        if (!existingActivity) {
          week.completedMaterials.push(activity)
          
          // Only calculate percentage and completion if requiredMaterials is set
          if (week.requiredMaterials > 0) {
            week.completionPercentage = Math.min((week.completedMaterials.length / week.requiredMaterials) * 100, 100)
            week.isCompleted = week.completedMaterials.length >= week.requiredMaterials

            // If week is completed and it's the current week, advance to next week
            if (week.isCompleted && weekNumber === currentWeek && currentWeek < totalWeeks) {
              setCurrentWeek(prev => prev + 1)
            }
          }
        }
      }
      
      return updatedProgress
    })
  }

  // Track when workspace is opened with a material (main tracking function)
  const trackWorkspaceOpen = (materialId: string, materialTitle: string, materialType: 'pdf' | 'reference' | 'video' | 'slide') => {
    const activity: MaterialActivity = {
      type: materialType,
      id: materialId,
      title: materialTitle,
      timestamp: Date.now()
    }

    console.log(`🚀 Workspace opened with: ${materialTitle} (${materialType}) for Week ${currentWeek}`)
    
    // Track this as material activity for the current week
    trackMaterialActivity(activity, currentWeek)
    
    // Show progress notification
    const weekProgress = getWeekProgress(currentWeek)
    if (weekProgress) {
      const completed = weekProgress.completedMaterials.length
      const required = weekProgress.requiredMaterials
      console.log(`📊 Progress: ${completed}/${required} materials completed for Week ${currentWeek}`)
      
      if (weekProgress.isCompleted) {
        console.log(`🎉 Week ${currentWeek} completed! Next week unlocked.`)
      }
    }
  }

  const getWeekProgress = (weekNumber: number): WeekProgress | undefined => {
    return weekProgress.find(w => w.weekNumber === weekNumber)
  }

  const isWeekCompleted = (weekNumber: number): boolean => {
    const week = getWeekProgress(weekNumber)
    return week?.isCompleted || false
  }

  const getOverallProgress = (): number => {
    if (weekProgress.length === 0) return 0
    const totalCompleted = weekProgress.reduce((sum, week) => sum + week.completionPercentage, 0)
    return totalCompleted / weekProgress.length
  }

  const value: ProgressContextType = {
    weekProgress,
    currentWeek,
    totalWeeks,
    trackMaterialActivity,
    trackWorkspaceOpen,
    getWeekProgress,
    isWeekCompleted,
    getOverallProgress,
    initializeWeeks,
    updateWeekMaterialRequirement
  }

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}
