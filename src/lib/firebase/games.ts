import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as limitTo,
  startAt,
  endAt,
  serverTimestamp,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { firestore, functions } from "./config";
import type { MoveHistoryEntry } from "@/lib/chess/types";
import type { PublicProfile } from "@/types/user";

export interface CompletedGameRecord {
  whitePlayerId: string;
  blackPlayerId: string;
  whiteName: string;
  blackName: string;
  isBotGame: boolean;
  botId?: string;
  /** Absent while an online game is still in progress. */
  result?: "white" | "black" | "draw";
  reason: string;
  rated: boolean;
  timeControl: string;
  moves: Array<Pick<MoveHistoryEntry, "san" | "color">>;
  finalFen: string;
  /** Extra metadata used by the game viewer (both optional). */
  initialFen?: string;
  isOnline?: boolean;
}

export interface GameDocument extends CompletedGameRecord {
  id: string;
  createdAt: Timestamp | null;
  createdMillis: number;
}

export async function saveCompletedGame(
  record: CompletedGameRecord
): Promise<string> {
  const docRef = await addDoc(collection(firestore, "games"), {
    ...record,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

function toDocument(
  id: string,
  data: Record<string, unknown>
): GameDocument {
  const createdAt = (data.createdAt as Timestamp | null) ?? null;
  return {
    ...(data as unknown as CompletedGameRecord),
    id,
    createdAt,
    createdMillis: createdAt?.toMillis?.() ?? Date.now(),
  };
}

export async function fetchGame(gameId: string): Promise<GameDocument | null> {
  const snap = await getDoc(doc(firestore, "games", gameId));
  if (!snap.exists()) return null;
  return toDocument(snap.id, snap.data());
}

/**
 * Most recent games for a player. Firestore can't OR across fields in a
 * single query, so we fetch the games where they played White and where
 * they played Black, then merge. Both queries need the composite indexes
 * declared in firestore.indexes.json.
 */
export async function fetchGamesForUser(
  uid: string,
  max = 10
): Promise<GameDocument[]> {
  const gamesRef = collection(firestore, "games");

  const [asWhite, asBlack] = await Promise.all([
    getDocs(
      query(
        gamesRef,
        where("whitePlayerId", "==", uid),
        orderBy("createdAt", "desc"),
        limitTo(max)
      )
    ),
    getDocs(
      query(
        gamesRef,
        where("blackPlayerId", "==", uid),
        orderBy("createdAt", "desc"),
        limitTo(max)
      )
    ),
  ]);

  const merged = new Map<string, GameDocument>();
  for (const snap of [...asWhite.docs, ...asBlack.docs]) {
    merged.set(snap.id, toDocument(snap.id, snap.data()));
  }

  return [...merged.values()]
    .sort((a, b) => b.createdMillis - a.createdMillis)
    .slice(0, max);
}

/** Used by the online game room to write the final result in place. */
export async function markGameResult(
  gameId: string,
  result: {
    result: "white" | "black" | "draw";
    reason: string;
    finalFen: string;
    moves: Array<Pick<MoveHistoryEntry, "san" | "color">>;
  }
): Promise<void> {
  await updateDoc(doc(firestore, "games", gameId), {
    ...result,
    finishedAt: serverTimestamp(),
  });
}

/**
 * How did this player do? Returns null for games that are still running
 * (online games are created without a result and finished by a function).
 */
export function resultLabelForPlayer(
  game: GameDocument,
  uid: string
): "win" | "loss" | "draw" | null {
  if (!game.result) return null;
  if (game.result === "draw") return "draw";
  const playerWasWhite = game.whitePlayerId === uid;
  const winner = game.result; // "white" | "black"
  const iWon =
    (playerWasWhite && winner === "white") ||
    (!playerWasWhite && winner === "black");
  return iWon ? "win" : "loss";
}

/**
 * Online games are finished through the `submitGameResult` Cloud Function
 * so that neither player can rewrite a result after the fact (Firestore
 * rules refuse direct writes to `result`).
 */
export async function submitOnlineResult(input: {
  gameId: string;
  result: "white" | "black" | "draw";
  reason: string;
  finalFen: string;
  moves: Array<Pick<MoveHistoryEntry, "san" | "color">>;
}): Promise<void> {
  const callable = httpsCallable<
    typeof input,
    { ok: boolean; alreadyFinished?: boolean }
  >(functions, "submitGameResult");
  await callable(input);
}

/** Runs the account-deletion Cloud Function for the signed-in user. */
export async function requestAccountDeletion(): Promise<void> {
  const callable = httpsCallable<Record<string, never>, { ok: boolean }>(
    functions,
    "deleteAccount"
  );
  await callable({});
}

/** Fetch the public profile mirror (/publicProfiles/{uid}). */
export async function fetchPublicProfile(
  uid: string
): Promise<PublicProfile | null> {
  const snap = await getDoc(doc(firestore, "publicProfiles", uid));
  return snap.exists() ? (snap.data() as PublicProfile) : null;
}

/** Look up a single public profile by username (case-insensitive). */
export async function findPublicProfileByUsername(
  username: string
): Promise<PublicProfile | null> {
  const snap = await getDocs(
    query(
      collection(firestore, "publicProfiles"),
      where("username", "==", username),
      limitTo(1)
    )
  );
  if (snap.empty) return null;
  return snap.docs[0].data() as PublicProfile;
}

/** Recently active players for the leaderboard page. */
export async function fetchLeaderboard(max = 50): Promise<PublicProfile[]> {
  const snap = await getDocs(
    query(
      collection(firestore, "publicProfiles"),
      orderBy("rating", "desc"),
      limitTo(max)
    )
  );
  return snap.docs.map((docSnap) => docSnap.data() as PublicProfile);
}

/** Players whose username starts with the query (prefix search). */
export async function searchPlayers(
  term: string,
  max = 10
): Promise<PublicProfile[]> {
  const snap = await getDocs(
    query(
      collection(firestore, "publicProfiles"),
      orderBy("username"),
      startAt(term),
      endAt(`${term}\uf8ff`),
      limitTo(max)
    )
  );
  return snap.docs.map((docSnap) => docSnap.data() as PublicProfile);
}


