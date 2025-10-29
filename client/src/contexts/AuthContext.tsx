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
        try {
          // User is signed in
          setFirebaseUser(firebaseUser)
          
          // Sync Firebase user with MongoDB
          const mongoUser = await apiService.syncFirebaseUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || undefined,
            photoURL: firebaseUser.photoURL || undefined
          })
          
          // Create user profile with MongoDB data
          const userProfile: UserProfile = {
            id: mongoUser._id, // Use MongoDB _id for consistency
            fullName: mongoUser.fullName,
            email: mongoUser.email,
            avatar: mongoUser.avatarUrl,
            role: 'Student',
            coursesCompleted: 0,
            streakDays: 0,
            totalNotes: 0,
            weeklyActivity: '0h',
            joinedDate: mongoUser.createdAt,
            lastActive: new Date().toISOString(),
            preferences: mongoUser.preferences || {
              theme: 'light',
              notifications: true,
              language: 'en'
            }
          }
          
          // Fetch real user stats
          try {
            const stats = await apiService.getUserStats(mongoUser._id)
            userProfile.totalNotes = stats.totalNotes
            userProfile.coursesCompleted = stats.coursesCompleted
            userProfile.streakDays = stats.streakDays
            userProfile.weeklyActivity = stats.weeklyActivity
          } catch (statsError) {
            console.warn('Could not fetch user stats:', statsError)
          }
          
          setUser(userProfile)
          
          // Get the ID token
          const token = await firebaseUser.getIdToken()
          setToken(token)
          localStorage.setItem('auth_token', token)
          localStorage.setItem('user_data', JSON.stringify(userProfile))
          
          console.log('✅ Firebase user authenticated and synced:', userProfile.email)
        } catch (error) {
          console.error('❌ Error syncing Firebase user:', error)
          // Fallback to basic user profile if sync fails
          const fallbackProfile = createUserProfile(firebaseUser)
          setUser(fallbackProfile)
          
          const token = await firebaseUser.getIdToken()
          setToken(token)
          localStorage.setItem('auth_token', token)
        }
      } else {
        // User is signed out
        setFirebaseUser(null)
        setUser(null)
        setToken(null)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        console.log('👋 User signed out')
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
