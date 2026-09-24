import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiArrowRight, FiClock, FiCheck } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinePlayer } from "@/components/learn/LinePlayer";
import { LESSONS, getLessonById } from "@/lib/learn/lessons";

export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ lessonId: lesson.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getLessonById(lessonId);
  return {
    title: lesson ? lesson.title : "Lesson",
    description: lesson?.summary,
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getLessonById(lessonId);
  if (!lesson) notFound();

  const index = LESSONS.findIndex((entry) => entry.id === lesson.id);
  const next = LESSONS[index + 1];
  const previous = LESSONS[index - 1];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader
        title={lesson.title}
        description={lesson.summary}
        actions={
          <span className="text-xs text-text-secondary flex items-center gap-1.5">
            <FiClock size={12} /> {lesson.minutes} min ·{" "}
            <span className="capitalize">{lesson.level}</span>
          </span>
        }
      />

      <div className="space-y-8">
        {lesson.sections.map((section, sectionIndex) => (
          <section
            key={section.heading}
            className="grid lg:grid-cols-[1fr_minmax(0,360px)] gap-6 bg-bg-secondary rounded-xl p-5"
          >
            <div>
              <p className="text-xs text-text-muted mb-1">
                Step {sectionIndex + 1} of {lesson.sections.length}
              </p>
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                {section.heading}
              </h2>
              <p className="text-sm text-text-secondary">{section.body}</p>
            </div>

            {section.fen && section.moves && section.moves.length > 0 && (
              <LinePlayer
                fen={section.fen}
                moves={section.moves}
                caption={section.caption}
                boardWidth={340}
              />
            )}
          </section>
        ))}
      </div>

      <section className="mt-8 bg-bg-secondary rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Key takeaways
        </h2>
        <ul className="space-y-2">
          {lesson.keyPoints.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2 text-sm text-text-secondary"
            >
              <FiCheck
                size={14}
                className="text-accent-primary mt-0.5 shrink-0"
              />
              {point}
            </li>
          ))}
        </ul>
      </section>

      <nav className="flex items-center justify-between gap-3 mt-6">
        {previous ? (
          <Link
            href={`/learn/${previous.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
          >
            <FiArrowLeft size={14} /> {previous.title}
          </Link>
        ) : (
          <Link
            href="/learn"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
          >
            <FiArrowLeft size={14} /> All lessons
          </Link>
        )}

        {next ? (
          <Link
            href={`/learn/${next.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-link"
          >
            {next.title} <FiArrowRight size={14} />
          </Link>
        ) : (
          <Link
            href="/puzzles"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-link"
          >
            Practise tactics <FiArrowRight size={14} />
          </Link>
        )}
      </nav>
    </div>
  );
}
