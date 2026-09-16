import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { getDatabase } from "firebase-admin/database";

const ABANDONED_AFTER_MS = 2 * 60 * 60 * 1000; // 2 hours
const QUEUE_STALE_AFTER_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Housekeeping for the Realtime Database: delete live games nobody has
 * touched for two hours (both players closed the tab) and drop stale
 * matchmaking / pairing entries so the lobby doesn't fill with ghosts.
 */
export const cleanupLiveGames = onSchedule("every 30 minutes", async () => {
  const rtdb = getDatabase();
  const now = Date.now();

  const liveGamesSnap = await rtdb.ref("liveGames").get();
  const deletions: Array<Promise<void>> = [];

  liveGamesSnap.forEach((child) => {
    const game = child.val() as { updatedAt?: number } | null;
    if (!game) return;
    if (typeof game.updatedAt === "number" && now - game.updatedAt < ABANDONED_AFTER_MS) {
      return;
    }
    if (typeof game.updatedAt !== "number") {
      // No timestamp at all — treat as abandoned.
      deletions.push(child.ref.remove());
      return;
    }
    deletions.push(child.ref.remove());
  });

  const queueSnap = await rtdb.ref("matchmakingQueue").get();
  queueSnap.forEach((child) => {
    const entry = child.val() as { joinedAt?: number } | null;
    if (!entry) return;
    if (typeof entry.joinedAt !== "number" || now - entry.joinedAt > QUEUE_STALE_AFTER_MS) {
      deletions.push(child.ref.remove());
    }
  });

  const pairingsSnap = await rtdb.ref("pairings").get();
  pairingsSnap.forEach((child) => {
    const pairing = child.val() as { createdAt?: number } | null;
    if (!pairing) return;
    if (typeof pairing.createdAt !== "number" || now - pairing.createdAt > ABANDONED_AFTER_MS) {
      deletions.push(child.ref.remove());
    }
  });

  await Promise.all(deletions);
  logger.info("Realtime Database cleanup finished", {
    removed: deletions.length,
  });
});
