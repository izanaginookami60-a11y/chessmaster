"use client";

import type { SoundEvent } from "./types";

const SOUND_FILES: Record<SoundEvent, string> = {
  move: "/sounds/move.wav",
  capture: "/sounds/capture.wav",
  check: "/sounds/check.wav",
  castle: "/sounds/castle.wav",
  promote: "/sounds/promote.wav",
  gameStart: "/sounds/game-start.wav",
  gameEndWin: "/sounds/game-end-win.wav",
  gameEndLoss: "/sounds/game-end-loss.wav",
  gameEndDraw: "/sounds/game-end-draw.wav",
  lowTime: "/sounds/low-time.wav",
  illegal: "/sounds/illegal.wav",
};

class SoundManager {
  private cache = new Map<SoundEvent, HTMLAudioElement>();
  private muted = false;

  private getAudio(event: SoundEvent): HTMLAudioElement {
    let audio = this.cache.get(event);
    if (!audio) {
      audio = new Audio(SOUND_FILES[event]);
      audio.preload = "auto";
      this.cache.set(event, audio);
    }
    return audio;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  isMuted() {
    return this.muted;
  }

  play(event: SoundEvent) {
    if (this.muted || typeof window === "undefined") return;
    try {
      const audio = this.getAudio(event);
      // Allow rapid repeated plays (e.g. quick successive moves) by
      // resetting playback position rather than waiting for it to finish.
      audio.currentTime = 0;
      void audio.play().catch(() => {
        // Autoplay can be blocked before the first user gesture — safe
        // to ignore, the next user-triggered sound will succeed.
      });
    } catch {
      // Non-fatal — sound is an enhancement, not a requirement.
    }
  }
}

export const soundManager = new SoundManager();
