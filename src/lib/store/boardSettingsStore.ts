"use client";

import { create } from "zustand";
import type { BoardThemeName, PieceThemeName } from "@/lib/chess/types";

const STORAGE_KEY = "cm_board_settings";

interface BoardSettingsState {
  boardTheme: BoardThemeName;
  pieceTheme: PieceThemeName;
  showCoordinates: boolean;
  muted: boolean;
  hydrated: boolean;
  setBoardTheme: (theme: BoardThemeName) => void;
  setPieceTheme: (theme: PieceThemeName) => void;
  toggleCoordinates: () => void;
  toggleMuted: () => void;
  hydrate: () => void;
}

interface PersistedSettings {
  boardTheme: BoardThemeName;
  pieceTheme: PieceThemeName;
  showCoordinates: boolean;
  muted: boolean;
}

const DEFAULTS: PersistedSettings = {
  boardTheme: "green",
  pieceTheme: "neo",
  showCoordinates: true,
  muted: false,
};

function persist(settings: PersistedSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be unavailable (private mode) — settings are then
    // simply session-only.
  }
}

export const useBoardSettingsStore = create<BoardSettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  setBoardTheme: (boardTheme) => {
    set({ boardTheme });
    persist({ ...pick(get()), boardTheme });
  },
  setPieceTheme: (pieceTheme) => {
    set({ pieceTheme });
    persist({ ...pick(get()), pieceTheme });
  },
  toggleCoordinates: () => {
    const showCoordinates = !get().showCoordinates;
    set({ showCoordinates });
    persist({ ...pick(get()), showCoordinates });
  },
  toggleMuted: () => {
    const muted = !get().muted;
    set({ muted });
    persist({ ...pick(get()), muted });
  },
  hydrate: () => {
    if (get().hydrated || typeof window === "undefined") return;
    let settings = DEFAULTS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) settings = { ...DEFAULTS, ...(JSON.parse(raw) as PersistedSettings) };
    } catch {
      settings = DEFAULTS;
    }
    set({ ...settings, hydrated: true });
  },
}));

function pick(state: BoardSettingsState): PersistedSettings {
  return {
    boardTheme: state.boardTheme,
    pieceTheme: state.pieceTheme,
    showCoordinates: state.showCoordinates,
    muted: state.muted,
  };
}
