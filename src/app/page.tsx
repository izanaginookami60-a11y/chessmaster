"use client";

import Link from "next/link";
import {
  FiUsers,
  FiCpu,
  FiTarget,
  FiBarChart2,
  FiArrowRight,
  FiZap,
} from "react-icons/fi";
import { GiChessKnight } from "react-icons/gi";
import { useAuth } from "@/lib/hooks/useAuth";
import { BOTS } from "@/lib/chess/bots";
import { BotAvatar } from "@/components/bot/BotAvatar";
import { SectionTitle } from "@/components/ui/PageHeader";
import { RecentGames } from "@/components/game/RecentGames";

const MODES = [
  {
    href: "/play/online",
    icon: FiUsers,
    title: "Play Online",
    description: "Get paired with a player of similar strength.",
  },
  {
    href: "/play/computer",
    icon: FiCpu,
    title: "Play Computer",
    description: "10 bots from beginner to full-strength Stockfish.",
  },
  {
    href: "/puzzles",
    icon: FiTarget,
    title: "Solve Puzzles",
    description: "Sharpen your tactics with curated positions.",
  },
  {
    href: "/analysis/editor",
    icon: FiBarChart2,
    title: "Analysis Board",
    description: "Explore moves and check your ideas with the engine.",
  },
];

const QUICK_TIME_CONTROLS = [
  { label: "1 min", value: "60", tag: "Bullet" },
  { label: "3 min", value: "180", tag: "Blitz" },
  { label: "5 min", value: "300", tag: "Blitz" },
  { label: "10 min", value: "600", tag: "Rapid" },
];

export default function HomePage() {
  const { isAuthenticated, profile } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <section className="bg-bg-secondary rounded-2xl p-6 sm:p-10 mb-8 text-center">
        <GiChessKnight className="text-accent-primary mx-auto mb-3" size={52} />
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
          Play chess. Get better. Every day.
        </h1>
        <p className="text-text-secondary max-w-xl mx-auto mb-6">
          Challenge players around the world, train against adaptive bots,
          solve puzzles, and review your games with the engine.
        </p>

        {isAuthenticated && profile && (
          <p className="text-sm text-text-secondary mb-4">
            Welcome back,{" "}
            <span className="font-semibold text-text-primary">
              {profile.username}
            </span>{" "}
            · rating{" "}
            <span className="font-semibold text-accent-primary">
              {profile.rating}
            </span>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/play"
            className="inline-flex items-center gap-2 bg-accent-primary text-bg-primary font-semibold px-5 py-2.5 rounded-lg hover:opacity-90"
          >
            <FiZap size={16} /> Play now
          </Link>
          <Link
            href="/puzzles"
            className="inline-flex items-center gap-2 border border-bg-hover text-text-primary font-medium px-5 py-2.5 rounded-lg hover:bg-bg-hover"
          >
            <FiTarget size={16} /> Solve puzzles
          </Link>
        </div>
      </section>
      <section className="mb-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <Link
                key={mode.href}
                href={mode.href}
                className="group bg-bg-secondary hover:bg-bg-hover rounded-xl p-5 transition-colors"
              >
                <Icon size={22} className="text-accent-primary mb-3" aria-hidden />
                <p className="font-semibold text-text-primary">{mode.title}</p>
                <p className="text-xs text-text-secondary mt-1">
                  {mode.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-accent-link mt-3 group-hover:gap-2 transition-all">
                  Open <FiArrowRight size={12} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle
          action={
            <Link
              href="/play/online"
              className="text-xs font-medium text-accent-link"
            >
              More time controls
            </Link>
          }
        >
          Quick pair
        </SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_TIME_CONTROLS.map((tc) => (
            <Link
              key={tc.value}
              href={`/play/online?time=${tc.value}&rated=1`}
              className="bg-bg-secondary hover:bg-bg-hover rounded-xl px-4 py-3 text-center"
            >
              <p className="font-semibold text-text-primary">{tc.label}</p>
              <p className="text-xs text-text-secondary">{tc.tag}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle
          action={
            <Link
              href="/play/computer"
              className="text-xs font-medium text-accent-link"
            >
              All bots
            </Link>
          }
        >
          Featured bots
        </SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BOTS.slice(0, 6).map((bot) => (
            <Link
              key={bot.id}
              href={`/play/computer/${bot.id}?color=random&time=600`}
              className="flex items-center gap-3 bg-bg-secondary hover:bg-bg-hover rounded-xl p-4"
            >
              <BotAvatar bot={bot} size={40} />
              <div className="min-w-0">
                <p className="font-medium text-text-primary truncate">
                  {bot.name}
                </p>
                <p className="text-xs text-text-secondary">
                  {bot.elo} ELO · {bot.style}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {isAuthenticated && <RecentGames limit={6} />}

    </div>
  );
}
