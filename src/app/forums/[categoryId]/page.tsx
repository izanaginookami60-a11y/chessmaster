"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { FiArrowLeft, FiMessageCircle, FiPlus } from "react-icons/fi";
import {
  PageHeader,
  EmptyState,
  SectionTitle,
} from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  FORUM_CATEGORIES,
  createTopic,
  fetchTopics,
  type ForumTopic,
} from "@/lib/firebase/social";

export default function ForumCategoryPage() {
  const params = useParams<{ categoryId: string }>();
  const { firebaseUser, profile } = useAuth();
  const [topics, setTopics] = useState<ForumTopic[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const categoryId = params.categoryId;
  const category = FORUM_CATEGORIES.find((entry) => entry.id === categoryId);

  useEffect(() => {
    let cancelled = false;

    fetchTopics(categoryId)
      .then((rows) => {
        if (!cancelled) setTopics(rows);
      })
      .catch(() => {
        if (!cancelled) setTopics([]);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId, refreshKey]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !profile) {
      toast.error("Log in to post a topic.");
      return;
    }

    setBusy(true);
    try {
      await createTopic({
        categoryId,
        title,
        body,
        authorId: firebaseUser.uid,
        authorName: profile.username,
      });
      setTitle("");
      setBody("");
      setOpen(false);
      toast.success("Topic posted.");
      setRefreshKey((key) => key + 1);
    } catch {
      toast.error("Could not post the topic.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title={category?.name ?? "Forum"}
        description={category?.description}
        actions={
          <Link
            href="/forums"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-link"
          >
            <FiArrowLeft size={12} /> All categories
          </Link>
        }
      />

      <button
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent-primary text-bg-primary px-3 py-2 rounded-lg mb-5"
      >
        <FiPlus size={13} /> New topic
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="bg-bg-secondary rounded-xl p-4 mb-6">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Topic title"
            maxLength={140}
            required
            className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary mb-2"
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share your question or idea"
            rows={4}
            required
            className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary mb-2"
          />
          <button
            type="submit"
            disabled={busy}
            className="text-xs font-semibold bg-accent-primary text-bg-primary px-3 py-2 rounded-lg disabled:opacity-50"
          >
            {busy ? "Posting…" : "Post topic"}
          </button>
        </form>
      )}

      <SectionTitle>Topics</SectionTitle>
      {topics === null ? (
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : topics.length === 0 ? (
        <EmptyState
          title="No topics in this category yet"
          description="Start the conversation."
        />
      ) : (
        <ul className="space-y-2">
          {topics.map((topic) => (
            <li key={topic.id}>
              <Link
                href={`/forums/${categoryId}/${topic.id}`}
                className="flex items-start gap-3 bg-bg-secondary hover:bg-bg-hover rounded-xl px-4 py-3"
              >
                <FiMessageCircle
                  size={15}
                  className="text-accent-primary mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {topic.title}
                  </p>
                  <p className="text-xs text-text-secondary">
                    by {topic.authorName} · {topic.replyCount} replies
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
