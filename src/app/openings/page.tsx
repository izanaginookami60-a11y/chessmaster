"use client";

import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinePlayer } from "@/components/learn/LinePlayer";
import { OPENINGS, type Opening } from "@/lib/openings/openings";

export default function OpeningsPage() {
  const [selected, setSelected] = useState<Opening>(OPENINGS[0]);
  const [term, setTerm] = useState("");

  const filtered = OPENINGS.filter((opening) =>
    `${opening.name} ${opening.eco} ${opening.moves.join(" ")}`
      .toLowerCase()
      .includes(term.trim().toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader
        title="Opening explorer"
        description="A starter repertoire of sound, easy-to-remember openings — play the moves on the board."
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <LinePlayer
            fen={selected.fen}
            moves={selected.moves}
            key={selected.id}
            boardWidth={440}
          />

          <div className="bg-bg-secondary rounded-xl p-5 mt-4">
            <p className="text-xs text-text-muted">{selected.eco}</p>
            <h2 className="text-lg font-semibold text-text-primary mb-1">
              {selected.name}
            </h2>
            <p className="text-sm text-text-secondary mb-3">
              {selected.description}
            </p>

            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">
              Plans
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
              {selected.plans.map((plan) => (
                <li key={plan}>{plan}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="w-full lg:w-80 shrink-0">
          <label className="relative block mb-3">
            <FiSearch
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search openings or moves"
              className="w-full bg-bg-secondary text-sm text-text-primary placeholder:text-text-secondary rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </label>

          <ul className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
            {filtered.map((opening) => (
              <li key={opening.id}>
                <button
                  onClick={() => setSelected(opening)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 ${
                    selected.id === opening.id
                      ? "bg-accent-primary/10 ring-1 ring-accent-primary"
                      : "bg-bg-secondary hover:bg-bg-hover"
                  }`}
                >
                  <p className="text-sm font-medium text-text-primary">
                    {opening.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {opening.eco} · {opening.moves.slice(0, 6).join(" ")}
                    {opening.moves.length > 6 ? " …" : ""}
                  </p>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="text-xs text-text-secondary px-3 py-2">
                No opening matches “{term}”.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
