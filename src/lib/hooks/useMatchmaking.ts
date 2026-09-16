"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  clearPairing,
  createLiveGame,
  joinQueue,
  leaveQueue,
  subscribePairing,
  subscribeQueue,
  writePairing,
  type Pairing,
  type QueueEntry,
} from "@/lib/online/liveGames";
import { START_FEN } from "@/lib/chess/pgn";

export interface MatchmakingSettings {
  initialMs: number;
  incrementMs: number;
  rated: boolean;
}

const MAX_RATING_GAP = 500;

/**
 * Client-side matchmaking.
 *
 * Both players drop an entry into /matchmakingQueue. Everyone can see the
 * queue, and the player who has been waiting longest creates the game and
 * writes a /pairings/{uid} hand-off for both sides — so exactly one game
 * is created per pair.
 */
export function useMatchmaking() {
  const { firebaseUser, profile, isAuthenticated } = useAuth();
  const uid = isAuthenticated && firebaseUser ? firebaseUser.uid : null;

  const [searching, setSearching] = useState(false);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const creatingRef = useRef(false);

  useEffect(() => {
    if (!uid) return;
    const unsubQueue = subscribeQueue(setQueue);
    const unsubPairing = subscribePairing(uid, (next) => setPairing(next));
    return () => {
      unsubQueue();
      unsubPairing();
    };
  }, [uid]);

  const start = useCallback(
    async (settings: MatchmakingSettings) => {
      if (!uid || !profile) return;
      setSearching(true);
      setError(null);
      creatingRef.current = false;
      await joinQueue({
        userId: uid,
        username: profile.username,
        rating: profile.rating,
        initialMs: settings.initialMs,
        incrementMs: settings.incrementMs,
        rated: settings.rated,
        joinedAt: Date.now(),
      });
    },
    [uid, profile]
  );

  const cancel = useCallback(async () => {
    if (!uid) return;
    setSearching(false);
    creatingRef.current = false;
    await leaveQueue(uid).catch(() => undefined);
  }, [uid]);

  const clear = useCallback(async () => {
    if (!uid) return;
    setPairing(null);
    await clearPairing(uid).catch(() => undefined);
  }, [uid]);

  // Pair up as soon as a compatible opponent is waiting.
  useEffect(() => {
    if (!searching || !uid || !profile || creatingRef.current) return;

    const me = queue.find((entry) => entry.userId === uid);
    if (!me) return;

    const opponent = queue.find(
      (entry) =>
        entry.userId !== uid &&
        entry.initialMs === me.initialMs &&
        entry.incrementMs === me.incrementMs &&
        entry.rated === me.rated &&
        Math.abs(entry.rating - me.rating) <= MAX_RATING_GAP
    );
    if (!opponent) return;

    // Oldest entry hosts; ties are broken by uid so both clients agree.
    const iGoFirst =
      me.joinedAt < opponent.joinedAt ||
      (me.joinedAt === opponent.joinedAt && me.userId < opponent.userId);
    if (!iGoFirst) return;

    creatingRef.current = true;
    void (async () => {
      try {
        const gameId = await createLiveGame({
          whitePlayerId: uid,
          whiteName: me.username,
          whiteRating: me.rating,
          initialMs: me.initialMs,
          incrementMs: me.incrementMs,
          rated: me.rated,
          isPrivate: false,
          startFen: START_FEN,
        });
        const createdAt = Date.now();
        await writePairing(opponent.userId, {
          gameId,
          color: "black",
          opponentName: me.username,
          createdAt,
        });
        await writePairing(uid, {
          gameId,
          color: "white",
          opponentName: opponent.username,
          createdAt,
        });
        await leaveQueue(uid);
        setSearching(false);
      } catch {
        creatingRef.current = false;
        setError("Could not start the game. Please try again.");
        setSearching(false);
      }
    })();
  }, [searching, uid, profile, queue]);

  return { searching, queue, pairing, error, start, cancel, clear };
}
