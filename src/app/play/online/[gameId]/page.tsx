"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiFlag, FiRefreshCw, FiUsers, FiShare2 } from "react-icons/fi";
import { ChessBoard } from "@/components/board/ChessBoard";
import { PlayerInfoBar } from "@/components/game/PlayerInfoBar";
import { ClockBadge } from "@/components/game/ClockBadge";
import { GameChat } from "@/components/game/GameChat";
import { ThinkingIndicator } from "@/components/game/ThinkingIndicator";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBoardWidth } from "@/lib/hooks/useBoardWidth";
import { useLiveClock } from "@/lib/hooks/useLiveClock";
import { useLiveGame } from "@/lib/hooks/useLiveGame";
import {
  closeLiveGame,
  finishLiveGame,
  joinLiveGame,
  offerDraw,
  pushMove,
  setFirestoreGameId,
  type LiveResult,
} from "@/lib/online/liveGames";
import { saveCompletedGame, submitOnlineResult } from "@/lib/firebase/games";
import type { ChessBoardHandle, MoveHistoryEntry } from "@/lib/chess/types";
import { START_FEN } from "@/lib/chess/pgn";

export default function OnlineGamePage() {
  const params = useParams<{ gameId: string }>();
  const router = useRouter();
  const { firebaseUser, profile, isAuthenticated } = useAuth();
  const { game, loading, error } = useLiveGame(params.gameId);
  const boardRef = useRef<ChessBoardHandle>(null);
  const boardWidth = useBoardWidth({ max: 480 });
  const [joining, setJoining] = useState(false);
  const appliedRef = useRef(0);
  const savedRef = useRef(false);
  const [copied, setCopied] = useState(false);

  const uid = firebaseUser?.uid ?? null;
  const myColor: "w" | "b" | null = game
    ? game.whitePlayerId === uid
      ? "w"
      : game.blackPlayerId === uid
      ? "b"
      : null
    : null;
  const isParticipant = myColor !== null;

  const clocks = useLiveClock(game, (loser) => {
    if (!game || !isParticipant) return;
    void reportResult(loser === "w" ? "black" : "white", "timeout");
  });

  // Apply the opponent's moves as they arrive.
  useEffect(() => {
    if (!game || !boardRef.current || !isParticipant) return;
    const moves = game.moves ?? {};
    for (let i = appliedRef.current + 1; i <= game.moveCount; i++) {
      const move = moves[String(i)];
      if (!move) break;
      if (move.byUid !== uid) {
        boardRef.current.makeMove(move.from, move.to, move.promotion);
      }
      appliedRef.current = i;
    }
  }, [game, uid, isParticipant]);

  // The player who joins creates the Firestore record for the game.
  useEffect(() => {
    if (!game || game.firestoreGameId || game.status !== "playing") return;
    if (game.blackPlayerId !== uid) return;

    let cancelled = false;
    void (async () => {
      try {
        const id = await saveCompletedGame({
          whitePlayerId: game.whitePlayerId,
          blackPlayerId: game.blackPlayerId as string,
          whiteName: game.whiteName,
          blackName: game.blackName ?? "Player",
          isBotGame: false,
          isOnline: true,
          result: "draw", // placeholder; replaced by submitOnlineResult
          reason: "in progress",
          rated: game.rated,
          timeControl: String(Math.round(game.initialMs / 1000)),
          moves: [],
          finalFen: START_FEN,
        });
        if (!cancelled) await setFirestoreGameId(game.gameId, id);
      } catch {
        // Saving is best-effort: the game itself still works.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [game, uid]);

  /**
   * Report the final result. The Realtime Database node is updated first
   * (so both players see the ending immediately), then the Firestore
   * record is finalised through the trusted `submitGameResult` callable.
   */
  async function reportResult(result: LiveResult, reason: string) {
    if (!game || !isParticipant || game.status === "finished") return;

    try {
      await finishLiveGame(game.gameId, result, reason);
    } catch {
      toast.error("Could not finish the game. Please refresh.");
      return;
    }

    if (savedRef.current || !game.firestoreGameId) return;
    savedRef.current = true;

    const history = boardRef.current?.getMoveHistory() ?? [];
    try {
      await submitOnlineResult({
        gameId: game.firestoreGameId,
        result,
        reason,
        finalFen: boardRef.current?.getFen() ?? game.fen,
        moves: history.map((entry) => ({ san: entry.san, color: entry.color })),
      });
    } catch {
      toast.error("The result could not be saved to your game history.");
    }
  }

  function handleMove(entry: MoveHistoryEntry, fenAfter: string) {
    if (!game || !uid || !myColor) return;

    const nextCount = appliedRef.current + 1;
    appliedRef.current = nextCount;

    const myRemaining = myColor === "w" ? clocks.whiteMs : clocks.blackMs;
    const bumped = Math.round(myRemaining + game.incrementMs);
    const nextClocks =
      myColor === "w"
        ? { whiteMs: bumped, blackMs: clocks.blackMs }
        : { whiteMs: clocks.whiteMs, blackMs: bumped };

    void pushMove(game.gameId, {
      move: {
        san: entry.san,
        from: entry.from,
        to: entry.to,
        promotion: entry.promotion,
        color: entry.color,
        fen: fenAfter,
        byUid: uid,
        at: Date.now(),
      },
      moveCount: nextCount,
      clocks: nextClocks,
    }).catch(() => {
      // Roll the move back so both boards stay in sync.
      boardRef.current?.undoMove();
      appliedRef.current = Math.max(0, appliedRef.current - 1);
      toast.error("That move could not be sent. Try again.");
    });
  }

  function handleGameEnd(result: "win" | "loss" | "draw", reason: string) {
    if (!myColor) return;
    const liveResult: LiveResult =
      result === "draw"
        ? "draw"
        : result === "win"
        ? myColor === "w"
          ? "white"
          : "black"
        : myColor === "w"
        ? "black"
        : "white";
    void reportResult(liveResult, reason);
  }

  async function handleJoinGame() {
    if (!uid || !profile || !game) return;
    setJoining(true);
    try {
      await joinLiveGame(game.gameId, {
        uid,
        name: profile.username,
        rating: profile.rating,
      });
    } catch {
      toast.error("Could not join that game.");
    } finally {
      setJoining(false);
    }
  }

  async function handleDrawOffer() {
    if (!game || !uid) return;
    await offerDraw(game.gameId, uid).catch(() =>
      toast.error("Could not send the draw offer.")
    );
  }

  async function handleDrawResponse(accept: boolean) {
    if (!game) return;
    await offerDraw(game.gameId, null).catch(() => undefined);
    if (accept) await reportResult("draw", "draw agreed");
  }

  async function handleLeave() {
    if (game && game.status === "waiting" && game.whitePlayerId === uid) {
      await closeLiveGame(game.gameId).catch(() => undefined);
    }
    router.push("/play/online");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  const isPlayersTurn =
    !!game && game.status === "playing" && game.turn === myColor;
  const myName = myColor === "w" ? game?.whiteName : game?.blackName;
  const opponentName =
    myColor === "w"
      ? game?.blackName ?? "Waiting for an opponent"
      : game?.whiteName ?? "Opponent";
  const drawOfferFromOpponent =
    !!game?.drawOfferBy && game.drawOfferBy !== uid && game.status === "playing";
  const iOfferedDraw = !!game?.drawOfferBy && game.drawOfferBy === uid;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Spinner label="Loading game…" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-text-primary mb-4">
          {error ?? "That game is no longer available."}
        </p>
        <Link
          href="/play/online"
          className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
        >
          Back to the lobby
        </Link>
      </div>
    );
  }

  const waitingForOpponent = game.status === "waiting";
  const spectator = !isParticipant && game.status !== "waiting";
  const shareLink = typeof window !== "undefined" ? window.location.href : "";

  function playerBarFor(color: "w" | "b") {
    const name = color === "w" ? game?.whiteName : game?.blackName;
    const rating = color === "w" ? game?.whiteRating : game?.blackRating;
    const clockValue = color === "w" ? clocks.whiteMs : clocks.blackMs;
    const active =
      game?.status === "playing" && game.turn === color && !!game.lastMoveAt;

    return (
      <PlayerInfoBar
        avatar={
          <div className="w-10 h-10 rounded-full bg-bg-hover text-text-primary font-bold flex items-center justify-center">
            {(name ?? "?").charAt(0).toUpperCase()}
          </div>
        }
        name={name ?? "Waiting…"}
        rating={rating ? `${rating} ELO` : "Unrated"}
        clock={<ClockBadge ms={clockValue} active={active} />}
        thinkingIndicator={
          active && !isPlayersTurn && name ? <ThinkingIndicator /> : null
        }
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-xl font-bold text-text-primary">
          {spectator
            ? "Watching a live game"
            : waitingForOpponent
            ? "Waiting for an opponent"
            : "Online game"}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void copyLink()}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
          >
            <FiShare2 size={13} /> {copied ? "Link copied" : "Copy link"}
          </button>
          <button
            onClick={() => void handleLeave()}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
          >
            <FiUsers size={13} /> Lobby
          </button>
        </div>
      </div>

      {waitingForOpponent && (
        <div className="mb-4 bg-bg-secondary rounded-xl p-4 text-sm text-text-secondary">
          <p className="mb-2">
            {isParticipant
              ? "Share this link, or wait here — anyone who opens it can take the Black pieces."
              : "This challenge hasn't started yet."}
          </p>
          <code className="block text-xs bg-bg-primary rounded px-3 py-2 text-text-primary break-all">
            {shareLink}
          </code>
          {!isParticipant && (
            <button
              onClick={() => void handleJoinGame()}
              disabled={joining || !isAuthenticated}
              className="mt-3 inline-flex items-center gap-2 bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {joining ? "Joining…" : "Play as Black"}
            </button>
          )}
        </div>
      )}

      {game.status === "finished" && (
        <div className="mb-4 bg-accent-primary/10 text-accent-primary rounded-lg px-3 py-2 text-sm">
          Game over — {game.result === "draw" ? "draw" : `${game.result} wins`} by{" "}
          {game.reason}.
          {game.firestoreGameId && isParticipant && (
            <>
              {" "}
              <Link href={`/game/${game.firestoreGameId}`} className="underline">
                Review the game
              </Link>
            </>
          )}
        </div>
      )}

      {drawOfferFromOpponent && (
        <div className="mb-4 flex flex-wrap items-center gap-3 bg-bg-secondary rounded-lg px-3 py-2 text-sm text-text-primary">
          {opponentName} offers a draw.
          <button
            onClick={() => void handleDrawResponse(true)}
            className="text-xs font-semibold bg-accent-primary text-bg-primary px-3 py-1.5 rounded-lg"
          >
            Accept
          </button>
          <button
            onClick={() => void handleDrawResponse(false)}
            className="text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            Decline
          </button>
        </div>
      )}

      {iOfferedDraw && (
        <p className="mb-4 text-xs text-text-secondary bg-bg-secondary rounded-lg px-3 py-2">
          Draw offered — waiting for {opponentName} to answer.
        </p>
      )}

      {spectator && (
        <p className="mb-4 text-xs text-text-secondary">
          You are watching this game live.
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-5">
        <div>
          <div className="mb-3">{playerBarFor("b")}</div>

          {game.status === "playing" ? (
            <ChessBoard
              ref={boardRef}
              allowedColor={myColor ?? "both"}
              isPlayersTurn={isPlayersTurn}
              initialOrientation="white"
              boardWidth={boardWidth}
              readOnly={spectator}
              onMove={handleMove}
              onGameEnd={handleGameEnd}
            />
          ) : (
            <Skeleton className="w-[480px] max-w-full aspect-square" />
          )}

          <div className="mt-3">{playerBarFor("w")}</div>

          {isParticipant && game.status === "playing" && (
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() =>
                  void reportResult(
                    myColor === "w" ? "black" : "white",
                    "resignation"
                  )
                }
                className="inline-flex items-center gap-1.5 text-xs font-medium text-result-loss bg-bg-secondary hover:bg-bg-hover px-3 py-2 rounded-lg"
              >
                <FiFlag size={14} /> Resign
              </button>
              <button
                onClick={() => void handleDrawOffer()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-bg-secondary hover:bg-bg-hover px-3 py-2 rounded-lg"
              >
                <FiRefreshCw size={14} /> Offer draw
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="bg-bg-secondary rounded-xl p-4 text-sm text-text-secondary">
            <p className="text-text-primary font-semibold mb-1">
              {Math.round(game.initialMs / 60000)} min
              {game.incrementMs > 0
                ? ` + ${Math.round(game.incrementMs / 1000)}s`
                : ""}{" "}
              · {game.rated ? "rated" : "casual"}
            </p>
            <p>
              {spectator
                ? "You are watching this game. Open a challenge to play."
                : `You are playing ${myColor === "w" ? "White" : "Black"}.`}
            </p>
          </div>

          <GameChat
            gameId={game.gameId}
            uid={uid}
            name={myName ?? profile?.username ?? "Guest"}
          />
        </div>
      </div>

    </div>
  );
}

