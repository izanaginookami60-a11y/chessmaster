"use client";

import { FiRefreshCw } from "react-icons/fi";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Something went wrong
      </h1>
      <p className="text-text-secondary text-sm mb-6 break-words">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
      >
        <FiRefreshCw size={16} /> Try again
      </button>
    </div>
  );
}
