"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiUsers, FiPlus } from "react-icons/fi";
import {
  PageHeader,
  EmptyState,
  SectionTitle,
} from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClub, fetchClubs, type Club } from "@/lib/firebase/social";

export default function ClubsPage() {
  const router = useRouter();
  const { firebaseUser, profile } = useAuth();
  const [clubs, setClubs] = useState<Club[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchClubs()
      .then((rows) => {
        if (!cancelled) setClubs(rows);
      })
      .catch(() => {
        if (!cancelled) setClubs([]);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !profile) {
      toast.error("Log in to create a club.");
      return;
    }

    setBusy(true);
    try {
      const clubId = await createClub({
        name,
        description,
        uid: firebaseUser.uid,
        username: profile.username,
      });
      toast.success("Club created.");
      setRefreshKey((key) => key + 1);
      router.push(`/clubs/${clubId}`);
    } catch {
      toast.error("Could not create the club.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Clubs"
        description="Groups of players with their own board and announcements."
      />

      <button
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent-primary text-bg-primary px-3 py-2 rounded-lg mb-5"
      >
        <FiPlus size={13} /> New club
      </button>

      {open && (
        <form onSubmit={handleCreate} className="bg-bg-secondary rounded-xl p-4 mb-6">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Club name"
            maxLength={60}
            required
            className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary mb-2"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this club about?"
            rows={3}
            className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary mb-2"
          />
          <button
            type="submit"
            disabled={busy}
            className="text-xs font-semibold bg-accent-primary text-bg-primary px-3 py-2 rounded-lg disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create club"}
          </button>
        </form>
      )}

      <SectionTitle>All clubs</SectionTitle>
      {clubs === null ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : clubs.length === 0 ? (
        <EmptyState
          title="No clubs yet"
          description="Create the first one and invite your friends."
        />
      ) : (
        <ul className="space-y-2">
          {clubs.map((club) => (
            <li key={club.id}>
              <Link
                href={`/clubs/${club.id}`}
                className="flex items-center gap-3 bg-bg-secondary hover:bg-bg-hover rounded-xl px-4 py-3"
              >
                <FiUsers size={16} className="text-accent-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {club.name}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {club.description || "No description"}
                  </p>
                </div>
                <span className="text-xs text-text-muted">
                  {club.memberIds.length} members
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
