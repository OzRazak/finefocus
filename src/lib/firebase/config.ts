'use client';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig as config } from '@/lib/constants'; // Using the placeholder from constants

let firebaseApp: FirebaseApp;

// Initialize Firebase
if (!getApps().length) {
  firebaseApp = initializeApp(config);
} else {
  firebaseApp = getApps()[0];
}

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// If in development and using emulators (optional, common for local dev)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Check if emulators are already running to avoid re-connecting
  // This is a simple check; more robust checks might be needed for complex setups
  // @ts-ignore // auth.emulatorConfig is not in types but exists
  if (!auth.emulatorConfig) {
    try {
      // Make sure to use the correct host and port for your emulators
      // Default ports: Auth (9099), Firestore (8080)
      // The host 'localhost' is typically used for local emulators.
      // Firebase tools might sometimes map to 127.0.0.1 explicitly.
      // connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      // connectFirestoreEmulator(db, '127.0.0.1', 8080);
      // console.log("Connected to Firebase Emulators");
    } catch (error) {
      // console.warn("Could not connect to Firebase Emulators. Ensure they are running or comment out emulator connection code.", error);
    }
  }
}


export { firebaseApp, auth, db };
