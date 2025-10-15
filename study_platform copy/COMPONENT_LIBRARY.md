# StudySpace UI Components Export

## 🔧 Reusable Components Library

### 1. Sticky Navigation Header
```tsx
// Sticky navigation with logo, links, and CTA
export const StickyNavigation: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - 24px icon + wordmark */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <span className="text-lg font-bold text-gray-900">StudySpace</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.to} 
                to={link.to} 
                className="text-sm text-gray-700 hover:text-indigo-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <Link to="/auth" className="bg-indigo-600 hover:brightness-90 text-white text-xs px-4 py-2 rounded transition-all duration-150">
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  )
}
```

### 2. Hero Carousel Component
```tsx
interface HeroSlide {
  title: string
  subtitle: string
  primaryButton: string
  secondaryButton: string
  image: string
}

export const HeroCarousel: React.FC<{ slides: HeroSlide[] }> = ({ slides }) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [slides.length])

  return (
    <section className="relative bg-white" style={{ height: '75vh', minHeight: '600px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 h-full items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6 lg:pr-8">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              {slides[currentSlide].title}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              {slides[currentSlide].subtitle}
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/auth" className="bg-indigo-600 hover:brightness-90 text-white px-8 py-3 rounded text-base font-medium transition-all duration-150 text-center">
                {slides[currentSlide].primaryButton}
              </Link>
              <button className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded text-base font-medium transition-all duration-150">
                {slides[currentSlide].secondaryButton}
              </button>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative">
            <div className="aspect-[3/2] rounded-xl overflow-hidden border border-indigo-100 shadow-lg">
              <img src={slides[currentSlide].image} alt={slides[currentSlide].title} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`rounded-full transition-all duration-200 ${
                  index === currentSlide ? 'w-2 h-2 bg-indigo-600' : 'w-1.5 h-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

### 3. Alternating Feature Cards
```tsx
interface FeatureCard {
  title: string
  description: string
  image: string
  link: string
  alignment: 'left' | 'right'
}

export const AlternatingFeatureCards: React.FC<{ features: FeatureCard[] }> = ({ features }) => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {features.map((feature, index) => (
            <div key={index} className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
              feature.alignment === 'right' ? 'lg:flex-row-reverse' : ''
            }`}>
              {/* Image */}
              <div className="w-full lg:w-1/2">
                <div className="aspect-[540/220] rounded-xl overflow-hidden border border-indigo-100 shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 ease-out">
                  <img src={feature.image} alt={feature.title} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Content */}
              <div className="w-full lg:w-1/2 space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                <p className="text-base text-gray-600 leading-relaxed">{feature.description}</p>
                <div className="pt-2">
                  <Link to={feature.link} className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                    Learn More
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### 4. Floating Action Button
```tsx
export const FloatingWorkspaceButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 hover:scale-110 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center ${
        isScrolled ? 'animate-float-pulse' : ''
      }`}
      title="Open Workspace"
      style={{ boxShadow: '0 8px 32px rgba(79, 70, 229, 0.3)' }}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </button>
  )
}
```

### 5. Footer Component
```tsx
export const Footer: React.FC = () => {
  const footerLinks = {
    features: [
      { label: 'Tutorial Hub', to: '/tutorial-hub' },
      { label: 'StudyPES', to: '/study-pes' },
      { label: 'Conference', to: '/conference' },
      { label: 'AI Workspace', to: '/workspace' }
    ],
    support: [
      { label: 'Help Center', to: '/help' },
      { label: 'Documentation', to: '/docs' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'Feedback', to: '/feedback' }
    ]
  }

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="text-xl font-bold">StudySpace</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Empowering students worldwide with AI-powered learning tools, real-time collaboration, and comprehensive progress tracking.
            </p>
            <p className="text-gray-500 text-sm">© 2025 Study-AI Platform – Built with MERN + Python + WebRTC</p>
          </div>

          {/* Features Links */}
          <div>
            <h4 className="font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-gray-400">
              {footerLinks.features.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              {footerLinks.support.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
```

## 🎨 CSS Animations

### Custom Tailwind Animations
```css
@layer utilities {
  @keyframes float-pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 8px 32px rgba(79, 70, 229, 0.3);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 12px 40px rgba(79, 70, 229, 0.4);
    }
  }
  
  .animate-float-pulse {
    animation: float-pulse 2s ease-in-out infinite;
  }
  
  @keyframes fade-slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-slide-up {
    animation: fade-slide-up 0.6s ease-out;
  }
}
```

## 📱 Responsive Breakpoints

### Design System Grid
```css
/* Mobile First Approach */
.container {
  @apply px-4 sm:px-6 lg:px-8;
}

/* Breakpoints */
- Mobile: < 768px (single column, stacked)
- Tablet: 768px - 1279px (mixed layout)
- Desktop: ≥ 1280px (full 2-column)
```

## 🚀 Usage Example

```tsx
import { 
  StickyNavigation, 
  HeroCarousel, 
  AlternatingFeatureCards, 
  FloatingWorkspaceButton, 
  Footer 
} from './components'

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <StickyNavigation />
      <HeroCarousel slides={heroSlides} />
      <AlternatingFeatureCards features={featureCards} />
      <Footer />
      <FloatingWorkspaceButton onClick={handleOpenWorkspace} />
    </div>
  )
}
```

---

**All components are production-ready and follow the StudySpace design system specifications.**
