"use client";

import {
  ref,
  set,
  get,
  update,
  remove,
  push,
  onValue,
  off,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  type DataSnapshot,
} from "firebase/database";
import { rtdb } from "@/lib/firebase/config";

/**
 * Realtime Database layer for online play.
 *
 *   liveGames/{gameId}          – game state, clocks and move list
 *   liveGames/{gameId}/chat     – in-game chat
 *   matchmakingQueue/{uid}      – who is looking for a game
 *   pairings/{uid}              – "your game is ready" hand-off
 *   presence/{uid}              – online/offline indicator
 *
 * Timestamps are client-side `Date.now()` values: the RTDB clock drives
 * display and timeout detection, not a trusted authority (see the README
 * "known limitations" section).
 */

export type LiveGameStatus = "waiting" | "playing" | "finished";
export type LiveResult = "white" | "black" | "draw";
export type PromotionPiece = "q" | "r" | "b" | "n";

export interface LiveMove {
  san: string;
  from: string;
  to: string;
  promotion?: PromotionPiece;
  color: "w" | "b";
  fen: string;
  byUid: string;
  at: number;
}

export interface LiveGame {
  gameId: string;
  status: LiveGameStatus;
  isPrivate: boolean;
  rated: boolean;
  initialMs: number;
  incrementMs: number;
  whitePlayerId: string;
  whiteName: string;
  whiteRating: number;
  blackPlayerId: string | null;
  blackName: string | null;
  blackRating: number | null;
  fen: string;
  turn: "w" | "b";
  moveCount: number;
  lastMoveAt: number | null;
  whiteMs: number;
  blackMs: number;
  result: LiveResult | null;
  reason: string | null;
  finishedAt: number | null;
  createdAt: number;
  updatedAt: number;
  creatorId: string;
  firestoreGameId: string | null;
  moves: Record<string, LiveMove> | null;
  drawOfferBy: string | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  at: number;
}

export interface QueueEntry {
  userId: string;
  username: string;
  rating: number;
  initialMs: number;
  incrementMs: number;
  rated: boolean;
  joinedAt: number;
}

export interface Pairing {
  gameId: string;
  color: "white" | "black";
  opponentName: string;
  createdAt: number;
}

export interface PresenceState {
  online: boolean;
  lastSeen: number;
  username?: string;
}

/** Drop `undefined` values so RTDB stores a clean tree. */
function clean<T extends Record<string, unknown>>(value: T): T {
  const output: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (val !== undefined) output[key] = val;
  }
  return output as T;
}

export function liveGameRef(gameId: string) {
  return ref(rtdb, `liveGames/${gameId}`);
}

export async function createLiveGame(input: {
  whitePlayerId: string;
  whiteName: string;
  whiteRating: number;
  initialMs: number;
  incrementMs: number;
  rated: boolean;
  isPrivate: boolean;
  startFen: string;
}): Promise<string> {
  const newRef = push(ref(rtdb, "liveGames"));
  const gameId = newRef.key as string;
  const now = Date.now();

  const game: Omit<LiveGame, "moves"> = {
    gameId,
    status: "waiting",
    isPrivate: input.isPrivate,
    rated: input.rated,
    initialMs: input.initialMs,
    incrementMs: input.incrementMs,
    whitePlayerId: input.whitePlayerId,
    whiteName: input.whiteName,
    whiteRating: input.whiteRating,
    blackPlayerId: null,
    blackName: null,
    blackRating: null,
    fen: input.startFen,
    turn: "w",
    moveCount: 0,
    lastMoveAt: null,
    whiteMs: input.initialMs,
    blackMs: input.initialMs,
    result: null,
    reason: null,
    finishedAt: null,
    createdAt: now,
    updatedAt: now,
    creatorId: input.whitePlayerId,
    firestoreGameId: null,
    drawOfferBy: null,
  };

  await set(newRef, clean({ ...game } as unknown as Record<string, unknown>));
  return gameId;
}

export async function joinLiveGame(
  gameId: string,
  joiner: { uid: string; name: string; rating: number }
): Promise<void> {
  const now = Date.now();
  await update(liveGameRef(gameId), {
    blackPlayerId: joiner.uid,
    blackName: joiner.name,
    blackRating: joiner.rating,
    status: "playing",
    // White's clock starts ticking the moment the game begins.
    lastMoveAt: now,
    updatedAt: now,
  });
}

export async function closeLiveGame(gameId: string): Promise<void> {
  await remove(liveGameRef(gameId));
}

export async function finishLiveGame(
  gameId: string,
  result: LiveResult,
  reason: string
): Promise<void> {
  const now = Date.now();
  await update(liveGameRef(gameId), {
    status: "finished",
    result,
    reason,
    finishedAt: now,
    updatedAt: now,
    drawOfferBy: null,
  });
}

export async function pushMove(
  gameId: string,
  input: {
    move: LiveMove;
    moveCount: number;
    clocks: { whiteMs: number; blackMs: number };
  }
): Promise<void> {
  const now = Date.now();
  await update(liveGameRef(gameId), {
    [`moves/${input.moveCount}`]: clean({
      ...input.move,
    } as unknown as Record<string, unknown>),
    moveCount: input.moveCount,
    fen: input.move.fen,
    turn: input.move.color === "w" ? "b" : "w",
    lastMoveAt: now,
    whiteMs: Math.round(input.clocks.whiteMs),
    blackMs: Math.round(input.clocks.blackMs),
    updatedAt: now,
    drawOfferBy: null,
  });
}

export async function setFirestoreGameId(
  gameId: string,
  firestoreGameId: string
): Promise<void> {
  await update(liveGameRef(gameId), { firestoreGameId });
}

export async function offerDraw(
  gameId: string,
  uid: string | null
): Promise<void> {
  await update(liveGameRef(gameId), {
    drawOfferBy: uid,
    updatedAt: Date.now(),
  });
}

export async function sendChatMessage(
  gameId: string,
  message: Omit<ChatMessage, "id">
): Promise<void> {
  await push(
    ref(rtdb, `liveGames/${gameId}/chat`),
    clean({ ...message } as unknown as Record<string, unknown>)
  );
}

export function subscribeLiveGame(
  gameId: string,
  onChange: (game: LiveGame | null) => void
): () => void {
  const gameRef = liveGameRef(gameId);
  const handler = (snapshot: DataSnapshot) => {
    onChange(snapshot.exists() ? (snapshot.val() as LiveGame) : null);
  };
  onValue(gameRef, handler, () => onChange(null));
  return () => off(gameRef, "value", handler);
}

export function subscribeChat(
  gameId: string,
  onChange: (messages: ChatMessage[]) => void
): () => void {
  const chatRef = query(
    ref(rtdb, `liveGames/${gameId}/chat`),
    orderByChild("at"),
    limitToLast(60)
  );
  const handler = (snapshot: DataSnapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((child) => {
      messages.push({
        ...(child.val() as ChatMessage),
        id: child.key as string,
      });
    });
    onChange(messages);
  };
  onValue(chatRef, handler, () => onChange([]));
  return () => off(chatRef, "value", handler);
}

/** Games waiting for an opponent (public challenges only). */
export function subscribeOpenGames(
  onChange: (games: LiveGame[]) => void
): () => void {
  const openRef = query(
    ref(rtdb, "liveGames"),
    orderByChild("status"),
    equalTo("waiting")
  );
  const handler = (snapshot: DataSnapshot) => {
    const games: LiveGame[] = [];
    snapshot.forEach((child) => {
      const game = child.val() as LiveGame;
      if (!game.isPrivate) games.push(game);
    });
    games.sort((a, b) => b.createdAt - a.createdAt);
    onChange(games);
  };
  onValue(openRef, handler, () => onChange([]));
  return () => off(openRef, "value", handler);
}

/** Games currently being played (used by the watch page). */
export function subscribeActiveGames(
  onChange: (games: LiveGame[]) => void
): () => void {
  const activeRef = query(
    ref(rtdb, "liveGames"),
    orderByChild("status"),
    equalTo("playing")
  );
  const handler = (snapshot: DataSnapshot) => {
    const games: LiveGame[] = [];
    snapshot.forEach((child) => {
      games.push(child.val() as LiveGame);
    });
    games.sort((a, b) => b.updatedAt - a.updatedAt);
    onChange(games);
  };
  onValue(activeRef, handler, () => onChange([]));
  return () => off(activeRef, "value", handler);
}

// ---------------------------------------------------------------------
// Matchmaking
// ---------------------------------------------------------------------

export async function joinQueue(entry: QueueEntry): Promise<void> {
  await set(
    ref(rtdb, `matchmakingQueue/${entry.userId}`),
    clean({ ...entry } as unknown as Record<string, unknown>)
  );
}

export async function leaveQueue(uid: string): Promise<void> {
  await remove(ref(rtdb, `matchmakingQueue/${uid}`));
}

export function subscribeQueue(
  onChange: (entries: QueueEntry[]) => void
): () => void {
  const queueRef = ref(rtdb, "matchmakingQueue");
  const handler = (snapshot: DataSnapshot) => {
    const entries: QueueEntry[] = [];
    snapshot.forEach((child) => {
      entries.push(child.val() as QueueEntry);
    });
    entries.sort((a, b) => a.joinedAt - b.joinedAt);
    onChange(entries);
  };
  onValue(queueRef, handler, () => onChange([]));
  return () => off(queueRef, "value", handler);
}

export async function writePairing(
  uid: string,
  pairing: Pairing
): Promise<void> {
  await set(
    ref(rtdb, `pairings/${uid}`),
    clean({ ...pairing } as unknown as Record<string, unknown>)
  );
}

export async function clearPairing(uid: string): Promise<void> {
  await remove(ref(rtdb, `pairings/${uid}`));
}

export async function readPairing(uid: string): Promise<Pairing | null> {
  const snap = await get(ref(rtdb, `pairings/${uid}`));
  return snap.exists() ? (snap.val() as Pairing) : null;
}

export function subscribePairing(
  uid: string,
  onChange: (pairing: Pairing | null) => void
): () => void {
  const pairingRef = ref(rtdb, `pairings/${uid}`);
  const handler = (snapshot: DataSnapshot) => {
    onChange(snapshot.exists() ? (snapshot.val() as Pairing) : null);
  };
  onValue(pairingRef, handler, () => onChange(null));
  return () => off(pairingRef, "value", handler);
}

// ---------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------

export async function setPresence(
  uid: string,
  state: PresenceState
): Promise<void> {
  await set(
    ref(rtdb, `presence/${uid}`),
    clean({ ...state } as unknown as Record<string, unknown>)
  );
}

export function subscribePresence(
  uid: string,
  onChange: (state: PresenceState | null) => void
): () => void {
  const presenceRef = ref(rtdb, `presence/${uid}`);
  const handler = (snapshot: DataSnapshot) => {
    onChange(snapshot.exists() ? (snapshot.val() as PresenceState) : null);
  };
  onValue(presenceRef, handler, () => onChange(null));
  return () => off(presenceRef, "value", handler);
}
