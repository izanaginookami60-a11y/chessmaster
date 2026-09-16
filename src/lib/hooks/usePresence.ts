"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { setPresence } from "@/lib/online/liveGames";

const HEARTBEAT_MS = 60_000;

/**
 * Publishes "I'm online" into the Realtime Database and refreshes it every
 * minute, plus a best-effort offline marker when the tab closes. Friends
 * lists and the online indicator read from /presence/{uid}.
 */
export function usePresence() {
  const { firebaseUser, isAuthenticated, profile } = useAuth();
  const uid = isAuthenticated && firebaseUser ? firebaseUser.uid : null;
  const username = profile?.username;

  useEffect(() => {
    if (!uid) return;

    const markOnline = () => {
      void setPresence(uid, {
        online: true,
        lastSeen: Date.now(),
        username,
      }).catch(() => undefined);
    };
    const markOffline = () => {
      void setPresence(uid, {
        online: false,
        lastSeen: Date.now(),
        username,
      }).catch(() => undefined);
    };

    markOnline();
    const id = setInterval(markOnline, HEARTBEAT_MS);
    window.addEventListener("beforeunload", markOffline);

    return () => {
      clearInterval(id);
      window.removeEventListener("beforeunload", markOffline);
      markOffline();
    };
  }, [uid, username]);
}
