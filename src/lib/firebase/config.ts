import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, Functions, connectFunctionsEmulator } from "firebase/functions";
import { getDatabase, Database, connectDatabaseEmulator } from "firebase/database";
import { getStorage, FirebaseStorage } from "firebase/storage";

// All values come from NEXT_PUBLIC_ env vars so they are safe to expose
// client-side. Security is enforced via Firestore/RTDB/Storage rules,
// NOT by hiding this config.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

function validateConfig() {
  const required: Array<keyof typeof firebaseConfig> = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "appId",
    "databaseURL",
  ];

  const missing = required.filter((key) => !firebaseConfig[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase config values: ${missing.join(
        ", "
      )}. Check your .env.local file.`
    );
  }
}

// Prevent re-initializing the app on hot reload / multiple imports
let app: FirebaseApp;

if (getApps().length === 0) {
  validateConfig();
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);
const rtdb: Database = getDatabase(app);
const storage: FirebaseStorage = getStorage(app);
// Cloud Functions live in us-central1 (see functions/src/index.ts).
const functions: Functions = getFunctions(app, "us-central1");

/**
 * Opt-in emulator wiring for local development (see README):
 *   NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
 * Ports match the `emulators` block in firebase.json.
 */
if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"
) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
  connectDatabaseEmulator(rtdb, "127.0.0.1", 9000);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

export { app, auth, firestore, rtdb, storage, functions };

