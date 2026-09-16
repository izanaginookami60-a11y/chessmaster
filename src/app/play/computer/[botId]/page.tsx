"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChessBoard } from "@/components/board/ChessBoard";
import { BotAvatar } from "@/components/bot/BotAvatar";
import { PlayerInfoBar } from "@/components/game/PlayerInfoBar";
import { GameControls } from "@/components/game/GameControls";
import { ThinkingIndicator } from "@/components/game/ThinkingIndicator";
import { ClockBadge } from "@/components/game/ClockBadge";
import { getBotById } from "@/lib/chess/bots";
import { stockfishEngine } from "@/lib/chess/stockfishEngine";
import { parseTimeControl } from "@/lib/chess/clock";
import { useChessClock } from "@/lib/hooks/useChessClock";
import { useBoardWidth } from "@/lib/hooks/useBoardWidth";
import { uciToSan } from "@/lib/chess/uci";
import { formatEval } from "@/lib/chess/analysis";
import { randomChance } from "@/lib/utils/random";
import { saveCompletedGame } from "@/lib/firebase/games";
import { useAuth } from "@/lib/hooks/useAuth";
import type { ChessBoardHandle, MoveHistoryEntry } from "@/lib/chess/types";

type GameOverState = {
  result: "win" | "loss" | "draw";
  reason: string;
} | null;

export default function PlayComputerGamePage() {
  const params = useParams<{ botId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { firebaseUser, profile, isGuest } = useAuth();

  const bot = getBotById(params.botId);
  const playerColor = (searchParams.get("color") ?? "white") as
    | "white"
    | "black";
  const timeControl = searchParams.get("time") ?? "unlimited";
  const rated = searchParams.get("rated") !== "false";

  const boardRef = useRef<ChessBoardHandle>(null);
  const [turn, setTurn] = useState<"w" | "b">("w");
  const [botThinking, setBotThinking] = useState(false);
  const [gameOver, setGameOver] = useState<GameOverState>(null);
  const [movesPlayed, setMovesPlayed] = useState<
    Array<Pick<MoveHistoryEntry, "san" | "color">>
  >([]);
  const [drawOffered, setDrawOffered] = useState(false);
  const savedRef = useRef(false);
  const boardWidth = useBoardWidth({ max: 480 });
  const clockConfig = useMemo(
    () => parseTimeControl(timeControl),
    [timeControl]
  );

  const playerColorCode = playerColor === "white" ? "w" : "b";
  const botColorCode = playerColor === "white" ? "b" : "w";
  const isPlayersTurn = turn === playerColorCode && !gameOver;

  const requestBotMove = useCallback(async () => {
    if (!bot || !boardRef.current || gameOver) return;
    setBotThinking(true);
    try {
      const fen = boardRef.current.getFen();
      const legalMoves = boardRef.current.getLegalMovesUci();
      const result = await stockfishEngine.getBestMove(fen, bot, legalMoves);
      if (result) {
        boardRef.current.makeMove(result.from, result.to, result.promotion);
      }
    } catch {
      toast.error("The bot had trouble thinking. Please try again.");
    } finally {
      setBotThinking(false);
    }
  }, [bot, gameOver]);

  // If the player chose Black, the bot (White) must move first.
  useEffect(() => {
    if (botColorCode === "w") {
      requestBotMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever it becomes the bot's turn, ask the engine to move.
  useEffect(() => {
    if (turn === botColorCode && !gameOver) {
      requestBotMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn]);

  function handleMove(entry: MoveHistoryEntry, fenAfter: string) {
    setMovesPlayed((prev) => [...prev, { san: entry.san, color: entry.color }]);
    const activeColor = fenAfter.split(" ")[1] as "w" | "b";
    setTurn(activeColor);
    // Hand the clock to the opponent (and add the increment).
    if (clockConfig) clock.onMovePlayed();
  }

  async function persistGame(
    result: "win" | "loss" | "draw",
    reason: string
  ) {
    if (savedRef.current || !bot) return;
    savedRef.current = true;

    const playerId = firebaseUser?.uid ?? "guest";
    const playerName = isGuest
      ? "Guest"
      : profile?.username ?? firebaseUser?.displayName ?? "Player";

    const outcomeForColor: "white" | "black" | "draw" =
      result === "draw" ? "draw" : result === "win" ? playerColor : playerColor === "white" ? "black" : "white";

    try {
      await saveCompletedGame({
        whitePlayerId: playerColor === "white" ? playerId : `bot_${bot.id}`,
        blackPlayerId: playerColor === "black" ? playerId : `bot_${bot.id}`,
        whiteName: playerColor === "white" ? playerName : bot.name,
        blackName: playerColor === "black" ? playerName : bot.name,
        isBotGame: true,
        botId: bot.id,
        result: outcomeForColor,
        reason,
        rated: rated && !isGuest,
        timeControl,
        moves: movesPlayed,
        finalFen: boardRef.current?.getFen() ?? "",
      });
    } catch {
      // Non-fatal — the game already finished from the player's
      // perspective even if the save fails.
      toast.error("Couldn't save this game to your history.");
    }
  }

  function handleGameEnd(result: "win" | "loss" | "draw", reason: string) {
    setGameOver({ result, reason });
    clock.pause();
    persistGame(result, reason);
  }

  function handleFlag(loser: "w" | "b") {
    if (!bot || gameOver) return;
    const result = loser === playerColorCode ? "loss" : "win";
    setGameOver({ result, reason: "timeout" });
    persistGame(result, "timeout");
    toast(
      loser === playerColorCode
        ? "You ran out of time."
        : `${bot.name} ran out of time.`,
      { icon: "⏱️" }
    );
  }

  function handleResign() {
    if (gameOver) return;
    clock.pause();
    setGameOver({ result: "loss", reason: "resignation" });
    persistGame("loss", "resignation");
    toast("You resigned.", { icon: "🏳️" });
  }

  function handleOfferDraw() {
    if (gameOver || !bot) return;
    setDrawOffered(true);

    void offerDrawToBot(bot);
  }

  /**
   * Ask the engine whether the bot should accept a draw: if the position
   * is within ~0.6 pawns of equal, weaker bots say yes; stronger bots
   * only accept when they are not better off playing on.
   */
  async function offerDrawToBot(activeBot: NonNullable<typeof bot>) {
    let acceptChance = 0.25;

    try {
      const fen = boardRef.current?.getFen();
      if (fen) {
        const analysis = await stockfishEngine.analyse(fen, {
          depth: 12,
          moveTimeMs: 700,
        });
        const cp = analysis?.mate !== null && analysis?.mate !== undefined
          ? analysis.mate > 0
            ? 10000
            : -10000
          : analysis?.cp ?? 0;
        const botPov = botColorCode === "w" ? cp : -cp;

        // Behind or equal → happy to take the draw; clearly better → no.
        if (botPov >= 150) acceptChance = 0;
        else if (botPov >= 50) acceptChance = 0.15;
        else acceptChance = 0.85;
      }
    } catch {
      // Engine unavailable — fall back to the strength-based guess.
      acceptChance = activeBot.level <= 6 ? 0.35 : 0.1;
    }

    setDrawOffered(false);
    if (randomChance(acceptChance)) {
      clock.pause();
      setGameOver({ result: "draw", reason: "draw agreed" });
      persistGame("draw", "draw agreed");
      toast.success(`${activeBot.name} accepted your draw offer.`);
    } else {
      toast(`${activeBot.name} declined the draw offer.`);
    }
  }

  function handleUndo() {
    // Undo is only offered in unclocked games: rewinding a live clock
    // would desynchronise the timers.
    if (gameOver || botThinking || clockConfig) return;
    // Undo both the player's and the bot's last move so it's the
    // player's turn again.
    boardRef.current?.undoMove();
    boardRef.current?.undoMove();
    setTurn(playerColorCode);
  }

  async function handleHint() {
    if (!bot || gameOver) return;
    const fen = boardRef.current?.getFen();
    if (!fen) return;

    const hintToast = toast.loading("Looking for a good move…");
    try {
      const analysis = await stockfishEngine.analyse(fen, {
        depth: 14,
        moveTimeMs: 1200,
      });
      const san = analysis?.bestMove ? uciToSan(fen, analysis.bestMove) : null;

      if (!san) {
        toast.error("No suggestion available in this position.", {
          id: hintToast,
        });
        return;
      }

      const evalText = formatEval(analysis?.cp ?? 0, analysis?.mate ?? null);
      toast(`Hint: ${san} (${evalText})`, { id: hintToast, icon: "💡" });
    } catch {
      toast.error("The engine is unavailable right now.", { id: hintToast });
    }
  }

  function handleNewGame() {
    router.push("/play/computer");
  }

  // ---- Clock ---------------------------------------------------------
  // White always moves first, and the hook hands the clock over after
  // every move (including the bot's).
  const clock = useChessClock({
    config: clockConfig,
    initialTurn: "w",
    onFlag: handleFlag,
  });

  if (!bot) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-text-primary">Bot not found.</p>
      </div>
    );
  }

  const playerName = isGuest
    ? "Guest"
    : profile?.username ?? firebaseUser?.displayName ?? "Player";
  const playerRating = isGuest ? "Unrated" : profile?.rating ?? 1200;

  const topIsBot = playerColor === "white"; // bot shown on top when player is white (bot = black at top)

  const whiteClock = clockConfig ? (
    <ClockBadge ms={clock.state.whiteMs} active={clock.state.active === "w"} />
  ) : undefined;
  const blackClock = clockConfig ? (
    <ClockBadge ms={clock.state.blackMs} active={clock.state.active === "b"} />
  ) : undefined;

  const botBar = (
    <PlayerInfoBar
      avatar={<BotAvatar bot={bot} size={40} />}
      name={bot.name}
      rating={`${bot.elo} ELO`}
      thinkingIndicator={botThinking ? <ThinkingIndicator /> : null}
      clock={botColorCode === "w" ? whiteClock : blackClock}
    />
  );

  const playerBar = (
    <PlayerInfoBar
      avatar={
        <div className="w-10 h-10 rounded-full bg-accent-primary text-bg-primary font-bold flex items-center justify-center">
          {playerName.charAt(0).toUpperCase()}
        </div>
      }
      name={playerName}
      rating={playerRating}
      clock={playerColorCode === "w" ? whiteClock : blackClock}
    />
  );


  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-3">{topIsBot ? botBar : playerBar}</div>

      {gameOver && (
        <div className="mb-3 text-sm bg-accent-primary/10 text-accent-primary rounded-lg px-3 py-2">
          Game over — {gameOver.result} by {gameOver.reason}.
        </div>
      )}
      {drawOffered && (
        <div className="mb-3 text-sm bg-bg-secondary text-text-secondary rounded-lg px-3 py-2">
          Waiting for {bot.name} to respond to your draw offer...
        </div>
      )}

      <ChessBoard
        ref={boardRef}
        allowedColor={playerColorCode}
        isPlayersTurn={isPlayersTurn}
        initialOrientation={playerColor}
        boardWidth={boardWidth}
        onMove={handleMove}
        onGameEnd={handleGameEnd}
      />

      <div className="mt-3 mb-4">{topIsBot ? playerBar : botBar}</div>

      <GameControls
        onResign={handleResign}
        onOfferDraw={handleOfferDraw}
        onUndo={handleUndo}
        onNewGame={handleNewGame}
        onHint={handleHint}
        canUndo={!clockConfig && movesPlayed.length >= 2 && !botThinking}
        gameOver={!!gameOver}
      />
    </div>
  );
}
