"use client";

import {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Chess, type Square, type Color as ChessColor } from "chess.js";
import { Chessboard } from "react-chessboard";
import { BOARD_THEMES } from "@/lib/chess/boardThemes";
import { PIECE_THEMES } from "@/lib/chess/pieceThemes";
import { soundManager } from "@/lib/chess/soundManager";
import type {
  BoardThemeName,
  PieceThemeName,
  MoveHistoryEntry,
  PendingPremove,
  BoardArrow,
  ChessBoardHandle,
} from "@/lib/chess/types";
import { PromotionModal } from "./PromotionModal";
import { ArrowOverlay } from "./ArrowOverlay";
import { BoardControls } from "./BoardControls";
import { MoveList } from "./MoveList";
import { CapturedPieces } from "./CapturedPieces";
import { computeMaterial } from "@/lib/chess/material";
import { useBoardSettingsStore } from "@/lib/store/boardSettingsStore";

export interface ChessBoardProps {
  /** Starting position. Defaults to the standard start position. */
  initialFen?: string;
  /** Which side(s) the LOCAL user is allowed to move.
   *  'both' is used for local pass-and-play / freeplay testing. */
  allowedColor?: ChessColor | "both";
  /** Whether it is currently the local user's turn to move for real
   *  (as opposed to queuing a premove). Bot/online modes pass this in;
   *  freeplay defaults to always true. */
  isPlayersTurn?: boolean;
  /** Fired after every successful move (both normal and premove-executed). */
  onMove?: (entry: MoveHistoryEntry, fenAfter: string) => void;
  /** Fired when the game ends (checkmate, draw, stalemate, etc). */
  onGameEnd?: (result: "win" | "loss" | "draw", reason: string) => void;
  boardWidth?: number;
  className?: string;
  /** Hide the built-in move list panel (e.g. when the page renders its
   *  own layout around a bigger move list / game sidebar). */
  hideMoveList?: boolean;
  /** Which side starts at the bottom of the board. Defaults to white. */
  initialOrientation?: "white" | "black";
  /** Pre-played moves (SAN) replayed on mount — used by game viewers and
   *  the analysis board to load a finished game. */
  initialMoves?: string[];
  /** Disable all user interaction (used by replay/spectator views). */
  readOnly?: boolean;
  /** When set, only these UCI moves are accepted from the user (used by
   *  puzzle mode). Empty/undefined = all legal moves allowed. */
  allowedMovesUci?: string[];
  /** Called when the user attempts a move that is legal in the current
   *  position but not in `allowedMovesUci`. */
  onIllegalAllowedMove?: () => void;
}

export const ChessBoard = forwardRef<ChessBoardHandle, ChessBoardProps>(
  function ChessBoard(
    {
      initialFen,
      allowedColor = "both",
      isPlayersTurn = true,
      onMove,
      onGameEnd,
      boardWidth = 480,
      className,
      hideMoveList = false,
      initialOrientation = "white",
      initialMoves,
      readOnly = false,
      allowedMovesUci,
      onIllegalAllowedMove,
    },
    ref
  ) {
    const gameRef = useRef(new Chess(initialFen));
    const [fen, setFen] = useState(gameRef.current.fen());
    const [history, setHistory] = useState<MoveHistoryEntry[]>([]);
    const [viewIndex, setViewIndex] = useState(-1); // -1 = live position
    const [orientation, setOrientation] = useState<"white" | "black">(
      initialOrientation
    );
    const [showCoordinatesState, setShowCoordinates] = useState(true);
    const [boardTheme, setBoardThemeState] = useState<BoardThemeName>("green");
    const [pieceTheme, setPieceThemeState] = useState<PieceThemeName>("neo");
    const [mutedState, setMuted] = useState(false);

    // Board preferences live in a persisted store so they survive
    // navigation/refresh; local state mirrors it until hydration.
    const storedBoardTheme = useBoardSettingsStore((s) => s.boardTheme);
    const storedPieceTheme = useBoardSettingsStore((s) => s.pieceTheme);
    const storedCoordinates = useBoardSettingsStore((s) => s.showCoordinates);
    const storedMuted = useBoardSettingsStore((s) => s.muted);
    const hydrated = useBoardSettingsStore((s) => s.hydrated);
    const hydrateSettings = useBoardSettingsStore((s) => s.hydrate);
    const persistBoardTheme = useBoardSettingsStore((s) => s.setBoardTheme);
    const persistPieceTheme = useBoardSettingsStore((s) => s.setPieceTheme);
    const persistCoordinates = useBoardSettingsStore((s) => s.toggleCoordinates);
    const persistMuted = useBoardSettingsStore((s) => s.toggleMuted);

    useEffect(() => {
      hydrateSettings();
    }, [hydrateSettings]);

    useEffect(() => {
      if (!hydrated) return;
      setBoardThemeState(storedBoardTheme);
      setPieceThemeState(storedPieceTheme);
      setShowCoordinates(storedCoordinates);
      setMuted(storedMuted);
    }, [hydrated, storedBoardTheme, storedPieceTheme, storedCoordinates, storedMuted]);

    const setBoardTheme = (theme: BoardThemeName) => {
      setBoardThemeState(theme);
      persistBoardTheme(theme);
    };
    const setPieceTheme = (theme: PieceThemeName) => {
      setPieceThemeState(theme);
      persistPieceTheme(theme);
    };
    const toggleCoordinates = () => {
      setShowCoordinates((v) => !v);
      persistCoordinates();
    };
    const toggleMuted = () => {
      setMuted((v) => !v);
      persistMuted();
    };
    const showCoordinates = showCoordinatesState;
    const muted = mutedState;

    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [legalTargets, setLegalTargets] = useState<Square[]>([]);
    const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
      null
    );
    const [pendingPromotion, setPendingPromotion] = useState<{
      from: Square;
      to: Square;
    } | null>(null);
    const [premove, setPremove] = useState<PendingPremove | null>(null);
    const [arrows, setArrows] = useState<BoardArrow[]>([]);
    const arrowStartRef = useRef<Square | null>(null);
    const [gameStarted, setGameStarted] = useState(false);

    useEffect(() => {
      soundManager.setMuted(muted);
    }, [muted]);

    // Announce game start once, on mount
    useEffect(() => {
      if (!gameStarted) {
        soundManager.play("gameStart");
        setGameStarted(true);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isViewingLive = viewIndex === history.length - 1 || history.length === 0;
    const displayFen = isViewingLive
      ? fen
      : viewIndex === -1
      ? new Chess(initialFen).fen()
      : history[viewIndex].fen;

    const material = useMemo(() => {
      // Material/captured pieces are always based on the LIVE game, not
      // whichever historical position is being viewed. `fen` is a
      // deliberate recompute trigger (the game object itself is mutable).
      return computeMaterial(gameRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fen]);

    function playSoundForMove(
      move: ReturnType<Chess["move"]>,
      game: Chess
    ) {
      if (game.isCheckmate()) {
        soundManager.play("check");
      } else if (game.inCheck()) {
        soundManager.play("check");
      } else if (move.flags.includes("k") || move.flags.includes("q")) {
        soundManager.play("castle");
      } else if (move.promotion) {
        soundManager.play("promote");
      } else if (move.captured) {
        soundManager.play("capture");
      } else {
        soundManager.play("move");
      }
    }

    function checkGameEnd(game: Chess) {
      if (!game.isGameOver()) return;

      if (game.isCheckmate()) {
        // Checkmate
        const winner: ChessColor = game.turn() === "w" ? "b" : "w";
        soundManager.play(
          winner === "w" ? "gameEndWin" : "gameEndLoss"
        );
        onGameEnd?.(
          allowedColor === "both" || allowedColor === winner ? "win" : "loss",
          "checkmate"
        );
      } else {
        soundManager.play("gameEndDraw");
        const reason = game.isStalemate()
          ? "stalemate"
          : game.isThreefoldRepetition()
          ? "threefold repetition"
          : game.isInsufficientMaterial()
          ? "insufficient material"
          : game.isDrawByFiftyMoves()
          ? "fifty-move rule"
          : "draw";
        onGameEnd?.("draw", reason);
      }
    }

    const commitMove = useCallback(
      (from: Square, to: Square, promotion?: "q" | "r" | "b" | "n") => {
        const game = gameRef.current;
        const move = game.move({ from, to, promotion });
        if (!move) return false;

        const newFen = game.fen();
        const entry: MoveHistoryEntry = {
          san: move.san,
          fen: newFen,
          moveNumber: Math.ceil(game.moveNumber() ?? 0),
          color: move.color,
          captured: move.captured,
          from,
          to,
          isCheck: game.inCheck(),
          isCheckmate: game.isCheckmate(),
          isCastle: move.flags.includes("k") || move.flags.includes("q"),
          isPromotion: !!move.promotion,
          promotion: move.promotion as "q" | "r" | "b" | "n" | undefined,
        };

        playSoundForMove(move, game);

        setHistory((prev) => {
          const next = [...prev, entry];
          setViewIndex(next.length - 1);
          return next;
        });
        setFen(newFen);
        setLastMove({ from, to });
        setSelectedSquare(null);
        setLegalTargets([]);
        setArrows([]);

        onMove?.(entry, newFen);
        checkGameEnd(game);

        return true;
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [onMove, onGameEnd, allowedColor]
    );

    // Try to execute a queued premove once it becomes the player's turn
    useEffect(() => {
      if (isPlayersTurn && premove) {
        const ok = commitMove(premove.from, premove.to, premove.promotion);
        if (!ok) soundManager.play("illegal");
        setPremove(null);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlayersTurn]);

    function isMyPieceTurn(square: Square): boolean {
      const piece = gameRef.current.get(square);
      if (!piece) return false;
      if (allowedColor !== "both" && piece.color !== allowedColor) return false;
      return true;
    }

    function attemptMove(from: Square, to: Square): boolean {
      const game = gameRef.current;
      const piece = game.get(from);
      if (!piece) return false;

      // Never let a player move their opponent's pieces (this also stops
      // premoves being queued on the opponent's behalf).
      if (allowedColor !== "both" && piece.color !== allowedColor) {
        soundManager.play("illegal");
        return false;
      }

      // Puzzle mode: the move must be one of the accepted solutions.
      if (allowedMovesUci && allowedMovesUci.length > 0) {
        const legal = game
          .moves({ square: from, verbose: true })
          .filter((m) => m.to === to);
        if (legal.length === 0) {
          soundManager.play("illegal");
          return false;
        }
        const matches = legal.some((m) =>
          allowedMovesUci.includes(
            `${m.from}${m.to}${m.promotion ?? ""}`
          )
        );
        if (!matches && !legal.some((m) => m.promotion)) {
          // Non-promotion move that isn't in the solution list.
          soundManager.play("illegal");
          onIllegalAllowedMove?.();
          return false;
        }
      }

      // Queue as a premove if it isn't actually the player's turn yet
      if (!isPlayersTurn) {
        const needsPromotion =
          piece.type === "p" && (to[1] === "8" || to[1] === "1");
        setPremove({
          from,
          to,
          promotion: needsPromotion ? "q" : undefined,
        });
        setSelectedSquare(null);
        setLegalTargets([]);
        return true;
      }

      const needsPromotion =
        piece.type === "p" && (to[1] === "8" || to[1] === "1");
      if (needsPromotion) {
        // Verify the move is at least pseudo-legal before opening the modal
        const legal = game
          .moves({ square: from, verbose: true })
          .some((m) => m.to === to);
        if (!legal) {
          soundManager.play("illegal");
          return false;
        }
        setPendingPromotion({ from, to });
        return true;
      }

      const ok = commitMove(from, to);
      if (!ok) soundManager.play("illegal");
      return ok;
    }

    function handleSquareClick(square: Square) {
      if (pendingPromotion || readOnly || !isViewingLive) return;

      // Clicking a friendly piece (re)selects it
      if (isMyPieceTurn(square)) {
        setSelectedSquare(square);
        const moves = gameRef.current
          .moves({ square, verbose: true })
          .map((m) => m.to as Square);
        setLegalTargets(moves);
        return;
      }

      // Clicking a destination with a piece already selected
      if (selectedSquare) {
        const success = attemptMove(selectedSquare, square);
        if (!success) {
          setSelectedSquare(null);
          setLegalTargets([]);
        }
        return;
      }
    }

    function handlePieceDrop({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
      piece: { pieceType: string };
    }): boolean {
      if (!targetSquare || pendingPromotion || readOnly || !isViewingLive)
        return false;
      return attemptMove(sourceSquare as Square, targetSquare as Square);
    }

    function handlePromotionSelect(piece: "q" | "r" | "b" | "n") {
      if (!pendingPromotion) return;
      const ok = commitMove(pendingPromotion.from, pendingPromotion.to, piece);
      if (!ok) soundManager.play("illegal");
      setPendingPromotion(null);
    }

    // Right-click-drag arrow drawing, implemented independently so it
    // works regardless of the underlying board library's own arrow API.
    function handleSquareRightClick({ square }: { square: string }) {
      if (readOnly) return;
      if (!arrowStartRef.current) {
        arrowStartRef.current = square as Square;
        return;
      }
      const from = arrowStartRef.current;
      const to = square as Square;
      arrowStartRef.current = null;

      if (from === to) {
        setArrows((prev) =>
          prev.some((a) => a.from === from && a.to === to)
            ? prev.filter((a) => !(a.from === from && a.to === to))
            : prev
        );
        return;
      }

      setArrows((prev) => {
        const exists = prev.some((a) => a.from === from && a.to === to);
        if (exists) {
          return prev.filter((a) => !(a.from === from && a.to === to));
        }
        return [...prev, { from, to, color: "green" }];
      });
    }

    const flipBoard = useCallback(() => {
      setOrientation((o) => (o === "white" ? "black" : "white"));
    }, []);

    const resetBoard = useCallback((newFen?: string) => {
      gameRef.current = new Chess(newFen);
      setFen(gameRef.current.fen());
      setHistory([]);
      setViewIndex(-1);
      setLastMove(null);
      setSelectedSquare(null);
      setLegalTargets([]);
      setArrows([]);
      setPremove(null);
      soundManager.play("gameStart");
    }, []);

    // Replay a finished game into the board (viewer / analysis mode).
    const initialMovesKey = initialMoves ? initialMoves.join(" ") : "";
    useEffect(() => {
      if (!initialMovesKey) return;

      const game = new Chess(initialFen);
      const entries: MoveHistoryEntry[] = [];

      for (const san of initialMovesKey.split(" ")) {
        let move;
        try {
          move = game.move(san);
        } catch {
          break;
        }
        if (!move) break;

        entries.push({
          san: move.san,
          fen: game.fen(),
          moveNumber: game.moveNumber(),
          color: move.color,
          captured: move.captured,
          from: move.from,
          to: move.to,
          isCheck: game.inCheck(),
          isCheckmate: game.isCheckmate(),
          isCastle: move.flags.includes("k") || move.flags.includes("q"),
          isPromotion: !!move.promotion,
          promotion: move.promotion as "q" | "r" | "b" | "n" | undefined,
        });
      }

      gameRef.current = game;
      setFen(game.fen());
      setHistory(entries);
      setViewIndex(entries.length - 1);
      const last = entries[entries.length - 1];
      setLastMove(last ? { from: last.from, to: last.to } : null);
    }, [initialMovesKey, initialFen]);

    const undoMove = useCallback(() => {
      gameRef.current.undo();
      setFen(gameRef.current.fen());
      setHistory((prev) => {
        const next = prev.slice(0, -1);
        setViewIndex(next.length - 1);
        // Keep the "last move" highlight in sync with the undone position
        // instead of leaving a stale highlight behind.
        const previous = next[next.length - 1];
        setLastMove(previous ? { from: previous.from, to: previous.to } : null);
        return next;
      });
      setSelectedSquare(null);
      setLegalTargets([]);
      setPendingPromotion(null);
      setPremove(null);
      setArrows([]);
      soundManager.play("move");
    }, []);

    const makeMove = useCallback(
      (from: string, to: string, promotion?: "q" | "r" | "b" | "n") => {
        return commitMove(from as Square, to as Square, promotion);
      },
      [commitMove]
    );

    const getLegalMovesUci = useCallback(() => {
      return gameRef.current.moves({ verbose: true }).map((m) => {
        const promo = m.promotion ? m.promotion : "";
        return `${m.from}${m.to}${promo}`;
      });
    }, []);

    const getFen = useCallback(() => gameRef.current.fen(), []);

    const goToMove = useCallback((index: number) => {
      const lastPly = gameRef.current.history().length - 1;
      setViewIndex(Math.max(-1, Math.min(index, lastPly)));
    }, []);

    const historyRef = useRef<MoveHistoryEntry[]>([]);
    useEffect(() => {
      historyRef.current = history;
    }, [history]);
    const getMoveHistory = useCallback(() => historyRef.current, []);

    useImperativeHandle(
      ref,
      () => ({
        flipBoard,
        resetBoard,
        undoMove,
        makeMove,
        getLegalMovesUci,
        getFen,
        getMoveHistory,
        goToMove,
      }),
      [
        flipBoard,
        resetBoard,
        undoMove,
        makeMove,
        getLegalMovesUci,
        getFen,
        getMoveHistory,
        goToMove,
      ]
    );

    // Build square highlight styles: legal-move dots, last-move, check,
    // selected square, and queued premove.
    const squareStyles = useMemo(() => {
      const styles: Record<string, React.CSSProperties> = {};

      if (lastMove) {
        styles[lastMove.from] = {
          ...(styles[lastMove.from] || {}),
          backgroundColor: "rgba(246, 246, 105, 0.5)",
        };
        styles[lastMove.to] = {
          ...(styles[lastMove.to] || {}),
          backgroundColor: "rgba(246, 246, 105, 0.5)",
        };
      }

      if (selectedSquare) {
        styles[selectedSquare] = {
          ...(styles[selectedSquare] || {}),
          backgroundColor: "rgba(20, 85, 30, 0.35)",
        };
      }

      legalTargets.forEach((sq) => {
        const isCapture = !!gameRef.current.get(sq);
        styles[sq] = {
          ...(styles[sq] || {}),
          backgroundImage: isCapture
            ? "radial-gradient(circle, transparent 55%, rgba(0,0,0,0.15) 58%)"
            : "radial-gradient(circle, rgba(0,0,0,0.15) 19%, transparent 20%)",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        };
      });

      if (isViewingLive && gameRef.current.inCheck()) {
        const kingSquare = findKingSquare(gameRef.current, gameRef.current.turn());
        if (kingSquare) {
          styles[kingSquare] = {
            ...(styles[kingSquare] || {}),
            backgroundColor: "rgba(255, 0, 0, 0.45)",
          };
        }
      }

      if (premove) {
        styles[premove.from] = {
          ...(styles[premove.from] || {}),
          backgroundColor: "rgba(0, 102, 204, 0.35)",
        };
        styles[premove.to] = {
          ...(styles[premove.to] || {}),
          backgroundColor: "rgba(0, 102, 204, 0.35)",
        };
      }

      return styles;
      // `fen` is a deliberate recompute trigger — the highlights must be
      // rebuilt whenever the live position changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastMove, selectedSquare, legalTargets, isViewingLive, premove, fen]);

    const theme = BOARD_THEMES[boardTheme];
    const pieceFx = PIECE_THEMES[pieceTheme];

    const options = {
      position: displayFen,
      onPieceDrop: handlePieceDrop,
      onSquareClick: ({ square }: { square: string }) =>
        handleSquareClick(square as Square),
      onSquareRightClick: handleSquareRightClick,
      boardOrientation: orientation,
      showNotation: showCoordinates,
      animationDurationInMs: 200,
      squareStyles,
      darkSquareStyle: { backgroundColor: theme.dark },
      lightSquareStyle: { backgroundColor: theme.light },
      allowDragging: isViewingLive && !readOnly,
      // Only the local player's own pieces can be picked up — this is
      // what stops accidental premoves on the opponent's pieces.
      canDragPiece: ({ square }: { square: string | null }) => {
        if (!square || readOnly) return false;
        const piece = gameRef.current.get(square as Square);
        if (!piece) return false;
        if (allowedColor === "both") return true;
        return piece.color === allowedColor;
      },
    };

    return (
      <div className={className}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div>
            <CapturedPieces
              capturedColor="b"
              pieces={material.capturedByWhite}
              advantage={
                material.advantage > 0 ? material.advantage : undefined
              }
            />

            <div
              className="relative"
              style={{
                width: boardWidth,
                height: boardWidth,
                filter: pieceFx.filter,
                imageRendering: pieceFx.imageRendering,
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <Chessboard options={options} />
              <ArrowOverlay
                arrows={arrows}
                boardSize={boardWidth}
                orientation={orientation}
              />
              {pendingPromotion && (
                <PromotionModal
                  color={gameRef.current.turn() === "w" ? "w" : "b"}
                  onSelect={handlePromotionSelect}
                  onCancel={() => setPendingPromotion(null)}
                />
              )}
            </div>

            <CapturedPieces
              capturedColor="w"
              pieces={material.capturedByBlack}
              advantage={
                material.advantage < 0 ? -material.advantage : undefined
              }
            />

            <BoardControls
              onFlip={flipBoard}
              showCoordinates={showCoordinates}
              onToggleCoordinates={toggleCoordinates}
              boardTheme={boardTheme}
              onBoardThemeChange={setBoardTheme}
              pieceTheme={pieceTheme}
              onPieceThemeChange={setPieceTheme}
              muted={muted}
              onToggleMuted={toggleMuted}
            />
          </div>

          {!hideMoveList && (
            <div className="w-full lg:w-56 shrink-0">
              <MoveList
                history={history}
                viewIndex={viewIndex}
                onNavigate={setViewIndex}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
);

function findKingSquare(game: Chess, color: ChessColor): Square | null {
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = board[r][f];
      if (sq && sq.type === "k" && sq.color === color) {
        return sq.square as Square;
      }
    }
  }
  return null;
}
