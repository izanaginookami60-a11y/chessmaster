import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

/** Welcome notification so the inbox has something in it on day one. */
export const onUserProfileCreated = onDocumentCreated(
  "users/{userId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    await db.collection("notifications").add({
      userId: event.params.userId,
      type: "welcome",
      title: "Welcome to ChessMaster",
      body: "Play a rated game, solve a puzzle, or analyse your last game.",
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
);

/**
 * Delete everything a user owns, then the auth account itself. Called
 * from the settings page — runs with admin privileges so Firestore rules
 * can keep `delete: if false` everywhere.
 */
export const deleteAccount = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in first.");
  }

  const userRef = db.collection("users").doc(uid);

  // Remove subcollections (puzzle progress, rating history) first.
  for (const sub of ["puzzleProgress", "ratingHistory"]) {
    const docs = await userRef.collection(sub).listDocuments();
    await Promise.all(docs.map((doc) => doc.delete()));
  }

  await Promise.all([
    userRef.delete().catch(() => undefined),
    db.collection("publicProfiles").doc(uid).delete().catch(() => undefined),
  ]);

  // Live data in the Realtime Database.
  const rtdb = getDatabase();
  await Promise.all([
    rtdb.ref(`presence/${uid}`).remove().catch(() => undefined),
    rtdb.ref(`matchmakingQueue/${uid}`).remove().catch(() => undefined),
    rtdb.ref(`pairings/${uid}`).remove().catch(() => undefined),
  ]);

  // Notifications addressed to the user.
  const notificationDocs = await db
    .collection("notifications")
    .where("userId", "==", uid)
    .get();
  await Promise.all(notificationDocs.docs.map((doc) => doc.ref.delete()));

  try {
    await getAuth().deleteUser(uid);
  } catch (error) {
    logger.error("Could not delete auth user", { uid, error });
    throw new HttpsError("internal", "Account data removed, but the login record could not be deleted.");
  }

  return { ok: true };
});
