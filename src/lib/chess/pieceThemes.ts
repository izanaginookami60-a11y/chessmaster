import type { PieceThemeName } from "./types";

export interface PieceTheme {
  name: PieceThemeName;
  label: string;
  /** Applied to the board's piece layer via a CSS filter, so we get 6
   *  visually distinct sets without shipping 72 hand-drawn SVGs. */
  filter: string;
  imageRendering?: "auto" | "pixelated";
}

export const PIECE_THEMES: Record<PieceThemeName, PieceTheme> = {
  neo: { name: "neo", label: "Neo", filter: "none" },
  classic: {
    name: "classic",
    label: "Classic",
    filter: "saturate(0.9) contrast(1.05)",
  },
  wood: {
    name: "wood",
    label: "Wood",
    filter: "sepia(0.5) saturate(1.4) hue-rotate(-10deg) brightness(0.95)",
  },
  metal: {
    name: "metal",
    label: "Metal",
    filter: "grayscale(0.85) contrast(1.3) brightness(1.1)",
  },
  "8bit": {
    name: "8bit",
    label: "8-bit",
    filter: "contrast(1.6) saturate(1.8)",
    imageRendering: "pixelated",
  },
  staunty: {
    name: "staunty",
    label: "Staunty",
    filter: "contrast(1.1) saturate(1.1) sepia(0.15)",
  },
};

export const PIECE_THEME_LIST = Object.values(PIECE_THEMES);
