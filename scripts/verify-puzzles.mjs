/**
 * Verification script for the bundled puzzle set.
 *
 * Every puzzle must satisfy:
 *   1. the FEN is a legal position,
 *   2. each solution move is legal in the resulting position,
 *   3. for `mate` puzzles the final position is checkmate,
 *   4. for `material` puzzles the first move is a capture.
 *
 * Run with:  node scripts/verify-puzzles.mjs
 */

import { readFileSync } from "node:fs";
import { Chess } from "../node_modules/chess.js/dist/esm/chess.js";

const puzzles = JSON.parse(
  readFileSync(new URL("../src/lib/puzzles/puzzles.json", import.meta.url), "utf8")
);

let failures = 0;

for (const puzzle of puzzles) {
  const problems = [];
  let game;

  try {
    game = new Chess(puzzle.fen);
  } catch (error) {
    problems.push(`illegal FEN: ${error.message}`);
  }

  if (game) {
    let firstMove = null;
    for (const uci of puzzle.moves) {
      let move = null;
      try {
        move = game.move({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: uci[4] ?? undefined,
        });
      } catch (error) {
        problems.push(`illegal move ${uci}: ${error.message}`);
        break;
      }
      if (!move) {
        problems.push(`illegal move ${uci}`);
        break;
      }
      firstMove = firstMove ?? move;
    }

    if (problems.length === 0) {
      if (puzzle.type === "mate" && !game.isCheckmate()) {
        problems.push("expected the final position to be checkmate");
      }
      if (puzzle.type === "material" && !firstMove?.captured) {
        problems.push("expected the first move to win material (a capture)");
      }
    }
  }

  if (problems.length > 0) {
    failures += 1;
    console.error(`✗ ${puzzle.id}: ${problems.join("; ")}`);
  } else {
    console.log(`✓ ${puzzle.id} (${puzzle.themes.join(", ")})`);
  }
}

console.log(
  `\n${puzzles.length - failures}/${puzzles.length} puzzles verified.`
);
process.exit(failures === 0 ? 0 : 1);
