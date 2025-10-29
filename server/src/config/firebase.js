const admin = require('firebase-admin');

/**
 * Firebase Admin SDK Configuration
 * Initializes Firebase Admin for server-side authentication
 */
class FirebaseAdmin {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initialize() {
    try {
      if (this.initialized) {
        console.log('🔥 Firebase Admin already initialized');
        return;
      }

      // Check if Firebase credentials are provided
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (projectId && privateKey && clientEmail) {
        // Initialize with service account credentials
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
          projectId
        });
        console.log('🔥 Firebase Admin initialized with service account');
      } else {
        // Initialize with default credentials (for development)
        // This will work if you have GOOGLE_APPLICATION_CREDENTIALS env var
        // or if running on Google Cloud Platform
        try {
          admin.initializeApp();
          console.log('🔥 Firebase Admin initialized with default credentials');
        } catch (defaultError) {
          console.warn('⚠️ Firebase Admin not configured - using mock authentication for development');
          // In development, you might want to mock Firebase auth
          this.mockMode = true;
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('❌ Firebase Admin initialization error:', error.message);
      console.warn('⚠️ Running in mock authentication mode for development');
      this.mockMode = true;
      this.initialized = true;
    }
  }

  /**
   * Verify Firebase ID token
   * @param {string} idToken - Firebase ID token
   * @returns {Promise<Object>} - Decoded token
   */
  async verifyIdToken(idToken) {
    if (this.mockMode) {
      // Mock authentication for development
      console.log('🔧 Mock authentication - accepting token:', idToken.substring(0, 20) + '...');
      return {
        uid: 'mock-user-' + Date.now(),
        email: 'mock@example.com',
        name: 'Mock User',
        auth_time: Date.now() / 1000,
        iat: Date.now() / 1000,
        exp: (Date.now() / 1000) + 3600
      };
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('❌ Firebase token verification failed:', error.message);
      throw new Error('Invalid authentication token');
    }
  }

  /**
   * Get user by UID
   * @param {string} uid - User UID
   * @returns {Promise<Object>} - User record
   */
  async getUser(uid) {
    if (this.mockMode) {
      return {
        uid,
        email: 'mock@example.com',
        displayName: 'Mock User',
        emailVerified: true
      };
    }

    try {
      const userRecord = await admin.auth().getUser(uid);
      return userRecord;
    } catch (error) {
      console.error('❌ Error fetching user:', error.message);
      throw error;
    }
  }

  /**
   * Check if Firebase Admin is in mock mode
   * @returns {boolean}
   */
  isMockMode() {
    return this.mockMode || false;
  }
}

// Export singleton instance
const firebaseAdmin = new FirebaseAdmin();
module.exports = firebaseAdmin;
