import { START_FEN } from "@/lib/chess/pgn";

export interface Opening {
  id: string;
  name: string;
  eco: string;
  /** Main line in SAN. */
  moves: string[];
  /** Optional starting position (defaults to the initial position). */
  fen?: string;
  description: string;
  plans: string[];
}

/**
 * A small, sound starter repertoire. Every line here is main-line theory
 * and easy to remember, which is what club players need most.
 */
export const OPENINGS: Opening[] = [
  {
    id: "italian",
    name: "Italian Game",
    eco: "C50",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4"],
    description:
      "White develops quickly, fights for d4 and keeps the option of a slow build-up or a sharp sacrifice on f7.",
    plans: [
      "Castle short and put the rook on e1.",
      "Support d4 with c3 so the centre can be opened on your terms.",
      "Watch for Bxf7+ tricks when Black's king is still in the middle.",
    ],
  },
  {
    id: "ruy-lopez",
    name: "Ruy López (Spanish)",
    eco: "C60",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O"],
    description:
      "The most classical of all openings: White pressures the knight that defends e5, then castles into a long-term squeeze.",
    plans: [
      "Play d4 or Re1 followed by c3 and d4.",
      "Trade on c6 at the right moment to wreck Black's pawn structure.",
      "Keep the light-squared bishop — it asks questions for a long time.",
    ],
  },
  {
    id: "sicilian-najdorf",
    name: "Sicilian Defence: Najdorf",
    eco: "B90",
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
    description:
      "Black unbalances the position immediately and fights for the initiative on the queenside.",
    plans: [
      "Play e5 or e6 depending on where White's pieces are.",
      "Use the b5 square as a launching pad with Bb7 and Rc8.",
      "Do not castle into a kingside attack without a defender ready.",
    ],
  },
  {
    id: "queens-gambit",
    name: "Queen's Gambit",
    eco: "D06",
    moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O"],
    description:
      "White offers a temporary pawn to take the centre and develop with a comfortable, durable position.",
    plans: [
      "Reclaim the pawn on c4 with a piece, not a tempo.",
      "Aim for the minority attack with b4-b5 later on.",
      "Keep the tension: trading on d5 too early helps Black.",
    ],
  },
  {
    id: "london",
    name: "London System",
    eco: "D02",
    moves: ["d4", "d5", "Bf4", "Nf6", "e3", "e6", "Nf3", "Bd6", "Bg3", "O-O"],
    description:
      "A low-maintenance system: the same set-up every game, no long lines to memorise.",
    plans: [
      "Build the triangle with e3, c3 and Bd3.",
      "Ne5 is often a strong square — support it with f4 later.",
      "Trade the dark-squared bishop only when it helps the pawn structure.",
    ],
  },
  {
    id: "caro-kann",
    name: "Caro-Kann Defence",
    eco: "B10",
    moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6"],
    description:
      "Solid, structurally sound defence: Black challenges e4 with c6 and d5, then develops the bishop outside the pawn chain.",
    plans: [
      "Play e6 and develop the dark-squared bishop before castling.",
      "Meet a kingside attack with ...h6 and a timely trade.",
      "The endgame is usually comfortable because Black's pawns are healthy.",
    ],
  },
  {
    id: "scotch",
    name: "Scotch Game",
    eco: "C45",
    moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Bc5", "Be3"],
    description:
      "An open, straightforward fight: White opens the centre early and gets free piece play.",
    plans: [
      "Develop with Nc3, Bc4 or Bd3 and castle.",
      "Watch the d5 square — it is usually his best retreat square.",
      "Trading queens early leads to a comfortable but not winning endgame.",
    ],
  },
  {
    id: "kings-indian-attack",
    name: "King's Indian Attack",
    eco: "A07",
    moves: ["Nf3", "d5", "g3", "Nf6", "Bg2", "e6", "O-O", "Be7", "d3"],
    description:
      "A system opening: White builds a solid shell and then plays e4 at the right moment for a kingside attack.",
    plans: [
      "Set up with d3, Nbd2 and Re1, then push e4.",
      "Attack with e5 and a knight hop to g4 or h4.",
      "Do not rush: this opening rewards patience.",
    ],
  },
];

export const OPENING_START_FEN = START_FEN;

export function getOpeningById(id: string): Opening | undefined {
  return OPENINGS.find((opening) => opening.id === id);
}
