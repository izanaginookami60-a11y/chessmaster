"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiMessageCircle, FiUsers } from "react-icons/fi";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  FORUM_CATEGORIES,
  fetchTopics,
  type ForumTopic,
} from "@/lib/firebase/social";

export default function ForumsPage() {
  const [latest, setLatest] = useState<ForumTopic[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all(FORUM_CATEGORIES.map((category) => fetchTopics(category.id)))
      .then((results) => {
        if (cancelled) return;
        const merged = results.flat().sort(
          (a, b) =>
            new Date(b.lastActivityAt).getTime() -
            new Date(a.lastActivityAt).getTime()
        );
        setLatest(merged.slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) setLatest([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Community"
        description="Ask questions, share games and talk chess with other players."
      />

      <section className="mb-8">
        <SectionTitle>Categories</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          {FORUM_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/forums/${category.id}`}
              className="bg-bg-secondary hover:bg-bg-hover rounded-xl p-5"
            >
              <FiUsers size={18} className="text-accent-primary mb-2" />
              <p className="font-semibold text-text-primary">
                {category.name}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Latest activity</SectionTitle>
        {latest === null ? (
          <div className="space-y-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : latest.length === 0 ? (
          <p className="text-sm text-text-secondary bg-bg-secondary rounded-xl p-4">
            No topics yet — be the first to post.
          </p>
        ) : (
          <ul className="space-y-2">
            {latest.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={`/forums/${topic.categoryId}/${topic.id}`}
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
                      {topic.authorName} · {topic.replyCount} replies
                    </p>
                  </div>
                  <span className="text-[11px] text-text-muted">
                    {topic.lastActivityAt
                      ? new Date(topic.lastActivityAt).toLocaleDateString()
                      : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
