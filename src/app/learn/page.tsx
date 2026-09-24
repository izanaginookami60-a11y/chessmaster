"use client";

import Link from "next/link";
import { FiBookOpen, FiClock } from "react-icons/fi";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { LESSONS } from "@/lib/learn/lessons";
import { ARTICLES } from "@/lib/learn/articles";

const LEVEL_STYLE: Record<string, string> = {
  beginner: "bg-result-win/20 text-result-win",
  intermediate: "bg-accent-secondary/20 text-accent-secondary",
  advanced: "bg-result-loss/20 text-result-loss",
};

export default function LearnPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader
        title="Learn chess"
        description="Short lessons with real positions you can play through, plus articles for the ideas behind the moves."
        actions={
          <Link href="/openings" className="text-xs font-medium text-accent-link">
            Opening explorer
          </Link>
        }
      />

      <section className="mb-10">
        <SectionTitle>Lessons</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          {LESSONS.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/learn/${lesson.id}`}
              className="bg-bg-secondary hover:bg-bg-hover rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                    LEVEL_STYLE[lesson.level]
                  }`}
                >
                  {lesson.level}
                </span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <FiClock size={11} /> {lesson.minutes} min
                </span>
              </div>
              <p className="font-semibold text-text-primary">{lesson.title}</p>
              <p className="text-xs text-text-secondary mt-1">
                {lesson.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          action={
            <Link
              href="/learn/articles"
              className="text-xs font-medium text-accent-link"
            >
              All articles
            </Link>
          }
        >
          Latest articles
        </SectionTitle>
        <ul className="space-y-2">
          {ARTICLES.slice(0, 3).map((article) => (
            <li key={article.id}>
              <Link
                href={`/learn/articles/${article.id}`}
                className="flex items-start gap-3 bg-bg-secondary hover:bg-bg-hover rounded-xl px-4 py-3"
              >
                <FiBookOpen
                  size={16}
                  className="text-accent-primary mt-0.5 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {article.title}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {article.excerpt}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
