/**
 * Verification script for bundled chess content.
 *
 *   1. Every puzzle must have a legal FEN, legal solution moves, and the
 *      right final state (mate for `mate`, a capture for `material`).
 *   2. Every opening line and every lesson section line must be legal SAN
 *      from its starting position.
 *
 * Run with:  node scripts/verify-content.mjs
 */

import { readFileSync } from "node:fs";
import { Chess } from "../node_modules/chess.js/dist/esm/chess.js";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

let failures = 0;

function fail(label, message) {
  failures += 1;
  console.error(`✗ ${label}: ${message}`);
}

function checkLine(label, moves, fen) {
  const game = new Chess(fen);
  for (const san of moves) {
    let move = null;
    try {
      move = game.move(san);
    } catch (error) {
      fail(label, `illegal move ${san} (${error.message})`);
      return false;
    }
    if (!move) {
      fail(label, `illegal move ${san}`);
      return false;
    }
  }
  console.log(`✓ ${label}`);
  return true;
}

// ---------------------------------------------------------------- puzzles
const puzzles = JSON.parse(read("src/lib/puzzles/puzzles.json"));

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
    fail(`puzzle ${puzzle.id}`, problems.join("; "));
  } else {
    console.log(`✓ puzzle ${puzzle.id}`);
  }
}

// --------------------------------------------------------------- openings
const openingsSource = read("src/lib/openings/openings.ts");
const openingLines = [...openingsSource.matchAll(/moves: \[([^\]]+)\]/g)].map(
  (match) =>
    match[1]
      .split(",")
      .map((move) => move.trim().replace(/["']/g, ""))
      .filter(Boolean)
);

openingLines.forEach((moves, index) => {
  checkLine(`opening line ${index + 1} (${moves.slice(0, 4).join(" ")})`, moves);
});

// --------------------------------------------------------- lesson sections
const lessonsSource = read("src/lib/learn/lessons.ts");
const lessonMatches = [
  ...lessonsSource.matchAll(/fen: "([^"]+)",\s*\n\s*moves: \[([^\]]+)\]/g),
];

lessonMatches.forEach((match, index) => {
  const fen = match[1];
  const moves = match[2]
    .split(",")
    .map((move) => move.trim().replace(/["']/g, ""))
    .filter(Boolean);
  checkLine(`lesson section ${index + 1} (${moves.join(" ")})`, moves, fen);
});

console.log(
  failures === 0
    ? "\nAll bundled chess content verified."
    : `\n${failures} problem(s) found.`
);
process.exit(failures === 0 ? 0 : 1);
