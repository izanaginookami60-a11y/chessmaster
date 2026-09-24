"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { FiBell, FiCheck } from "react-icons/fi";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/hooks/useAuth";
import { firestore } from "@/lib/firebase/config";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  gameId?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const { firebaseUser, isAuthenticated, isLoading } = useAuth();
  const [items, setItems] = useState<Notification[] | null>(null);

  const uid = isAuthenticated && firebaseUser ? firebaseUser.uid : null;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    getDocs(
      query(
        collection(firestore, "notifications"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(50)
      )
    )
      .then((snap) => {
        if (cancelled) return;
        setItems(
          snap.docs.map((row) => ({ ...row.data(), id: row.id }) as Notification)
        );
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  async function markRead(id: string) {
    await updateDoc(doc(firestore, "notifications", id), { read: true });
    setItems((current) =>
      (current ?? []).map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );
  }

  async function markAllRead() {
    const unread = (items ?? []).filter((item) => !item.read);
    await Promise.all(
      unread.map((item) =>
        updateDoc(doc(firestore, "notifications", item.id), { read: true })
      )
    );
    setItems((current) =>
      (current ?? []).map((item) => ({ ...item, read: true }))
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <PageHeader
        title="Notifications"
        description="Game results, friend activity and anything else worth knowing."
        actions={
          (items ?? []).some((item) => !item.read) ? (
            <button
              onClick={() => void markAllRead()}
              className="text-xs font-medium text-accent-link"
            >
              Mark all as read
            </button>
          ) : undefined
        }
      />

      {!uid ? (
        <EmptyState
          title={isLoading ? "Loading…" : "Log in to see your notifications"}
          action={
            !isLoading ? (
              <Link
                href="/login?redirect=/notifications"
                className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
              >
                Log in
              </Link>
            ) : undefined
          }
        />
      ) : items === null ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Play a rated game and the result will show up here."
          action={
            <Link
              href="/play"
              className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
            >
              Play a game
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex items-start gap-3 rounded-xl px-4 py-3 ${
                item.read ? "bg-bg-secondary/60" : "bg-bg-secondary"
              }`}
            >
              <FiBell
                size={16}
                className={`mt-0.5 shrink-0 ${
                  item.read ? "text-text-muted" : "text-accent-primary"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {item.title}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {item.body}
                </p>
                <p className="text-[11px] text-text-muted mt-1">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString()
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {item.gameId && (
                  <Link
                    href={`/game/${item.gameId}`}
                    className="text-xs font-medium bg-bg-primary hover:bg-bg-hover text-text-primary px-2.5 py-1.5 rounded-lg"
                  >
                    Review
                  </Link>
                )}
                {!item.read && (
                  <button
                    onClick={() => void markRead(item.id)}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary"
                    aria-label="Mark as read"
                  >
                    <FiCheck size={14} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {uid && items === null && <Spinner className="mt-4" />}
    </div>
  );
}
