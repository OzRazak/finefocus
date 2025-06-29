
import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  // If GOOGLE_APPLICATION_CREDENTIALS environment variable is set (e.g., for local development with a service account JSON file),
  // or if running in a Firebase environment (like Cloud Functions, App Engine, App Hosting),
  // initializeApp() will automatically use the correct credentials.
  try {
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
    // Optionally, if you have specific credential paths for different environments:
    // if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_CONFIG) {
    //   admin.initializeApp({
    //     credential: admin.credential.applicationDefault(),
    //     // databaseURL: `https://${JSON.parse(process.env.FIREBASE_CONFIG).projectId}.firebaseio.com` // If using Realtime DB
    //   });
    // } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    //    admin.initializeApp({
    //     credential: admin.credential.applicationDefault(),
    //   });
    // } else {
    //   // Fallback for environments where default credentials might not be set up
    //   // This might occur if GOOGLE_APPLICATION_CREDENTIALS is not set and not in a Firebase environment.
    //   // For App Hosting, this simple initializeApp() should work fine.
    //   console.warn("Firebase Admin SDK could not be initialized with default credentials. Ensure GOOGLE_APPLICATION_CREDENTIALS is set or you are in a Firebase environment.");
    // }
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore(); // Export firestore if needed for other server-side operations
