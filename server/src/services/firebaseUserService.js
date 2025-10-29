const { User } = require('../models/User');

/**
 * Firebase User Service
 * Handles user creation and lookup for Firebase authenticated users
 */
class FirebaseUserService {
  /**
   * Create or update user from Firebase token
   * @param {Object} firebaseUser - Firebase user object
   * @returns {Promise<Object>} - User document
   */
  static async createOrUpdateUser(firebaseUser) {
    try {
      const { uid, email, displayName, photoURL } = firebaseUser;
      
      console.log('🔄 Creating/updating user for Firebase UID:', uid);
      
      // Check if user already exists
      let user = await User.findById(uid);
      
      if (user) {
        console.log('✅ User found, updating information');
        // Update existing user
        user.email = email || user.email;
        user.fullName = displayName || user.fullName;
        user.avatarUrl = photoURL || user.avatarUrl;
        user.firebaseUID = uid;
        
        await user.save();
        return user;
      } else {
        console.log('🆕 Creating new user');
        // Create new user
        user = new User({
          _id: uid, // Use Firebase UID as primary key
          email: email || `${uid}@firebase.local`,
          fullName: displayName || 'Firebase User',
          avatarUrl: photoURL || null,
          firebaseUID: uid,
          preferences: {
            theme: 'light',
            language: 'en',
            emailNotif: true,
            pushNotif: true,
            reminder: {
              enabled: false,
              time: '09:00',
              frequency: 'daily'
            }
          },
          privacy: {},
          security: {
            tfaEnabled: false,
            sessions: []
          }
        });
        
        await user.save();
        console.log('✅ New user created successfully');
        return user;
      }
    } catch (error) {
      console.error('❌ Error creating/updating Firebase user:', error);
      throw error;
    }
  }
  
  /**
   * Get user by Firebase UID
   * @param {string} uid - Firebase UID
   * @returns {Promise<Object|null>} - User document or null
   */
  static async getUserByUID(uid) {
    try {
      const user = await User.findById(uid);
      return user;
    } catch (error) {
      console.error('❌ Error fetching user by UID:', error);
      return null;
    }
  }
  
  /**
   * Validate Firebase UID format
   * @param {string} uid - Firebase UID to validate
   * @returns {boolean} - Whether the UID is valid
   */
  static isValidFirebaseUID(uid) {
    // Firebase UIDs are typically 28 characters long and alphanumeric
    return typeof uid === 'string' && uid.length >= 20 && /^[a-zA-Z0-9]+$/.test(uid);
  }
}

module.exports = FirebaseUserService;
