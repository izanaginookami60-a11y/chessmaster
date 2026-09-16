"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/config";
import { useAuth } from "@/lib/hooks/useAuth";
import type { SkillLevel } from "@/types/user";

const SKILL_LEVELS: Array<{
  value: SkillLevel;
  label: string;
  description: string;
}> = [
  {
    value: "beginner",
    label: "Beginner",
    description: "I'm learning the rules and basic tactics.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "I know openings and basic strategy.",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "I play regularly and study the game seriously.",
  },
  {
    value: "expert",
    label: "Expert",
    description: "I compete in rated tournaments.",
  },
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const { firebaseUser, isLoading } = useAuth();
  const [selected, setSelected] = useState<SkillLevel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleContinue() {
    if (!firebaseUser || !selected) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(firestore, "users", firebaseUser.uid), {
        skillLevel: selected,
        profileSetupComplete: true,
      });
      toast.success("You're all set!");
      router.push("/");
    } catch {
      toast.error("Couldn't save your choice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg-primary">
        <p className="text-text-secondary">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-lg bg-bg-secondary rounded-xl p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          What&apos;s your chess level?
        </h1>
        <p className="text-text-secondary text-sm mb-6">
          This helps us recommend puzzles, lessons, and bot opponents suited
          to you. You can change this later in Settings.
        </p>

        <div className="space-y-3 mb-6">
          {SKILL_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => setSelected(level.value)}
              className={`w-full text-left rounded-lg border p-4 transition-colors ${
                selected === level.value
                  ? "border-accent-primary bg-accent-primary/10"
                  : "border-bg-hover bg-bg-primary"
              }`}
            >
              <p className="font-semibold text-text-primary">
                {level.label}
              </p>
              <p className="text-sm text-text-secondary">
                {level.description}
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected || isSubmitting}
          className="w-full bg-accent-primary text-bg-primary font-semibold py-2.5 rounded-lg disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Continue"}
        </button>
      </div>
    </main>
  );
}
