"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden md:flex items-center relative flex-1 max-w-xs"
    >
      <FiSearch
        className="absolute left-3 text-text-secondary pointer-events-none"
        size={16}
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search players, games..."
        className="w-full bg-bg-tertiary text-sm text-text-primary placeholder:text-text-secondary rounded-full pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-accent-primary"
      />
    </form>
  );
}
