import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  applyElo,
  bucketForTimeControl,
  isRateableUserId,
  resultToPgn,
  type GameOutcome,
} from "./rating";

const db = getFirestore();

const BUCKET_FIELD: Record<string, string> = {
  bullet: "ratingBullet",
  blitz: "ratingBlitz",
  rapid: "ratingRapid",
};

interface GameLikeData {
  whitePlayerId?: string;
  blackPlayerId?: string;
  whiteName?: string;
  blackName?: string;
  result?: GameOutcome;
  reason?: string;
  rated?: boolean;
  isBotGame?: boolean;
  timeControl?: string;
  ratedApplied?: boolean;
}

/**
 * Apply Elo once, when a rated game first reaches a finished state.
 * Both player documents and the notification inboxes are updated in a
 * single transaction so a retry can never double-count a result
 * (guarded by `ratedApplied`).
 */
export const rateCompletedGame = onDocumentWritten(
  "games/{gameId}",
  async (event) => {
    const after = event.data?.after;
    if (!after?.exists) return;

    const game = after.data() as GameLikeData;
    if (!game.result || game.ratedApplied || game.isBotGame || !game.rated) {
      return;
    }
    if (
      !isRateableUserId(game.whitePlayerId) ||
      !isRateableUserId(game.blackPlayerId)
    ) {
      return;
    }

    const gameId = event.params.gameId;
    const whiteId = game.whitePlayerId as string;
    const blackId = game.blackPlayerId as string;
    const outcome = game.result;
    const seconds =
      game.timeControl && game.timeControl !== "unlimited"
        ? Number(game.timeControl)
        : null;
    const bucket = bucketForTimeControl(
      seconds !== null && Number.isFinite(seconds) ? seconds : null
    );
    const ratingField = BUCKET_FIELD[bucket];
    const bucketGamesField = `rating${bucket.charAt(0).toUpperCase()}${bucket.slice(1)}Games`;

    try {
      await db.runTransaction(async (tx) => {
        const gameRef = db.collection("games").doc(gameId);
        const whiteRef = db.collection("users").doc(whiteId);
        const blackRef = db.collection("users").doc(blackId);

        // All reads happen before any write (Firestore transaction rule).
        const [gameSnap, whiteSnap, blackSnap] = await Promise.all([
          tx.get(gameRef),
          tx.get(whiteRef),
          tx.get(blackRef),
        ]);

        const fresh = gameSnap.data() as GameLikeData | undefined;
        if (!fresh || fresh.ratedApplied) return;

        const whiteData = whiteSnap.data() ?? {};
        const blackData = blackSnap.data() ?? {};

        const whiteRating = Number(
          whiteData[ratingField] ?? whiteData.rating ?? 1200
        );
        const blackRating = Number(
          blackData[ratingField] ?? blackData.rating ?? 1200
        );
        const whiteGames = Number(
          (whiteData.stats as { gamesPlayed?: number } | undefined)
            ?.gamesPlayed ?? 0
        );
        const blackGames = Number(
          (blackData.stats as { gamesPlayed?: number } | undefined)
            ?.gamesPlayed ?? 0
        );

        const update = applyElo(
          { white: whiteRating, black: blackRating },
          outcome,
          { white: whiteGames, black: blackGames }
        );

        const whiteWon = outcome === "white";
        const blackWon = outcome === "black";
        const drawn = outcome === "draw";
        const now = new Date().toISOString();

        tx.update(gameRef, { ratedApplied: true, ratingBucket: bucket });

        tx.update(whiteRef, {
          [ratingField]: update.white,
          [bucketGamesField]: FieldValue.increment(1),
          "stats.gamesPlayed": FieldValue.increment(1),
          "stats.wins": FieldValue.increment(whiteWon ? 1 : 0),
          "stats.losses": FieldValue.increment(blackWon ? 1 : 0),
          "stats.draws": FieldValue.increment(drawn ? 1 : 0),
          lastGameAt: now,
        });

        tx.update(blackRef, {
          [ratingField]: update.black,
          [bucketGamesField]: FieldValue.increment(1),
          "stats.gamesPlayed": FieldValue.increment(1),
          "stats.wins": FieldValue.increment(blackWon ? 1 : 0),
          "stats.losses": FieldValue.increment(whiteWon ? 1 : 0),
          "stats.draws": FieldValue.increment(drawn ? 1 : 0),
          lastGameAt: now,
        });

        const pgnResult = resultToPgn(outcome);
        const notify = (userId: string, opponentName: string, delta: number) => {
          tx.set(db.collection("notifications").doc(), {
            userId,
            type: "game-result",
            gameId,
            title: "Rated game finished",
            body: `${pgnResult} vs ${opponentName} · ${
              delta >= 0 ? "+" : ""
            }${delta} rating`,
            read: false,
            createdAt: now,
          });
        };

        notify(whiteId, game.blackName ?? "your opponent", update.whiteDelta);
        notify(blackId, game.whiteName ?? "your opponent", update.blackDelta);
      });

      logger.info("Rated game applied", { gameId, bucket });
    } catch (error) {
      logger.error("Failed to rate game", { gameId, error });
      throw error;
    }
  }
);

/**
 * Trusted writer for online game results. Verifies that the caller is one
 * of the two players before writing `result`, which then feeds the rating
 * trigger above. Firestore rules refuse direct client writes to `result`,
 * so this callable is the only way a live game can be finished.
 */
export const submitGameResult = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to report a result.");
  }

  const data = request.data as {
    gameId?: string;
    result?: GameOutcome;
    reason?: string;
    finalFen?: string;
    moves?: Array<{ san: string; color: "w" | "b" }>;
  };

  const { gameId, result, reason, finalFen } = data;
  if (!gameId || !result || !reason) {
    throw new HttpsError(
      "invalid-argument",
      "gameId, result and reason are required."
    );
  }
  if (!["white", "black", "draw"].includes(result)) {
    throw new HttpsError("invalid-argument", "Unsupported result.");
  }

  const gameRef = db.collection("games").doc(gameId);
  const snap = await gameRef.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "That game does not exist.");
  }

  const game = snap.data() as GameLikeData;
  if (game.whitePlayerId !== uid && game.blackPlayerId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "You are not a player in this game."
    );
  }
  if (game.result) {
    // Idempotent: somebody already reported the result.
    return { ok: true, alreadyFinished: true };
  }

  await gameRef.update({
    result,
    reason,
    finalFen: finalFen ?? null,
    moves: data.moves ?? [],
    finishedAt: new Date().toISOString(),
  });

  return { ok: true };
});

