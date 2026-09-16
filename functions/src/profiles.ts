import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();
const PUBLIC_PROFILE_FIELDS = [
  "uid",
  "username",
  "country",
  "skillLevel",
  "photoURL",
  "rating",
  "ratingBullet",
  "ratingBlitz",
  "ratingRapid",
  "ratingPuzzle",
  "stats",
  "createdAt",
  "profileSetupComplete",
] as const;

/**
 * Mirror the public subset of a user document into /publicProfiles/{uid}
 * so profiles, the leaderboard and player search can be public without
 * exposing email addresses.
 */
export const syncPublicProfile = onDocumentWritten(
  "users/{userId}",
  async (event) => {
    const userId = event.params.userId;
    const after = event.data?.after;

    if (!after?.exists) {
      await db.collection("publicProfiles").doc(userId).delete();
      return;
    }

    const data = after.data() ?? {};
    const publicProfile: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    for (const field of PUBLIC_PROFILE_FIELDS) {
      if (data[field] !== undefined) publicProfile[field] = data[field];
    }
    publicProfile.isVerified = !!data.isVerified;

    await db.collection("publicProfiles").doc(userId).set(publicProfile, {
      merge: true,
    });
    logger.debug("Synced public profile", { userId });
  }
);
