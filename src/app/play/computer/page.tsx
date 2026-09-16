"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BOTS, type BotDefinition } from "@/lib/chess/bots";
import { BotCard } from "@/components/bot/BotCard";
import { BotAvatar } from "@/components/bot/BotAvatar";

type ColorChoice = "white" | "black" | "random";

const TIME_CONTROLS = [
  { value: "unlimited", label: "Unlimited" },
  { value: "60", label: "1 min (Bullet)" },
  { value: "180", label: "3 min (Blitz)" },
  { value: "300", label: "5 min (Blitz)" },
  { value: "600", label: "10 min (Rapid)" },
  { value: "1800", label: "30 min (Rapid)" },
];

export default function PlayComputerPage() {
  const router = useRouter();
  const [selectedBot, setSelectedBot] = useState<BotDefinition | null>(null);
  const [color, setColor] = useState<ColorChoice>("random");
  const [timeControl, setTimeControl] = useState("unlimited");
  const [rated, setRated] = useState(true);

  function handleStart() {
    if (!selectedBot) return;
    const finalColor =
      color === "random" ? (Math.random() < 0.5 ? "white" : "black") : color;

    const params = new URLSearchParams({
      color: finalColor,
      time: timeControl,
      rated: String(rated),
    });
    router.push(`/play/computer/${selectedBot.id}?${params.toString()}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-1">
        Play vs Computer
      </h1>
      <p className="text-text-secondary text-sm mb-6">
        Choose an opponent that matches your level, from a friendly beginner
        to full-strength Stockfish.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {BOTS.map((bot) => (
          <div
            key={bot.id}
            className={`rounded-xl ${
              selectedBot?.id === bot.id
                ? "ring-2 ring-accent-primary"
                : ""
            }`}
          >
            <BotCard bot={bot} onClick={() => setSelectedBot(bot)} />
          </div>
        ))}
      </div>

      {selectedBot && (
        <div className="bg-bg-secondary rounded-xl p-5">
          <div className="flex items-center gap-3 mb-5">
            <BotAvatar bot={selectedBot} size={40} />
            <div>
              <p className="font-semibold text-text-primary">
                {selectedBot.name}
              </p>
              <p className="text-xs text-text-secondary">
                {selectedBot.elo} ELO · {selectedBot.style}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-secondary mb-2">Play as</p>
              <div className="flex gap-2">
                {(["white", "black", "random"] as ColorChoice[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`flex-1 text-sm font-medium py-2 rounded-lg capitalize ${
                      color === c
                        ? "bg-accent-primary text-bg-primary"
                        : "bg-bg-primary text-text-secondary"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-text-secondary mb-2">
                Time control
              </p>
              <select
                value={timeControl}
                onChange={(e) => setTimeControl(e.target.value)}
                className="w-full bg-bg-primary text-text-primary text-sm rounded-lg px-3 py-2"
              >
                {TIME_CONTROLS.map((tc) => (
                  <option key={tc.value} value={tc.value}>
                    {tc.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">Rated game</p>
              <button
                onClick={() => setRated((v) => !v)}
                className={`w-11 h-6 rounded-full relative transition-colors ${
                  rated ? "bg-accent-primary" : "bg-bg-hover"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    rated ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-accent-primary text-bg-primary font-semibold py-2.5 rounded-lg mt-2"
            >
              Start game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
