"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { FiArrowLeft, FiCheck, FiPlus, FiZap } from "react-icons/fi";
import {
  PageHeader,
  EmptyState,
  SectionTitle,
} from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  fetchTournament,
  toggleTournamentRegistration,
  type Tournament,
} from "@/lib/firebase/social";

export default function TournamentPage() {
  const params = useParams<{ tournamentId: string }>();
  const { firebaseUser, profile } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null | "missing">(
    null
  );
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const tournamentId = params.tournamentId;

  useEffect(() => {
    let cancelled = false;

    fetchTournament(tournamentId)
      .then((found) => {
        if (!cancelled) setTournament(found ?? "missing");
      })
      .catch(() => {
        if (!cancelled) setTournament("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [tournamentId, refreshKey]);

  async function handleRegister() {
    if (!firebaseUser || !profile || !tournament || tournament === "missing") {
      toast.error("Log in to register.");
      return;
    }
    setBusy(true);
    try {
      const playing = await toggleTournamentRegistration(tournament, {
        uid: firebaseUser.uid,
        username: profile.username,
      });
      toast.success(playing ? "You are registered." : "Registration removed.");
      setRefreshKey((key) => key + 1);
    } catch {
      toast.error("Could not update your registration.");
    } finally {
      setBusy(false);
    }
  }

  if (tournament === null) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Spinner label="Loading tournament…" />
      </div>
    );
  }

  if (tournament === "missing") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="Tournament not found"
          action={
            <Link
              href="/tournaments"
              className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
            >
              All tournaments
            </Link>
          }
        />
      </div>
    );
  }

  const registered = firebaseUser
    ? tournament.playerIds.includes(firebaseUser.uid)
    : false;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title={tournament.name}
        description={tournament.description}
        actions={
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            <FiArrowLeft size={12} /> Tournaments
          </Link>
        }
      />

      <section className="grid sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-xs text-text-secondary">Format</p>
          <p className="font-semibold text-text-primary capitalize">
            {tournament.format}
          </p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-xs text-text-secondary">Time control</p>
          <p className="font-semibold text-text-primary">
            {Math.round(tournament.timeControlSeconds / 60)} min
          </p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-xs text-text-secondary">Starts</p>
          <p className="font-semibold text-text-primary text-sm">
            {new Date(tournament.startAt).toLocaleString()}
          </p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-xs text-text-secondary">Players</p>
          <p className="font-semibold text-text-primary">
            {tournament.playerIds.length}
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => void handleRegister()}
          disabled={busy}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50 ${
            registered
              ? "bg-bg-secondary text-result-loss hover:bg-bg-hover"
              : "bg-accent-primary text-bg-primary"
          }`}
        >
          {registered ? (
            <>
              <FiCheck size={13} /> Registered — withdraw
            </>
          ) : (
            <>
              <FiPlus size={13} /> Register
            </>
          )}
        </button>
        <Link
          href="/play/online"
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
        >
          <FiZap size={13} /> Warm up with a rated game
        </Link>
      </div>

      <section>
        <SectionTitle>Players</SectionTitle>
        {tournament.playerNames.length === 0 ? (
          <p className="text-sm text-text-secondary bg-bg-secondary rounded-xl p-4">
            Nobody has registered yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tournament.playerNames.map((name, index) => (
              <Link
                key={`${name}-${index}`}
                href={`/profile/${name}`}
                className="text-xs bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-1.5 rounded-full"
              >
                {name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-text-muted mt-8">
        Games are played as normal online games: pair up from the{" "}
        <Link href="/play/online" className="text-accent-link">
          online lobby
        </Link>{" "}
        and the results feed your rating as usual.
      </p>
    </div>
  );
}
