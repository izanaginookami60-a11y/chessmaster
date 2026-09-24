"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiCalendar, FiPlus } from "react-icons/fi";
import {
  PageHeader,
  EmptyState,
  SectionTitle,
} from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  createTournament,
  fetchTournaments,
  type Tournament,
} from "@/lib/firebase/social";

const TIME_CONTROLS = [
  { value: 180, label: "3 min" },
  { value: 300, label: "5 min" },
  { value: 600, label: "10 min" },
];

export default function TournamentsPage() {
  const router = useRouter();
  const { firebaseUser, profile } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [name, setName] = useState("");
  const [timeControl, setTimeControl] = useState(300);
  const [startAt, setStartAt] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchTournaments()
      .then((rows) => {
        if (!cancelled) setTournaments(rows);
      })
      .catch(() => {
        if (!cancelled) setTournaments([]);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !profile) {
      toast.error("Log in to create a tournament.");
      return;
    }
    if (!startAt) {
      toast.error("Pick a start time.");
      return;
    }

    setBusy(true);
    try {
      const id = await createTournament({
        name,
        description: "Arena tournament — play as many rated games as you can.",
        format: "arena",
        timeControlSeconds: timeControl,
        startAt: new Date(startAt).toISOString(),
        uid: firebaseUser.uid,
        username: profile.username,
      });
      toast.success("Tournament created.");
      setRefreshKey((key) => key + 1);
      router.push(`/tournaments/${id}`);
    } catch {
      toast.error("Could not create the tournament.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Tournaments"
        description="Arena events where every game counts towards the standings."
      />

      <button
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent-primary text-bg-primary px-3 py-2 rounded-lg mb-5"
      >
        <FiPlus size={13} /> Create tournament
      </button>

      {open && (
        <form
          onSubmit={handleCreate}
          className="bg-bg-secondary rounded-xl p-4 mb-6 grid gap-2"
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tournament name"
            maxLength={80}
            required
            className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={timeControl}
              onChange={(event) => setTimeControl(Number(event.target.value))}
              className="bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary"
            >
              {TIME_CONTROLS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
              className="bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="justify-self-start text-xs font-semibold bg-accent-primary text-bg-primary px-3 py-2 rounded-lg disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </form>
      )}

      <SectionTitle>Upcoming and running</SectionTitle>
      {tournaments === null ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : tournaments.length === 0 ? (
        <EmptyState
          title="No tournaments yet"
          description="Create one and invite the community."
        />
      ) : (
        <ul className="space-y-2">
          {tournaments.map((tournament) => (
            <li key={tournament.id}>
              <Link
                href={`/tournaments/${tournament.id}`}
                className="flex items-center gap-3 bg-bg-secondary hover:bg-bg-hover rounded-xl px-4 py-3"
              >
                <FiCalendar size={16} className="text-accent-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {tournament.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {tournament.format} ·{" "}
                    {Math.round(tournament.timeControlSeconds / 60)} min ·{" "}
                    {new Date(tournament.startAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs text-text-muted">
                  {tournament.playerIds.length} players
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
