"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiSearch, FiX } from "react-icons/fi";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { searchPlayers } from "@/lib/firebase/games";
import type { PublicProfile } from "@/types/user";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Spinner label="Searching…" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const term = (searchParams.get("q") ?? "").trim();
  const [results, setResults] = useState<PublicProfile[] | null>(null);

  useEffect(() => {
    if (!term) return;
    let cancelled = false;

    searchPlayers(term, 20)
      .then((rows) => {
        if (!cancelled) setResults(rows);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      });

    return () => {
      cancelled = true;
    };
  }, [term]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title={term ? `Search: “${term}”` : "Search"}
        description="Find players by username."
        actions={
          <Link href="/friends" className="text-xs font-medium text-accent-link">
            Friends
          </Link>
        }
      />

      {!term ? (
        <EmptyState
          title="Type a username to search"
          description="Use the search bar at the top of the page."
        />
      ) : results === null ? (
        <Spinner label="Searching players…" />
      ) : results.length === 0 ? (
        <EmptyState
          title="No players matched"
          description="Check the spelling, or try a shorter prefix. Player search needs the publicProfiles index deployed."
        />
      ) : (
        <ul className="space-y-2">
          {results.map((player) => (
            <li key={player.uid}>
              <Link
                href={`/profile/${player.username}`}
                className="flex items-center gap-3 bg-bg-secondary hover:bg-bg-hover rounded-xl px-4 py-3"
              >
                <FiSearch size={15} className="text-accent-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {player.username}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {player.country ?? "—"} · rating {player.rating ?? 1200}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {term && (
        <p className="text-xs text-text-muted mt-4 flex items-center gap-1">
          <FiX size={12} /> Player search matches the beginning of a username.
        </p>
      )}
    </div>
  );
}
