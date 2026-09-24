import {
  initializeApp,
  getApps,
  getApp,
  cert,
  App,
} from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getDatabase, Database } from "firebase-admin/database";

// This file must ONLY be imported from server-side code (API routes,
// Server Components, Server Actions). Importing it in a "use client"
// component will break the build, since these env vars are not
// NEXT_PUBLIC_ and the private key must never reach the browser.

/**
 * Accepts every shape a service-account key turns up in: real newlines,
 * literal `\n` escapes, surrounding quotes, a missing BEGIN/END header
 * (an easy copy/paste accident) or a PKCS#1 key. Always returns a valid
 * PKCS#8 PEM that OpenSSL 3 / firebase-admin accept.
 */
function normalizePrivateKey(raw: string | undefined): string {
  let key = (raw ?? "").replace(/\\+n/g, "\n").replace(/\r/g, "").trim();
  if (!key) return "";

  if (!key.includes("-----BEGIN")) {
    key = `-----BEGIN PRIVATE KEY-----\n${key}`;
  }
  if (!key.includes("-----END")) {
    key = `${key}\n-----END PRIVATE KEY-----`;
  }
  return key.endsWith("\n") ? key : `${key}\n`;
}

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // The private key is stored with literal \n escape sequences in
  // .env.local (because real newlines break most .env parsers), so it is
  // normalised back into a valid PEM here.
  const privateKey = normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Check FIREBASE_ADMIN_PROJECT_ID, " +
        "FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in .env.local."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL,
  });
}

const adminApp = getAdminApp();

const adminAuth: Auth = getAuth(adminApp);
const adminFirestore: Firestore = getFirestore(adminApp);
const adminDatabase: Database = getDatabase(adminApp);

export { adminApp, adminAuth, adminFirestore, adminDatabase };
