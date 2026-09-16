"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { FiClock, FiX, FiPlus, FiZap } from "react-icons/fi";
import {
  PageHeader,
  SectionTitle,
  EmptyState,
} from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useMatchmaking } from "@/lib/hooks/useMatchmaking";
import {
  createLiveGame,
  joinLiveGame,
  subscribeOpenGames,
  type LiveGame,
} from "@/lib/online/liveGames";
import { parseTimeControl } from "@/lib/chess/clock";
import { START_FEN } from "@/lib/chess/pgn";

const TIME_CONTROLS = [
  { value: "60", label: "1 min", tag: "Bullet" },
  { value: "180", label: "3 min", tag: "Blitz" },
  { value: "300", label: "5 min", tag: "Blitz" },
  { value: "600", label: "10 min", tag: "Rapid" },
  { value: "900", label: "15 min", tag: "Rapid" },
];

export default function PlayOnlinePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Spinner label="Loading lobby…" />
        </div>
      }
    >
      <OnlineLobby />
    </Suspense>
  );
}

function OnlineLobby() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser, profile, isAuthenticated, isGuest, isLoading } =
    useAuth();
  const { searching, pairing, error, start, cancel, clear } = useMatchmaking();

  const [time, setTime] = useState(searchParams.get("time") ?? "600");
  const [rated, setRated] = useState(searchParams.get("rated") !== "0");
  const [openGames, setOpenGames] = useState<LiveGame[]>([]);
  const [busy, setBusy] = useState(false);

  const uid = isAuthenticated && firebaseUser ? firebaseUser.uid : null;
  const canPlayRated = isAuthenticated && !!profile?.isVerified;

  useEffect(() => {
    const unsubscribe = subscribeOpenGames(setOpenGames);
    return unsubscribe;
  }, []);

  // A pairing arrives when matchmaking finds an opponent.
  useEffect(() => {
    if (!pairing) return;
    router.push(`/play/online/${pairing.gameId}`);
  }, [pairing, router]);

  function currentSettings() {
    const config = parseTimeControl(time);
    return {
      initialMs: config ? config.initialMs : 30 * 60 * 1000,
      incrementMs: config ? config.incrementMs : 0,
      rated: rated && canPlayRated,
    };
  }

  async function handleFindOpponent() {
    if (!isAuthenticated || !profile) {
      toast.error("Log in to play online.");
      return;
    }
    await start(currentSettings());
  }

  async function handleCreateChallenge(isPrivate: boolean) {
    if (!uid || !profile) {
      toast.error("Log in to create a challenge.");
      return;
    }

    setBusy(true);
    try {
      const settings = currentSettings();
      const gameId = await createLiveGame({
        whitePlayerId: uid,
        whiteName: profile.username,
        whiteRating: profile.rating,
        initialMs: settings.initialMs,
        incrementMs: settings.incrementMs,
        rated: settings.rated,
        isPrivate,
        startFen: START_FEN,
      });
      await clear();
      router.push(`/play/online/${gameId}?color=white`);
    } catch {
      toast.error("Could not create the challenge.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(game: LiveGame) {
    if (!uid || !profile) {
      toast.error("Log in to join a challenge.");
      return;
    }
    setBusy(true);
    try {
      await joinLiveGame(game.gameId, {
        uid,
        name: profile.username,
        rating: profile.rating,
      });
      await clear();
      router.push(`/play/online/${game.gameId}?color=black`);
    } catch {
      toast.error("That challenge is no longer available.");
      setBusy(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader
        title="Play online"
        description="Get paired with a player near your rating, or challenge the lobby."
        actions={
          <Link href="/watch" className="text-xs font-medium text-accent-link">
            Watch live games
          </Link>
        }
      />

      {isGuest && (
        <p className="mb-4 text-xs text-accent-secondary bg-accent-secondary/10 rounded-lg px-3 py-2">
          You are playing as a guest — games are unrated and won&apos;t be saved
          to a profile.
        </p>
      )}

      <section className="bg-bg-secondary rounded-xl p-5 mb-6">
        <SectionTitle>Time control</SectionTitle>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {TIME_CONTROLS.map((tc) => (
            <button
              key={tc.value}
              onClick={() => setTime(tc.value)}
              disabled={searching}
              className={`rounded-lg px-4 py-3 text-left border disabled:opacity-60 ${
                time === tc.value
                  ? "border-accent-primary bg-accent-primary/10"
                  : "border-bg-hover bg-bg-primary hover:bg-bg-hover"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold text-text-primary">
                <FiClock size={14} className="text-text-secondary" />
                {tc.label}
              </span>
              <span className="text-xs text-text-secondary">{tc.tag}</span>
            </button>
          ))}
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-text-secondary mb-5">
          <input
            type="checkbox"
            checked={rated && canPlayRated}
            disabled={!canPlayRated || searching}
            onChange={() => setRated((v) => !v)}
            className="accent-accent-primary"
          />
          Rated game
          {!canPlayRated && (
            <span className="text-xs text-text-muted">
              (verify your email to play rated)
            </span>
          )}
        </label>

        {searching ? (
          <div className="flex flex-wrap items-center gap-4">
            <Spinner label="Looking for an opponent…" />
            <button
              onClick={() => void cancel()}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-primary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
            >
              <FiX size={13} /> Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void handleFindOpponent()}
              disabled={isLoading || busy}
              className="inline-flex items-center gap-2 bg-accent-primary text-bg-primary font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50"
            >
              <FiZap size={16} /> Find opponent
            </button>
            <button
              onClick={() => void handleCreateChallenge(false)}
              disabled={busy || isLoading}
              className="inline-flex items-center gap-2 border border-bg-hover text-text-primary font-medium px-5 py-2.5 rounded-lg hover:bg-bg-hover disabled:opacity-50"
            >
              <FiPlus size={16} /> Public challenge
            </button>
            <button
              onClick={() => void handleCreateChallenge(true)}
              disabled={busy || isLoading}
              className="text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-50"
            >
              Private game (link only)
            </button>
          </div>
        )}

        {error && <p className="text-xs text-result-loss mt-3">{error}</p>}
      </section>

      <section>
        <SectionTitle>Open challenges</SectionTitle>
        {openGames.length === 0 ? (
          <EmptyState
            title="No open challenges right now"
            description="Create one, or use Find opponent for an automatic pairing."
          />
        ) : (
          <ul className="space-y-2">
            {openGames.map((game) => (
              <li
                key={game.gameId}
                className="flex items-center gap-3 bg-bg-secondary rounded-xl px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-primary truncate">
                    {game.whiteName}{" "}
                    <span className="text-text-muted">({game.whiteRating})</span>
                  </p>
                  <p className="text-xs text-text-secondary">
                    {Math.round(game.initialMs / 60000)} min
                    {game.incrementMs > 0
                      ? ` + ${Math.round(game.incrementMs / 1000)}s`
                      : ""}{" "}
                    · {game.rated ? "rated" : "casual"}
                  </p>
                </div>
                <button
                  onClick={() => void handleJoin(game)}
                  disabled={busy || game.whitePlayerId === uid}
                  className="text-xs font-medium bg-accent-primary text-bg-primary px-3 py-1.5 rounded-lg disabled:opacity-40"
                >
                  {game.whitePlayerId === uid ? "Your challenge" : "Play"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );

}
