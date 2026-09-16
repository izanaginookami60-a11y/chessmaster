"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { GameViewer, GameViewerSkeleton } from "@/components/game/GameViewer";
import { useGame } from "@/lib/hooks/useGame";

export default function GamePage() {
  const params = useParams<{ gameId: string }>();
  const { game, loading, error } = useGame(params.gameId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PageHeader
        title="Game"
        description="Replay every move, then send it to the analysis board."
        actions={
          <Link
            href="/analysis"
            className="text-xs font-medium text-accent-link"
          >
            All your games
          </Link>
        }
      />

      {loading ? (
        <GameViewerSkeleton />
      ) : !game ? (
        <p className="text-sm text-text-secondary bg-bg-secondary rounded-xl p-6">
          {error ?? "That game could not be found."}
        </p>
      ) : (
        <GameViewer game={game} />
      )}
    </div>
  );
}
