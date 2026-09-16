"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiBell } from "react-icons/fi";
import { collection, query, where, onSnapshot, limit } from "firebase/firestore";
import { firestore } from "@/lib/firebase/config";
import { useAuth } from "@/lib/hooks/useAuth";

export function NotificationBell() {
  const { firebaseUser, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Only real (non-guest) accounts have a notifications inbox.
  const uid = isAuthenticated && firebaseUser ? firebaseUser.uid : null;

  useEffect(() => {
    if (!uid) return;

    // Expects a top-level "notifications" collection with userId and
    // read fields (written by Cloud Functions). Until an inbox exists
    // this simply resolves to an empty result set.
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", uid),
      where("read", "==", false),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => setUnreadCount(snap.size),
      () => setUnreadCount(0)
    );

    return unsubscribe;
  }, [uid]);

  const count = uid ? unreadCount : 0;

  return (
    <Link
      href="/notifications"
      className="relative p-2 rounded-full hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
      aria-label={
        count > 0 ? `Notifications (${count} unread)` : "Notifications"
      }
    >
      <FiBell size={20} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-result-loss text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

