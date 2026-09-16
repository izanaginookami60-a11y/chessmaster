"use client";

import Link from "next/link";
import {
  FiTarget,
  FiSun,
  FiZap,
  FiTrendingUp,
  FiArrowRight,
} from "react-icons/fi";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { useAuth } from "@/lib/hooks/useAuth";
import { BUNDLED_PUZZLES, THEME_LABELS, type PuzzleTheme } from "@/lib/puzzles";

const MODES = [
  {
    href: "/puzzles/daily",
    icon: FiSun,
    title: "Puzzle of the day",
    description: "One position a day, the same for everyone.",
  },
  {
    href: "/puzzles/rush",
    icon: FiZap,
    title: "Puzzle rush",
    description: "3 minutes, 3 strikes, as many as you can solve.",
  },
  {
    href: "/puzzles/dashboard",
    icon: FiTrendingUp,
    title: "Your progress",
    description: "Rating, streak and how many you have solved.",
  },
];

export default function PuzzlesPage() {
  const { isAuthenticated, profile } = useAuth();

  const themeCounts = BUNDLED_PUZZLES.reduce<Record<string, number>>(
    (counts, puzzle) => {
      for (const theme of puzzle.themes) {
        counts[theme] = (counts[theme] ?? 0) + 1;
      }
      return counts;
    },
    {}
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader
        title="Puzzles"
        description="Tactics training with instant feedback and a rating that follows you."
        actions={
          isAuthenticated && profile ? (
            <span className="text-xs text-text-secondary">
              Puzzle rating{" "}
              <span className="font-semibold text-accent-primary">
                {profile.ratingPuzzle}
              </span>
            </span>
          ) : (
            <Link
              href="/login?redirect=/puzzles"
              className="text-xs font-medium text-accent-link"
            >
              Log in to track progress
            </Link>
          )
        }
      />

      <section className="mb-8">
        <div className="grid sm:grid-cols-3 gap-3">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <Link
                key={mode.href}
                href={mode.href}
                className="group bg-bg-secondary hover:bg-bg-hover rounded-xl p-5"
              >
                <Icon size={20} className="text-accent-primary mb-3" />
                <p className="font-semibold text-text-primary">{mode.title}</p>
                <p className="text-xs text-text-secondary mt-1">
                  {mode.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-accent-link mt-3 group-hover:gap-2 transition-all">
                  Start <FiArrowRight size={12} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <SectionTitle
          action={
            <Link
              href="/puzzles/dashboard"
              className="text-xs font-medium text-accent-link"
            >
              Progress
            </Link>
          }
        >
          Practice by theme
        </SectionTitle>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(themeCounts) as PuzzleTheme[]).map((theme) => (
            <Link
              key={theme}
              href={`/puzzles/rush?theme=${theme}`}
              className="inline-flex items-center gap-2 bg-bg-secondary hover:bg-bg-hover rounded-full px-3.5 py-2 text-xs font-medium text-text-primary"
            >
              <FiTarget size={12} className="text-accent-primary" />
              {THEME_LABELS[theme] ?? theme}
              <span className="text-text-muted">{themeCounts[theme]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>All puzzles</SectionTitle>
        <ul className="space-y-2">
          {BUNDLED_PUZZLES.map((puzzle) => (
            <li
              key={puzzle.id}
              className="flex items-center gap-3 bg-bg-secondary rounded-xl px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-primary truncate">
                  {puzzle.title}
                </p>
                <p className="text-xs text-text-secondary">
                  {puzzle.themes
                    .map((theme) => THEME_LABELS[theme] ?? theme)
                    .join(" · ")}
                </p>
              </div>
              <span className="text-xs text-text-muted">{puzzle.rating}</span>
              <Link
                href={`/puzzles/rush?solo=${puzzle.id}`}
                className="text-xs font-medium bg-accent-primary text-bg-primary px-3 py-1.5 rounded-lg"
              >
                Solve
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
