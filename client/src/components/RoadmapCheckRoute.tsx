import React from 'react'
import { useAuth } from '../contexts/AuthContext'
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
        onComplete={(roadmapData: any) => {
          console.log('✅ Roadmap completed in RoadmapCheckRoute:', roadmapData);
          updateRoadmapCompleted(true);
        }}
        onCancel={() => updateRoadmapCompleted(true)} // Allow users to skip for now
      />
    )
  }

  // User has completed roadmap, render children
  return <>{children}</>
}

export default RoadmapCheckRoute
