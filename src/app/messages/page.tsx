"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiMessageSquare, FiSearch } from "react-icons/fi";
import {
  PageHeader,
  EmptyState,
  SectionTitle,
} from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  fetchConversations,
  openConversation,
  type Conversation,
} from "@/lib/firebase/social";
import { findPublicProfileByUsername } from "@/lib/firebase/games";

export default function MessagesPage() {
  const router = useRouter();
  const { firebaseUser, profile, isAuthenticated, isLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[] | null>(
    null
  );
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  const uid = isAuthenticated && firebaseUser ? firebaseUser.uid : null;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    fetchConversations(uid)
      .then((rows) => {
        if (!cancelled) setConversations(rows);
      })
      .catch(() => {
        if (!cancelled) setConversations([]);
      });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  /** Start (or resume) a conversation with a player by username. */
  async function handleStart(e: FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !profile) return;

    setBusy(true);
    try {
      const other = await findPublicProfileByUsername(username.trim());
      if (!other) {
        toast.error("No player with that username.");
        return;
      }
      const conversationId = await openConversation(
        { uid: firebaseUser.uid, username: profile.username },
        { uid: other.uid, username: other.username }
      );
      setUsername("");
      router.push(`/messages/${conversationId}`);
    } catch {
      toast.error("Could not open that conversation.");
    } finally {
      setBusy(false);
    }
  }

  if (!uid) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PageHeader title="Messages" />
        <EmptyState
          title={isLoading ? "Loading…" : "Log in to send messages"}
          action={
            !isLoading ? (
              <Link
                href="/login?redirect=/messages"
                className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
              >
                Log in
              </Link>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <PageHeader
        title="Messages"
        description="Private conversations between players."
        actions={
          <Link href="/friends" className="text-xs font-medium text-accent-link">
            Friends
          </Link>
        }
      />

      <form onSubmit={handleStart} className="flex gap-2 mb-6">
        <label className="relative flex-1">
          <FiSearch
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Message a player by username"
            className="w-full bg-bg-secondary border border-bg-hover rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !username.trim()}
          className="bg-accent-primary text-bg-primary font-semibold text-sm px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Open chat
        </button>
      </form>

      <SectionTitle>Conversations</SectionTitle>
      {conversations === null ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Search for a player above, or message a friend."
        />
      ) : (
        <ul className="space-y-2">
          {conversations.map((conversation) => {
            const index = conversation.memberIds.findIndex(
              (member) => member !== uid
            );
            const otherName = conversation.memberNames[index] ?? "Player";

            return (
              <li key={conversation.id}>
                <Link
                  href={`/messages/${conversation.id}`}
                  className="flex items-center gap-3 bg-bg-secondary hover:bg-bg-hover rounded-xl px-4 py-3"
                >
                  <FiMessageSquare
                    size={16}
                    className="text-accent-primary shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {otherName}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                  </div>
                  <span className="text-[11px] text-text-muted">
                    {conversation.lastMessageAt
                      ? new Date(conversation.lastMessageAt).toLocaleDateString()
                      : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
