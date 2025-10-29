import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useAuth } from '../contexts/AuthContext'
import '../styles/landing.css'

const LandingPage: React.FC = () => {
  const { openWorkspace } = useWorkspace()
  const { user, isAuthenticated, logout } = useAuth()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)

  const handleOpenWorkspace = () => {
    openWorkspace('notes')
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Hero carousel data
  const heroSlides = [
    {
      title: isAuthenticated ? `Welcome back, ${user?.fullName || 'User'}!` : "Master Your Studies with AI",
      subtitle: isAuthenticated ? "Continue your learning journey with personalized study tools and track your progress." : "Transform your learning with intelligent study tools, real-time collaboration, and personalized progress tracking.",
      primaryButton: "Start Learning",
      secondaryButton: isAuthenticated ? "View Progress" : "Watch Demo",
      image: "/api/placeholder/540/360"
    },
    {
      title: isAuthenticated ? "Join Your Study Groups" : "Collaborate in Real-Time",
      subtitle: isAuthenticated ? "Connect with your study groups and continue collaborative learning sessions." : "Join study rooms, share screens, and learn together with peers through our integrated conference system.",
      primaryButton: "Join Conference",
      secondaryButton: "Learn More",
      image: "/api/placeholder/540/360"
    },
    {
      title: isAuthenticated ? "Your Learning Analytics" : "Track Your Progress",
      subtitle: isAuthenticated ? "Review your learning achievements and see detailed progress analytics." : "Monitor learning streaks, complete roadmaps, and export your progress with comprehensive analytics.",
      primaryButton: "View Analytics",
      secondaryButton: "See Features",
      image: "/api/placeholder/540/360"
    }
  ]

  // Feature cards data (6 cards, alternating layout)
  const featureCards = [
    {
      title: "Tutorial Hub",
      description: "Watch curated YouTube playlists & reference PDFs tailored to your learning needs. Access premium educational content organized by subject and difficulty level.",
      image: "/api/placeholder/540/220",
      link: "/tutorial-hub",
      alignment: "left"
    },
    {
      title: "StudyPES",
      description: "College notes by class/year/subject – zero spam, maximum quality content. Collaborative note-taking with highlighting and search capabilities.",
      image: "/api/placeholder/540/220",
      link: "/study-materials",
      alignment: "right"
    },
    {
      title: "Conference Rooms",
      description: "Password-protected study rooms – no install required, just join and collaborate. Screen sharing, whiteboard, and real-time chat included.",
      image: "/api/placeholder/540/220",
      link: "/conference",
      alignment: "left"
    },
    {
      title: "AI Workspace",
      description: "AI tutor + notes pad that auto-saves while you learn, keeping everything organized. Context-aware assistance for your studies.",
      image: "/api/placeholder/540/220",
      link: "/workspace",
      alignment: "right"
    },
    {
      title: "Smart Assistant",
      description: "Ask, quiz, summarise – context-aware to your page and learning progress. Generate practice questions from your study materials.",
      image: "/api/placeholder/540/220",
      link: "/study-buddy",
      alignment: "left"
    },
    {
      title: "Profile Analytics",
      description: "Track courses, streaks, roadmap – export any time and own your learning data. Comprehensive insights into your learning patterns.",
      image: "/api/placeholder/540/220",
      link: "/profile",
      alignment: "right"
    }
  ]

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroSlides.length])

  // Handle scroll for floating button animation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Dark Navigation Header */}
      <header className="app-header">
        <div className="container">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="logo">
              <div className="logo-icon">A</div>
              <span className="logo-text">Axiona</span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/tutorial-hub" className="nav-link">
                Tutorial Hub
              </Link>
              <Link to="/study-materials" className="nav-link">
                StudyPES
              </Link>
              <Link to="/conference" className="nav-link">
                Conference
              </Link>
              <Link to="/library" className="nav-link">
                Library
              </Link>
              <Link to="/my-rack" className="nav-link">
                My Rack
              </Link>
              {isAuthenticated && (
                <Link to="/dashboard" className="nav-link">
                  Profile
                </Link>
              )}
            </nav>

            {/* Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {user?.avatar && (
                      <img
                        src={user.avatar}
                        alt="Profile"
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="text-white text-sm">
                      {user?.fullName || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-300 hover:text-white text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="btn-signup">
                  Sign Up
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-white hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Sliding carousel with left-to-right transitions */}
      <section className="landing-hero">
        <div className="hero-carousel">
          <div 
            className="hero-slides"
            style={{ transform: `translateX(-${currentSlide * 33.333333}%)` }}
          >
            {heroSlides.map((slide, index) => (
              <div key={index} className="hero-slide">
                <div className="hero-content">
                  <div className="hero-text">
                    <h1>{slide.title}</h1>
                    <p className="subtitle">{slide.subtitle}</p>
                    <div className="hero-buttons">
                      {isAuthenticated ? (
                        <Link to="/dashboard" className="btn btn-primary">
                          Go to Dashboard
                        </Link>
                      ) : (
                        <Link to="/login" className="btn btn-primary">
                          {slide.primaryButton}
                        </Link>
                      )}
                      <button className="btn btn-outline-white">
                        {slide.secondaryButton}
                      </button>
                    </div>
                  </div>
                  <div className="hero-visual">
                    <div className="hero-mockup">
                      <img src={slide.image} alt={slide.title} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Navigation arrows */}
          <button 
            className="hero-nav prev"
            onClick={() => setCurrentSlide((prev) => prev === 0 ? heroSlides.length - 1 : prev - 1)}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className="hero-nav next"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Pagination dots */}
          <div className="hero-pagination">
            {heroSlides.map((_, index) => (
              <button 
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`pagination-dot ${index === currentSlide ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* User Stats Section - Only for logged-in users */}
      {isAuthenticated && (
        <section className="bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Learning Overview</h2>
              <p className="text-gray-600">Track your progress and achievements</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
                <div className="text-sm text-gray-600">Courses Completed</div>
              </div>
              <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                <div className="text-3xl font-bold text-orange-500 mb-2">45</div>
                <div className="text-sm text-gray-600">Streak Days</div>
              </div>
              <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                <div className="text-3xl font-bold text-purple-600 mb-2">234</div>
                <div className="text-sm text-gray-600">Total Notes</div>
              </div>
              <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                <div className="text-3xl font-bold text-green-600 mb-2">8.5h</div>
                <div className="text-sm text-gray-600">Weekly Activity</div>
              </div>
            </div>
            <div className="text-center mt-8">
              <Link 
                to="/my-rack" 
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View My Rack
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section - Clean white background with alternating layout */}
      <section className="features-section">
        <div className="container">
          <h2>Why Choose StudySpace?</h2>
          <p className="subtitle">
            Discover the features that make learning engaging and effective
          </p>

          {/* Feature Cards - Wireframe-based alternating layout */}
          <div>
            {featureCards.map((feature, index) => (
              <Link 
                key={index} 
                to={feature.link} 
                className={`feature-card ${
                  feature.alignment === 'right' ? 'reverse' : ''
                }`}
              >
                {/* Content */}
                <div className="content">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>

                {/* Visual mockup */}
                <div className="visual">
                  <div className={`visual-mockup ${
                    index === 0 ? 'visual-progress' :
                    index === 1 ? 'visual-tutorial' :
                    index === 2 ? 'visual-studyPES' :
                    index === 3 ? 'visual-conference' :
                    index === 4 ? 'visual-workspace' :
                    index === 5 ? 'visual-ai' :
                    'visual-profile'
                  }`}>
                    {/* Visual content will be added via CSS or icons */}
                    <div className="mockup-placeholder">
                      {feature.title}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            {/* Footer Top */}
            <div className="footer-top">
              <div className="footer-brand">
                <div className="footer-logo">
                  <div className="logo-icon">S</div>
                  <span className="logo-text">StudySpace</span>
                </div>
                <p className="footer-description">
                  Transform your learning with AI-powered study tools, real-time collaboration, and comprehensive progress tracking.
                </p>
                <div className="social-links">
                  <a href="#" className="social-link" title="GitHub">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                  <a href="#" className="social-link" title="Discord">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </a>
                  <a href="#" className="social-link" title="Twitter">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                </div>
              </div>

              <div className="footer-links">
                <div className="footer-column">
                  <h4>Platform</h4>
                  <ul>
                    <li><Link to="/tutorial-hub">Tutorial Hub</Link></li>
                    <li><Link to="/study-materials">StudyPES</Link></li>
                    <li><Link to="/conference">Conference Rooms</Link></li>
                    <li><Link to="/workspace">AI Workspace</Link></li>
                  </ul>
                </div>

                <div className="footer-column">
                  <h4>Features</h4>
                  <ul>
                    <li><Link to="/study-buddy">Smart Assistant</Link></li>
                    <li><Link to="/profile">Analytics</Link></li>
                    <li><Link to="/my-rack">My Rack</Link></li>
                    <li><Link to="/quiz">Quiz System</Link></li>
                  </ul>
                </div>

                <div className="footer-column">
                  <h4>Resources</h4>
                  <ul>
                    <li><a href="#">Documentation</a></li>
                    <li><a href="#">API Reference</a></li>
                    <li><a href="#">Community</a></li>
                    <li><a href="#">Support</a></li>
                  </ul>
                </div>

                <div className="footer-column">
                  <h4>Company</h4>
                  <ul>
                    <li><a href="#">About Us</a></li>
                    <li><a href="#">Privacy Policy</a></li>
                    <li><a href="#">Terms of Service</a></li>
                    <li><a href="#">Contact</a></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer Bottom */}
            <div className="footer-bottom">
              <div className="footer-copyright">
                <p>&copy; 2025 StudySpace. All rights reserved.</p>
                <p className="tech-stack">Built with MERN + Python + WebRTC</p>
              </div>
              <div className="footer-legal">
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Workspace Button */}
      <button
        onClick={handleOpenWorkspace}
        className="floating-workspace-button"
        title="Open Workspace"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Open Workspace
      </button>
    </div>
  )
}

export default LandingPage
