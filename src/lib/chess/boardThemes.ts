import type { BoardThemeName } from "./types";

export interface BoardTheme {
  name: BoardThemeName;
  label: string;
  light: string;
  dark: string;
}

export const BOARD_THEMES: Record<BoardThemeName, BoardTheme> = {
  green: { name: "green", label: "Green", light: "#EBECD0", dark: "#779556" },
  blue: { name: "blue", label: "Blue", light: "#DEE3E6", dark: "#4B7399" },
  brown: { name: "brown", label: "Brown", light: "#F0D9B5", dark: "#B58863" },
  purple: {
    name: "purple",
    label: "Purple",
    light: "#E8E0F2",
    dark: "#8877B8",
  },
  grey: { name: "grey", label: "Grey", light: "#DCDCDC", dark: "#7D7D7D" },
  tournament: {
    name: "tournament",
    label: "Tournament",
    light: "#EEEED2",
    dark: "#4E7837",
  },
  ice: { name: "ice", label: "Ice", light: "#E6F2F5", dark: "#7EA8B8" },
  wood: { name: "wood", label: "Wood", light: "#D8B679", dark: "#8B5A2B" },
};

export const BOARD_THEME_LIST = Object.values(BOARD_THEMES);
