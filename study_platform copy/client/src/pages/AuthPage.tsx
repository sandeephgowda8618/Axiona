import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

interface AuthFormData {
  email: string
  password: string
  confirmPassword?: string
  fullName?: string
}

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('') // Clear error when user types
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Validation
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all required fields')
      }

      if (!isLogin) {
        if (!formData.fullName) {
          throw new Error('Full name is required')
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (formData.password.length < 8) {
          throw new Error('Password must be at least 8 characters long')
        }
      }

      // TODO: Replace with actual API calls
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (isLogin) {
        // Mock login - in production, this would validate against backend
        if (formData.email === 'demo@studyspace.com' && formData.password === 'password123') {
          localStorage.setItem('auth_token', 'mock_token_123')
          localStorage.setItem('user_data', JSON.stringify({
            id: '1',
            email: formData.email,
            fullName: 'John Smith',
            role: 'student'
          }))
          navigate('/profile')
        } else {
          throw new Error('Invalid email or password')
        }
      } else {
        // Mock registration
        localStorage.setItem('auth_token', 'mock_token_123')
        localStorage.setItem('user_data', JSON.stringify({
          id: '2',
          email: formData.email,
          fullName: formData.fullName,
          role: 'student'
        }))
        navigate('/profile')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    // TODO: Implement Google OAuth
    console.log('Google authentication not implemented yet')
  }

  const handleGitHubAuth = () => {
    // TODO: Implement GitHub OAuth
    console.log('GitHub authentication not implemented yet')
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="auth-card">
          <div className="p-6">
            {/* Tabs - pill style */}
            <div className="w-full flex justify-center mb-6">
              <div className="bg-gray-100 rounded-full p-1 inline-flex">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true)
                    setError('')
                    setFormData({ email: '', password: '', confirmPassword: '', fullName: '' })
                  }}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false)
                    setError('')
                    setFormData({ email: '', password: '', confirmPassword: '', fullName: '' })
                  }}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  Register
                </button>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
              <p className="text-sm text-slate-500">{isLogin ? 'Sign in to your Study-AI account' : 'Join thousands of students learning smarter'}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input id="fullName" name="fullName" type="text" required={!isLogin} value={formData.fullName} onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-0 bg-white" placeholder="Enter your full name" />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-0 bg-white" placeholder="Enter your email" />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="flex gap-2">
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} required value={formData.password} onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-0 bg-white" placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="flex items-center justify-center text-slate-500 bg-transparent border border-gray-200 rounded-md w-12 h-10 hover:bg-gray-50 p-2">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{showPassword ? (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />) : (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />)}</svg>
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-slate-500 hover:text-slate-700">Forgot your password?</Link>
                </div>
              )}

              <div>
                <button type="submit" disabled={isLoading} className="w-full py-3 rounded-md text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 transition-colors border-0 shadow-none focus:outline-none focus:ring-0">
                  {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
              </div>

              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-slate-400">Or continue with</span></div>
                </div>

                <div className="mt-4 space-y-3">
                  <button type="button" onClick={handleGoogleAuth} className="w-full flex items-center justify-center gap-3 py-2 border border-gray-200 rounded-md text-sm text-slate-600 bg-white">
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google
                  </button>

                  <button type="button" onClick={handleGitHubAuth} className="w-full flex items-center justify-center gap-3 py-2 border border-gray-200 rounded-md text-sm text-slate-600 bg-white">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    Continue with GitHub
                  </button>
                </div>
              </div>

              <div className="text-center text-sm mt-6">
                <span className="text-slate-500">{isLogin ? "Don't have an account? " : 'Already have an account? '}</span>
                <span onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({ email: '', password: '', confirmPassword: '', fullName: '' }) }} className="text-blue-600 cursor-pointer ml-1">{isLogin ? 'Sign up' : 'Sign in'}</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default AuthPage