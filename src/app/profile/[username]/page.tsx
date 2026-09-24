"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiUserPlus, FiMessageSquare, FiZap, FiFlag } from "react-icons/fi";
import {
  PageHeader,
  EmptyState,
  SectionTitle,
} from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  findPublicProfileByUsername,
  fetchGamesForUser,
  resultLabelForPlayer,
  type GameDocument,
} from "@/lib/firebase/games";
import { openConversation, sendFriendRequest } from "@/lib/firebase/social";
import type { PublicProfile } from "@/types/user";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const { firebaseUser, profile: myProfile } = useAuth();
  const [player, setPlayer] = useState<PublicProfile | null | "missing">(null);
  const [games, setGames] = useState<GameDocument[]>([]);
  const [busy, setBusy] = useState(false);

  const username = decodeURIComponent(params.username ?? "");

  useEffect(() => {
    let cancelled = false;

    findPublicProfileByUsername(username)
      .then(async (found) => {
        if (cancelled) return;
        if (!found) {
          setPlayer("missing");
          return;
        }
        setPlayer(found);
        const rows = await fetchGamesForUser(found.uid, 8).catch(() => []);
        if (!cancelled) setGames(rows);
      })
      .catch(() => {
        if (!cancelled) setPlayer("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  async function handleAddFriend() {
    if (!firebaseUser || !myProfile || !player || player === "missing") {
      toast.error("Log in to add friends.");
      return;
    }
    setBusy(true);
    const error = await sendFriendRequest(
      { uid: firebaseUser.uid, username: myProfile.username },
      player.username
    );
    setBusy(false);
    if (error) toast.error(error);
    else toast.success("Friend request sent.");
  }

  async function handleMessage() {
    if (!firebaseUser || !myProfile || !player || player === "missing") {
      toast.error("Log in to send messages.");
      return;
    }
    setBusy(true);
    try {
      const conversationId = await openConversation(
        { uid: firebaseUser.uid, username: myProfile.username },
        { uid: player.uid, username: player.username }
      );
      router.push(`/messages/${conversationId}`);
    } catch {
      toast.error("Could not open the conversation.");
    } finally {
      setBusy(false);
    }
  }

  if (player === null) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Spinner label="Loading profile…" />
      </div>
    );
  }

  if (player === "missing") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="Player not found"
          description={`No player called “${username}”.`}
          action={
            <Link
              href="/search"
              className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
            >
              Search players
            </Link>
          }
        />
      </div>
    );
  }

  const isMe = firebaseUser?.uid === player.uid;
  const stats = player.stats ?? {};

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title={player.username}
        description={`${player.country ?? "—"} · ${
          player.skillLevel ?? "level not set"
        }`}
        actions={
          !isMe ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleAddFriend()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg disabled:opacity-50"
              >
                <FiUserPlus size={13} /> Add friend
              </button>
              <button
                onClick={() => void handleMessage()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg disabled:opacity-50"
              >
                <FiMessageSquare size={13} /> Message
              </button>
            </div>
          ) : undefined
        }
      />

      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Overall", value: player.rating },
          { label: "Bullet", value: player.ratingBullet },
          { label: "Blitz", value: player.ratingBlitz },
          { label: "Rapid", value: player.ratingRapid },
          { label: "Puzzles", value: player.ratingPuzzle },
        ].map((row) => (
          <div key={row.label} className="bg-bg-secondary rounded-xl p-4">
            <p className="text-xs text-text-secondary">{row.label}</p>
            <p className="text-xl font-bold text-text-primary">
              {row.value ?? 1200}
            </p>
          </div>
        ))}
      </section>

      <section className="grid sm:grid-cols-3 gap-3 mb-6 text-sm">
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-xs text-text-secondary">Games</p>
          <p className="font-semibold text-text-primary">
            {stats.gamesPlayed ?? 0}
          </p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-xs text-text-secondary">Wins</p>
          <p className="font-semibold text-text-primary">{stats.wins ?? 0}</p>
        </div>
        <div className="bg-bg-secondary rounded-xl p-4">
          <p className="text-xs text-text-secondary">Draws / losses</p>
          <p className="font-semibold text-text-primary">
            {stats.draws ?? 0} / {stats.losses ?? 0}
          </p>
        </div>
      </section>

      {!isMe && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/play/online"
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent-primary text-bg-primary px-3 py-2 rounded-lg"
          >
            <FiZap size={13} /> Play now
          </Link>
          <Link
            href="/play/online?tab=challenge"
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
          >
            <FiFlag size={13} /> Create a public challenge
          </Link>
        </div>
      )}

      <section>
        <SectionTitle>Recent games</SectionTitle>
        {games.length === 0 ? (
          <p className="text-sm text-text-secondary bg-bg-secondary rounded-xl p-4">
            No finished games to show yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {games.map((game) => {
              const outcome = resultLabelForPlayer(game, player.uid) ?? "draw";
              const opponent =
                game.whitePlayerId === player.uid
                  ? game.blackName
                  : game.whiteName;
              return (
                <li key={game.id}>
                  <Link
                    href={`/game/${game.id}`}
                    className="flex items-center gap-3 bg-bg-secondary hover:bg-bg-hover rounded-lg px-4 py-2.5 text-sm"
                  >
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                        outcome === "win"
                          ? "bg-result-win/20 text-result-win"
                          : outcome === "loss"
                          ? "bg-result-loss/20 text-result-loss"
                          : "bg-result-draw/20 text-result-draw"
                      }`}
                    >
                      {outcome}
                    </span>
                    <span className="text-text-secondary truncate">
                      vs {opponent} · {game.reason}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
