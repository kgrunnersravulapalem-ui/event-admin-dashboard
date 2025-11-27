/**
 * Firebase Configuration
 * 
 * Initializes Firebase SDK and Firestore database connection.
 * Environment variables should be set in .env.local file.
 * 
 * @module firebase
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Firebase configuration object
 * Uses environment variables for security
 */
const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  apiKey: "AIzaSyB2P-vBIPrp-rMVcyirSqaRMDdPEKskix8",
  authDomain: "tanuku-road-run.firebaseapp.com",
  projectId: "tanuku-road-run",
  storageBucket: "tanuku-road-run.firebasestorage.app",
  messagingSenderId: "112694496160",
  appId: "1:112694496160:web:49782f261232839b5672c5",
//   measurementId: "G-N01BSC6V6G"
};

/**
 * Initialize Firebase app
 * Ensures only one instance is created
 */
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

/**
 * Firestore database instance
 */
export const db: Firestore = getFirestore(app);

export default app;
