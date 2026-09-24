/**
 * Runs before every Vitest process so pure library modules that import
 * `firebase/config` do not throw on missing env vars. These are fake
 * values — unit tests never touch the real backend.
 */
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-api-key";
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "test.firebaseapp.com";
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "chessmaster-test";
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "test.appspot.com";
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "1234567890";
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "1:1234567890:web:abcdef";
process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = "G-TEST";
process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL =
  "https://chessmaster-test.firebaseio.com";
