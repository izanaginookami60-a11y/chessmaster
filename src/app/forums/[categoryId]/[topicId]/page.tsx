"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { FiArrowLeft } from "react-icons/fi";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  createReply,
  fetchReplies,
  fetchTopic,
  type ForumReply,
  type ForumTopic,
} from "@/lib/firebase/social";

export default function ForumTopicPage() {
  const params = useParams<{ categoryId: string; topicId: string }>();
  const { firebaseUser, profile } = useAuth();
  const [topic, setTopic] = useState<ForumTopic | null | "missing">(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const { categoryId, topicId } = params;

  useEffect(() => {
    let cancelled = false;

    fetchTopic(topicId)
      .then(async (found) => {
        if (cancelled) return;
        if (!found) {
          setTopic("missing");
          return;
        }
        setTopic(found);
        const rows = await fetchReplies(topicId).catch(() => []);
        if (!cancelled) setReplies(rows);
      })
      .catch(() => {
        if (!cancelled) setTopic("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [topicId, refreshKey]);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !profile) {
      toast.error("Log in to reply.");
      return;
    }

    setBusy(true);
    try {
      await createReply(topicId, {
        authorId: firebaseUser.uid,
        authorName: profile.username,
        body,
      });
      setBody("");
      setRefreshKey((key) => key + 1);
    } catch {
      toast.error("Could not post your reply.");
    } finally {
      setBusy(false);
    }
  }

  if (topic === null) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Spinner label="Loading topic…" />
      </div>
    );
  }

  if (topic === "missing") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="Topic not found"
          description="It may have been removed."
          action={
            <Link
              href={`/forums/${categoryId}`}
              className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
            >
              Back to the category
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title={topic.title}
        description={`by ${topic.authorName} · ${new Date(
          topic.createdAt
        ).toLocaleString()}`}
        actions={
          <Link
            href={`/forums/${categoryId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-link"
          >
            <FiArrowLeft size={12} /> Back
          </Link>
        }
      />

      <article className="bg-bg-secondary rounded-xl p-5 mb-6">
        <p className="text-sm text-text-primary whitespace-pre-wrap">
          {topic.body}
        </p>
      </article>

      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary mb-3">
        {replies.length} {replies.length === 1 ? "reply" : "replies"}
      </h2>

      <ul className="space-y-3 mb-6">
        {replies.map((reply) => (
          <li key={reply.id} className="bg-bg-secondary rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1">
              {reply.authorName} · {new Date(reply.createdAt).toLocaleString()}
            </p>
            <p className="text-sm text-text-primary whitespace-pre-wrap">
              {reply.body}
            </p>
          </li>
        ))}
      </ul>

      <form onSubmit={handleReply} className="bg-bg-secondary rounded-xl p-4">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={
            firebaseUser ? "Write a reply" : "Log in to reply"
          }
          rows={3}
          required
          disabled={!firebaseUser}
          className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary mb-2 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !firebaseUser || !body.trim()}
          className="text-xs font-semibold bg-accent-primary text-bg-primary px-3 py-2 rounded-lg disabled:opacity-50"
        >
          {busy ? "Posting…" : "Post reply"}
        </button>
      </form>
    </div>
  );
}
