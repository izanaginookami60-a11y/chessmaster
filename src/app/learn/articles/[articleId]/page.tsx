import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiClock } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { ARTICLES, getArticleById } from "@/lib/learn/articles";

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ articleId: article.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ articleId: string }>;
}): Promise<Metadata> {
  const { articleId } = await params;
  const article = getArticleById(articleId);
  return {
    title: article ? article.title : "Article",
    description: article?.excerpt,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  const article = getArticleById(articleId);
  if (!article) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <PageHeader
        title={article.title}
        description={article.excerpt}
        actions={
          <span className="text-xs text-text-muted flex items-center gap-1.5">
            <FiClock size={12} /> {article.minutes} min
          </span>
        }
      />

      <article className="space-y-5">
        {article.body.map((paragraph, index) =>
          paragraph.startsWith("## ") ? (
            <h2
              key={index}
              className="text-lg font-semibold text-text-primary pt-3"
            >
              {paragraph.slice(3)}
            </h2>
          ) : (
            <p key={index} className="text-sm text-text-secondary leading-6">
              {paragraph}
            </p>
          )
        )}
      </article>

      <div className="mt-8 flex items-center justify-between">
        <Link
          href="/learn/articles"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <FiArrowLeft size={14} /> All articles
        </Link>
        <Link
          href="/learn"
          className="text-sm font-medium text-accent-link"
        >
          Browse lessons
        </Link>
      </div>
    </div>
  );
}
