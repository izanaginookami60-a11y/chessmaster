import type { Metadata } from "next";
import Link from "next/link";
import { FiBookOpen, FiClock } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { ARTICLES } from "@/lib/learn/articles";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Practical chess improvement articles: calculation, time management and analysing your own games.",
};

export default function ArticlesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Articles"
        description="Ideas you can apply in your next game — no engine required."
        actions={
          <Link href="/learn" className="text-xs font-medium text-accent-link">
            Lessons
          </Link>
        }
      />

      <ul className="space-y-3">
        {ARTICLES.map((article) => (
          <li key={article.id}>
            <Link
              href={`/learn/articles/${article.id}`}
              className="block bg-bg-secondary hover:bg-bg-hover rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <FiBookOpen size={14} className="text-accent-primary" />
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <FiClock size={11} /> {article.minutes} min
                </span>
                <span className="text-xs text-text-muted">
                  {article.tags.join(" · ")}
                </span>
              </div>
              <p className="font-semibold text-text-primary">{article.title}</p>
              <p className="text-sm text-text-secondary mt-1">
                {article.excerpt}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
