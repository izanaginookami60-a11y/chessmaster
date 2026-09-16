"use client";

import type { BotDefinition } from "./bots";

export interface EngineMoveResult {
  from: string;
  to: string;
  promotion?: "q" | "r" | "b" | "n";
}

export interface EngineAnalysis {
  /** UCI best move, e.g. "e2e4" (null when the position is terminal). */
  bestMove: string | null;
  /** Centipawn score from WHITE's point of view. */
  cp: number | null;
  /** Mate distance from WHITE's point of view (positive = White mates). */
  mate: number | null;
  depth: number;
  /** Principal variation in UCI notation. */
  pv: string[];
}

export interface AnalyseOptions {
  depth?: number;
  moveTimeMs?: number;
}

class StockfishEngine {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  /** Serialise engine jobs — one worker can only handle one request at a time. */
  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task);
    this.queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker("/stockfish/stockfish-18-lite-single.js");
    }
    return this.worker;
  }

  private waitFor(predicate: (line: string) => boolean): Promise<string> {
    const worker = this.ensureWorker();
    return new Promise((resolve) => {
      function handleMessage(e: MessageEvent) {
        const line: string = typeof e.data === "string" ? e.data : "";
        if (predicate(line)) {
          worker.removeEventListener("message", handleMessage);
          resolve(line);
        }
      }
      worker.addEventListener("message", handleMessage);
    });
  }

  private init(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        const worker = this.ensureWorker();
        const uciOk = this.waitFor((line) => line === "uciok");
        worker.postMessage("uci");
        await uciOk;
      })();
    }
    return this.ready;
  }

  /**
   * Ask the engine for its best move in the given position, tuned to
   * the given bot's strength. Occasionally returns a random legal
   * move instead, per the bot's blunderChance, so lower-level bots
   * feel human-ish rather than just "weak Stockfish".
   */
  async getBestMove(
    fen: string,
    bot: BotDefinition,
    legalMovesUci: string[]
  ): Promise<EngineMoveResult | null> {
    return this.enqueue(() => this.runBestMove(fen, bot, legalMovesUci));
  }

  private async runBestMove(
    fen: string,
    bot: BotDefinition,
    legalMovesUci: string[]
  ): Promise<EngineMoveResult | null> {
    if (legalMovesUci.length === 0) return null;

    if (Math.random() < bot.blunderChance) {
      const random =
        legalMovesUci[Math.floor(Math.random() * legalMovesUci.length)];
      return parseUciMove(random);
    }

    await this.init();
    const worker = this.ensureWorker();

    worker.postMessage(`setoption name Skill Level value ${bot.skillLevel}`);
    worker.postMessage(`position fen ${fen}`);

    const bestMove = this.waitFor((line) => line.startsWith("bestmove"));
    worker.postMessage(`go depth ${bot.depth} movetime ${bot.moveTimeMs}`);

    const line = await bestMove;
    const uci = line.split(" ")[1]; // "bestmove e2e4 ponder ..."
    if (!uci || uci === "(none)") return null;

    return parseUciMove(uci);
  }

  /**
   * Full-strength evaluation of a position (used by the analysis board,
   * the eval bar and the hint button). Scores are reported from WHITE's
   * point of view so they can be compared across moves.
   */
  async analyse(
    fen: string,
    { depth = 14, moveTimeMs = 1200 }: AnalyseOptions = {}
  ): Promise<EngineAnalysis | null> {
    return this.enqueue(() => this.runAnalyse(fen, depth, moveTimeMs));
  }

  private async runAnalyse(
    fen: string,
    depth: number,
    moveTimeMs: number
  ): Promise<EngineAnalysis | null> {
    await this.init();
    const worker = this.ensureWorker();

    const lines: string[] = [];
    const finished = this.waitFor((line) => {
      if (line.startsWith("info")) lines.push(line);
      return line.startsWith("bestmove");
    });

    worker.postMessage("setoption name Skill Level value 20");
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go depth ${depth} movetime ${moveTimeMs}`);

    const bestLine = await finished;

    const analysis: EngineAnalysis = {
      bestMove: null,
      cp: null,
      mate: null,
      depth: 0,
      pv: [],
    };

    const uci = bestLine.split(/\s+/)[1];
    analysis.bestMove = uci && uci !== "(none)" ? uci : null;

    for (const line of lines) {
      const depthMatch = / depth (\d+)/.exec(line);
      if (depthMatch) analysis.depth = Number(depthMatch[1]);

      const cpMatch = / score cp (-?\d+)/.exec(line);
      const mateMatch = / score mate (-?\d+)/.exec(line);
      const pvMatch = / pv (.+)$/.exec(line);
      if (!cpMatch && !mateMatch) continue;

      // Scores from the engine are relative to the side to move, so
      // flip them for Black to keep everything White-relative.
      const sign = fen.split(" ")[1] === "b" ? -1 : 1;
      if (cpMatch) {
        analysis.cp = Number(cpMatch[1]) * sign;
        analysis.mate = null;
      } else if (mateMatch) {
        analysis.mate = Number(mateMatch[1]) * sign;
        analysis.cp = null;
      }
      analysis.pv = pvMatch ? pvMatch[1].split(/\s+/).slice(0, 12) : [];
    }

    return analysis;
  }

  terminate() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
  }
}

function parseUciMove(uci: string): EngineMoveResult {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: (uci[4] as "q" | "r" | "b" | "n" | undefined) ?? undefined,
  };
}

// Singleton — one engine instance per tab is enough, and re-creating a
// Worker per move would be wasteful.
export const stockfishEngine = new StockfishEngine();
