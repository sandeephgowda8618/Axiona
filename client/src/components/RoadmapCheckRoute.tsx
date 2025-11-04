import React from 'react'
import { useAuth } from '../contexts/AuthContext'
// @ts-ignore - JSX file import
import SimpleRoadmapWizard from './SimpleRoadmapWizard'

interface RoadmapCheckRouteProps {
  children: React.ReactNode
}

/**
 * Component that checks if the user has completed their roadmap.
 * If not, it shows the SimpleRoadmapWizard.
 * If yes, it renders the children.
 */
const RoadmapCheckRoute: React.FC<RoadmapCheckRouteProps> = ({ children }) => {
  const { user, updateRoadmapCompleted } = useAuth()

  // If user hasn't completed roadmap, show the wizard
  if (user && !user.roadmapCompleted) {
    return (
      <SimpleRoadmapWizard
        userId={user.id}
        onRoadmapGenerated={() => updateRoadmapCompleted(true)}
        onSkip={() => updateRoadmapCompleted(true)} // Allow users to skip for now
      />
    )
  }

  // User has completed roadmap, render children
  return <>{children}</>
}

export default RoadmapCheckRoute
