import React from 'react'
import Navigation from './Navigation'

interface LayoutProps {
  children: React.ReactNode
  className?: string
  showNavigation?: boolean
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  className = "min-h-screen dashboard-bg", 
  showNavigation = false 
}) => {
  return (
    <div className={className}>
      {showNavigation && <Navigation />}
      <main className={showNavigation ? 'pt-16' : ''}>
        {children}
      </main>
    </div>
  )
}

export default Layout
