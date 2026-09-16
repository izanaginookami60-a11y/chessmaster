"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { GameViewer, GameViewerSkeleton } from "@/components/game/GameViewer";
import { useGame } from "@/lib/hooks/useGame";

export default function AnalysisGamePage() {
  const params = useParams<{ gameId: string }>();
  const { game, loading, error } = useGame(params.gameId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PageHeader
        title="Game review"
        description="Step through the game, compare with the engine and see where it turned."
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
        <GameViewer game={game} analysisMode />
      )}
    </div>
  );
}
