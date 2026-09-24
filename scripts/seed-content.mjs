/**
 * Seeds Firestore with the content that ships with the app:
 *   - puzzles/{id}          (verified tactic positions)
 *   - forumCategories/{id}  (forum category list)
 *
 * Rules keep both collections read-only for clients; this script uses the
 * Admin SDK (bypasses rules) and reads credentials from .env.local.
 *
 * Usage:  node scripts/seed-content.mjs
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { createPrivateKey } from "node:crypto";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const root = new URL("../", import.meta.url);

/** Minimal .env parser: KEY=VALUE, ignores comments and blank lines. */
function loadEnvFile(path) {
  const env = {};
  let raw = "";
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return env;
  }

  for (const line of raw.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

/**
 * Accepts the many shapes a service-account key arrives in: real newlines,
 * literal `\n` escapes, quoted values, a missing BEGIN/END header (a very
 * common copy/paste accident) or a PKCS#1 key — and always returns a valid
 * PKCS#8 PEM that OpenSSL 3 / firebase-admin accept.
 */
function normalizePrivateKey(raw) {
  let key = String(raw ?? "").trim();
  key = key.replace(/\r/g, "");
  key = key.replace(/\\+n/g, "\n"); // literal \n (one or many) -> newline

  if (!key.includes("-----BEGIN")) {
    key = `-----BEGIN PRIVATE KEY-----\n${key}`;
  }
  if (!key.includes("-----END")) {
    key = `${key}\n-----END PRIVATE KEY-----`;
  }
  if (!key.endsWith("\n")) key += "\n";

  try {
    const keyObject = createPrivateKey({ key, format: "pem" });
    return keyObject.export({ type: "pkcs8", format: "pem" }).toString();
  } catch {
    return key;
  }
}

const fileEnv = loadEnvFile(new URL(".env.local", root));
const readEnv = (key) => process.env[key] ?? fileEnv[key] ?? "";

/**
 * Repairs a malformed FIREBASE_ADMIN_PRIVATE_KEY line in .env.local (with a
 * one-time backup) so every other tool that reads the file keeps working.
 */
function repairEnvFile() {
  const envPath = new URL(".env.local", root);
  if (!existsSync(envPath)) return "no .env.local";

  const original = readFileSync(envPath, "utf8");
  const repairedKey = normalizePrivateKey(fileEnv.FIREBASE_ADMIN_PRIVATE_KEY);
  if (repairedKey === fileEnv.FIREBASE_ADMIN_PRIVATE_KEY) return "already valid";

  const escaped = repairedKey.replace(/\n/g, "\\n").trim();
  const next = original
    .split(/\r?\n/)
    .map((line) =>
      line.startsWith("FIREBASE_ADMIN_PRIVATE_KEY")
        ? `FIREBASE_ADMIN_PRIVATE_KEY="${escaped}"`
        : line
    )
    .join("\n");

  copyFileSync(envPath, new URL(".env.local.bak", root));
  writeFileSync(envPath, next, "utf8");
  return "repaired (backup saved as .env.local.bak)";
}

const projectId = readEnv("FIREBASE_ADMIN_PROJECT_ID");
const clientEmail = readEnv("FIREBASE_ADMIN_CLIENT_EMAIL");
const privateKey = normalizePrivateKey(readEnv("FIREBASE_ADMIN_PRIVATE_KEY"));
const databaseURL = readEnv("NEXT_PUBLIC_FIREBASE_DATABASE_URL");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Missing FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY.\n" +
      "Add them to .env.local first (Firebase console -> Project settings -> Service accounts)."
  );
  process.exit(1);
}

console.log("Private key:", repairEnvFile());

const puzzles = JSON.parse(
  readFileSync(new URL("src/lib/puzzles/puzzles.json", root), "utf8")
);
const forumCategories = JSON.parse(
  readFileSync(new URL("scripts/forum-categories.json", root), "utf8")
);

const app = initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
  databaseURL: databaseURL || undefined,
});
const db = getFirestore(app);

async function seed() {
  const batch = db.batch();
  const seededAt = new Date().toISOString();

  for (const puzzle of puzzles) {
    batch.set(db.collection("puzzles").doc(puzzle.id), {
      ...puzzle,
      seededAt,
    });
  }

  for (const category of forumCategories) {
    batch.set(db.collection("forumCategories").doc(category.id), {
      ...category,
      seededAt,
    });
  }

  await batch.commit();
  console.log(`✔ Seeded ${puzzles.length} puzzles and ${forumCategories.length} forum categories into ${projectId}.`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("✗ Seeding failed:", error.message);
    process.exit(1);
  });
