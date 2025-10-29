import React from 'react'
import LandingNavigation from './LandingNavigation'

interface LayoutProps {
  children: React.ReactNode
  className?: string
  showNavigation?: boolean
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  className = "min-h-screen", 
  showNavigation = true 
}) => {
  return (
    <div className={className}>
      {showNavigation && <LandingNavigation />}
      <main className={showNavigation ? 'pt-4' : ''}>
        {children}
      </main>
    </div>
  )
}

export default Layout
