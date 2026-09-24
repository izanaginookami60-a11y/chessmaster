import { START_FEN } from "@/lib/chess/pgn";

export interface LessonSection {
  heading: string;
  body: string;
  /** Optional position + line to demonstrate the idea. */
  fen?: string;
  moves?: string[];
  caption?: string;
}

export interface Lesson {
  id: string;
  title: string;
  level: "beginner" | "intermediate" | "advanced";
  minutes: number;
  summary: string;
  sections: LessonSection[];
  keyPoints: string[];
}

export const LESSONS: Lesson[] = [
  {
    id: "board-and-pieces",
    title: "The board and the pieces",
    level: "beginner",
    minutes: 6,
    summary:
      "Files, ranks, how each piece moves, and the three special rules (castling, en passant, promotion).",
    sections: [
      {
        heading: "Coordinates first",
        body: "Files run a to h from White's left, ranks 1 to 8 from White's side. Every square has one name, which is how moves are written: Nf3 means the knight goes to f3.",
        fen: START_FEN,
        moves: ["e4", "e5", "Nf3"],
        caption: "1. e4 e5 2. Nf3 — the opening moves of thousands of games.",
      },
      {
        heading: "How the pieces move",
        body: "Rooks slide along ranks and files. Bishops slide diagonally and stay on their starting colour. The queen does both. Knights jump in an L. Pawns move forward and capture diagonally. The king moves one square in any direction.",
        fen: "8/8/8/4k3/8/4N3/8/6K1 w - - 0 1",
        moves: ["Nc4"],
        caption:
          "A knight always lands on the opposite colour of square it started from.",
      },
      {
        heading: "Special rules",
        body: "Castling moves king and rook in one move and is the fastest way to safety. A pawn may capture en passant the moment an enemy pawn passes it. Any pawn reaching the last rank must promote.",
        fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
        moves: ["O-O"],
        caption:
          "White castles kingside: the king jumps two squares and the rook lands beside it.",
      },
    ],
    keyPoints: [
      "Learn the square names — you cannot read analysis without them.",
      "A knight on the rim is dim: central squares give it the most options.",
      "Castle early unless there is a concrete reason not to.",
    ],
  },
  {
    id: "openings-principles",
    title: "Opening principles",
    level: "beginner",
    minutes: 7,
    summary:
      "Control the centre, develop your pieces, get the king safe, connect the rooks — in that order.",
    sections: [
      {
        heading: "Fight for the centre",
        body: "The four central squares (d4, e4, d5, e5) are the high ground: pieces there reach more squares. Pawns are the cheapest way to claim them.",
        fen: START_FEN,
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
        caption:
          "Italian set-up — both sides stake a claim in the centre before anything else.",
      },
      {
        heading: "Develop with a purpose",
        body: "Every developing move should help control the centre, prepare castling, or create a threat. Avoid moving the same piece twice before the others are out.",
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        moves: ["d3", "d6", "O-O"],
        caption:
          "3. d3 protects e4 and opens the way for the bishop — then White castles.",
      },
    ],
    keyPoints: [
      "Two central pawns beat one.",
      "Develop knights before bishops: you know where knights belong.",
      "Do not chase pawns in the opening; finish your development first.",
      "An uncastled king loses more games than a lost pawn.",
    ],
  },
  {
    id: "back-rank-mate",
    title: "Back-rank weaknesses",
    level: "intermediate",
    minutes: 6,
    summary:
      "A pawn shield that cannot move is a trap. Learn the mate and how to defuse it.",
    sections: [
      {
        heading: "The pattern",
        body: "If the king's escape squares are all blocked by its own pawns, a rook or queen on the back rank mates immediately.",
        fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
        moves: ["Rd8"],
        caption:
          "Rd8# — f8 and h8 are covered, and the pawns block everything else.",
      },
      {
        heading: "Defending",
        body: "Creating luft (h6 or g6) gives the king an escape square, and keeping a rook on the back rank lets it block or capture. Do it before your opponent invades.",
        fen: "6k1/5pp1/7p/8/8/8/5PPP/3R2K1 w - - 0 1",
        moves: ["Rd8", "Kh7"],
        caption: "With h6 played, Rd8+ is only a check — the king escapes to h7.",
      },
    ],
    keyPoints: [
      "Count the defender's heavy pieces before trading them off.",
      "One tempo spent on luft can save the whole game.",
      "A queen and rook is enough to mate a boxed-in king.",
    ],
  },
  {
    id: "piece-values",
    title: "Piece values and good trades",
    level: "beginner",
    minutes: 5,
    summary:
      "What a bishop is worth, when a queen trade is good, and why simple counting wins games.",
    sections: [
      {
        heading: "The counting scale",
        body: "Pawn 1, knight 3, bishop 3, rook 5, queen 9. The king is priceless — losing it loses the game. Use the scale to decide whether a trade is good.",
        fen: "4k3/8/8/8/8/8/4n3/4K3 w - - 0 1",
        moves: ["Kxe2"],
        caption: "A free knight is worth three pawns — take it.",
      },
      {
        heading: "Rooks love the seventh",
        body: "Two bishops work well together in open positions. Rooks belong on open files and reach their best square on the seventh rank, where they attack pawns from behind.",
        fen: "6k1/5ppp/8/8/8/8/5PPP/2R3K1 w - - 0 1",
        moves: ["Rc7"],
        caption: "A rook on the seventh rank attacks pawns from behind.",
      },
    ],
    keyPoints: [
      "Count material before and after every capture.",
      "Avoid giving a bishop for a knight without a concrete reason.",
      "Rooks only shine once the files open — open them with pawn breaks.",
    ],
  },
];

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

export const LESSON_LEVELS: Array<{ value: Lesson["level"]; label: string }> = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];
