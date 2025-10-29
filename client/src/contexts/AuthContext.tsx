import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInAnonymously
} from 'firebase/auth'
import { auth } from '../config/firebase'
import { apiService, UserProfile } from '../services/api'

interface AuthContextType {
  user: UserProfile | null
  firebaseUser: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithGithub: () => Promise<void>
  loginAnonymously: () => Promise<void>
  logout: () => Promise<void>
  getCurrentUser: () => UserProfile | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize Google and GitHub providers
  const googleProvider = new GoogleAuthProvider()
  const githubProvider = new GithubAuthProvider()

  // Convert Firebase User to UserProfile
  const createUserProfile = (firebaseUser: User): UserProfile => {
    const fallbackName = firebaseUser.email?.split('@')[0] || 'User'
    
    return {
      id: firebaseUser.uid,
      fullName: firebaseUser.displayName || fallbackName,
      email: firebaseUser.email || '',
      avatar: firebaseUser.photoURL || undefined,
      role: 'Student',
      coursesCompleted: 0,
      streakDays: 0,
      totalNotes: 0,
      weeklyActivity: '0h',
      joinedDate: firebaseUser.metadata.creationTime || new Date().toISOString(),
      lastActive: new Date().toISOString(),
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en'
      }
    }
  }

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true)
      
      if (firebaseUser) {
        // User is signed in
        setFirebaseUser(firebaseUser)
        const userProfile = createUserProfile(firebaseUser)
        setUser(userProfile)
        
        // Get the ID token
        const token = await firebaseUser.getIdToken()
        setToken(token)
        localStorage.setItem('auth_token', token)
      } else {
        // User is signed out
        setFirebaseUser(null)
        setUser(null)
        setToken(null)
        localStorage.removeItem('auth_token')
      }
      
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Email/Password login
  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      throw new Error(error.message || 'Login failed')
    }
  }

  // Email/Password registration
  const register = async (email: string, password: string, fullName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      // You can update the display name here if needed
      // await updateProfile(result.user, { displayName: fullName })
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  // Google login
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      throw new Error(error.message || 'Google login failed')
    }
  }

  // GitHub login
  const loginWithGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider)
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      throw new Error(error.message || 'GitHub login failed')
    }
  }

  // Anonymous login
  const loginAnonymously = async () => {
    try {
      const result = await signInAnonymously(auth)
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      throw new Error(error.message || 'Anonymous login failed')
    }
  }

  // Logout
  const logout = async () => {
    try {
      await signOut(auth)
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed')
    }
  }

  const getCurrentUser = () => {
    return user
  }

  const isAuthenticated = !!user

  const value = {
    user,
    firebaseUser,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    loginWithGoogle,
    loginWithGithub,
    loginAnonymously,
    logout,
    getCurrentUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Mock user for development - remove in production
export const mockUser: UserProfile = {
  id: '68ffb16c997866b5ec3d2435',
  fullName: 'John Developer',
  email: 'dev@studyspace.com',
  role: 'Student',
  coursesCompleted: 5,
  streakDays: 12,
  totalNotes: 45,
  weeklyActivity: '8.5h',
  joinedDate: '2024-01-15',
  lastActive: new Date().toISOString(),
  preferences: {
    theme: 'light',
    notifications: true,
    language: 'en'
  }
}
