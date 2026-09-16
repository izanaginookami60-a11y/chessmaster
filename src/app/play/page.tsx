"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiUsers,
  FiCpu,
  FiBarChart2,
  FiZap,
  FiClock,
  FiTrendingUp,
} from "react-icons/fi";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { BOTS } from "@/lib/chess/bots";
import { BotAvatar } from "@/components/bot/BotAvatar";
import { useAuth } from "@/lib/hooks/useAuth";
import { RecentGames } from "@/components/game/RecentGames";

type Mode = "online" | "computer" | "analysis";

const TIME_CONTROLS = [
  { value: "60", label: "1 min", tag: "Bullet" },
  { value: "180", label: "3 min", tag: "Blitz" },
  { value: "300", label: "5 min", tag: "Blitz" },
  { value: "600", label: "10 min", tag: "Rapid" },
  { value: "900", label: "15 min", tag: "Rapid" },
  { value: "unlimited", label: "No clock", tag: "Casual" },
];

const MODE_TABS: Array<{ id: Mode; label: string; icon: typeof FiUsers }> = [
  { id: "online", label: "Play online", icon: FiUsers },
  { id: "computer", label: "Play bots", icon: FiCpu },
  { id: "analysis", label: "Analysis", icon: FiBarChart2 },
];

export default function PlayPage() {
  const { isAuthenticated, isGuest, profile } = useAuth();
  const [mode, setMode] = useState<Mode>("online");
  const [time, setTime] = useState("600");
  const [rated, setRated] = useState(true);

  const canPlayRated = isAuthenticated && !!profile?.isVerified;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader
        title="Play chess"
        description="Pick a time control, then choose your opponent."
        actions={
          <span className="text-xs text-text-secondary">
            {isGuest
              ? "Guest session — games are unrated"
              : isAuthenticated
              ? `Rated games ${canPlayRated ? "enabled" : "need a verified email"}`
              : "Log in to play rated games"}
          </span>
        }
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {MODE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg ${
                active
                  ? "bg-accent-primary text-bg-primary"
                  : "bg-bg-secondary text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {mode === "online" && (
        <section className="bg-bg-secondary rounded-xl p-5 mb-8">
          <SectionTitle>Choose how long you want to play</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            {TIME_CONTROLS.map((tc) => (
              <button
                key={tc.value}
                onClick={() => setTime(tc.value)}
                className={`rounded-lg px-4 py-3 text-left border ${
                  time === tc.value
                    ? "border-accent-primary bg-accent-primary/10"
                    : "border-bg-hover bg-bg-primary hover:bg-bg-hover"
                }`}
              >
                <span className="flex items-center gap-2 font-semibold text-text-primary">
                  <FiClock size={14} className="text-text-secondary" />
                  {tc.label}
                </span>
                <span className="text-xs text-text-secondary">{tc.tag}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setRated((v) => !v)}
              disabled={!canPlayRated}
              className="inline-flex items-center gap-2 text-sm text-text-secondary disabled:opacity-50"
              title={
                canPlayRated
                  ? "Rated games affect your rating"
                  : "Verify your email to play rated games"
              }
            >
              <span
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  rated && canPlayRated ? "bg-accent-primary" : "bg-bg-hover"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    rated && canPlayRated ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </span>
              Rated game
            </button>

            <Link
              href={`/play/online?time=${time}&rated=${
                rated && canPlayRated ? 1 : 0
              }`}
              className="inline-flex items-center gap-2 bg-accent-primary text-bg-primary font-semibold px-5 py-2.5 rounded-lg"
            >
              <FiZap size={16} /> Find opponent
            </Link>

            <Link
              href="/play/online?tab=challenge"
              className="inline-flex items-center gap-2 border border-bg-hover text-text-primary font-medium px-5 py-2.5 rounded-lg hover:bg-bg-hover"
            >
              Create a challenge
            </Link>
          </div>
        </section>
      )}

      {mode === "computer" && (
        <section className="mb-8">
          <SectionTitle
            action={
              <Link
                href="/play/computer"
                className="text-xs font-medium text-accent-link"
              >
                Bot settings
              </Link>
            }
          >
            Pick a bot
          </SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BOTS.map((bot) => (
              <Link
                key={bot.id}
                href={`/play/computer/${bot.id}?color=random&time=${
                  time === "unlimited" ? "600" : time
                }&rated=0`}
                className="flex items-center gap-3 bg-bg-secondary hover:bg-bg-hover rounded-xl p-4"
              >
                <BotAvatar bot={bot} size={42} />
                <div className="min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {bot.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Level {bot.level} · {bot.elo} ELO
                  </p>
                  <p className="text-xs text-accent-link truncate">
                    {bot.style}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {mode === "analysis" && (
        <section className="mb-8">
          <SectionTitle>Analysis tools</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/analysis/editor"
              className="bg-bg-secondary hover:bg-bg-hover rounded-xl p-5"
            >
              <FiBarChart2 size={20} className="text-accent-primary mb-2" />
              <p className="font-semibold text-text-primary">Analysis board</p>
              <p className="text-xs text-text-secondary mt-1">
                Set up any position, step through moves, and check lines with
                the engine.
              </p>
            </Link>
            <Link
              href="/analysis"
              className="bg-bg-secondary hover:bg-bg-hover rounded-xl p-5"
            >
              <FiTrendingUp size={20} className="text-accent-primary mb-2" />
              <p className="font-semibold text-text-primary">Your games</p>
              <p className="text-xs text-text-secondary mt-1">
                Review games you have already played, move by move.
              </p>
            </Link>
          </div>
        </section>
      )}

      {isAuthenticated && <RecentGames limit={8} />}

    </div>
  );
}
