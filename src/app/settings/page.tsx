"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FiSave,
  FiTrash2,
  FiLogOut,
  FiShield,
  FiBell,
  FiUser,
} from "react-icons/fi";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/hooks/useAuth";
import { updateOwnProfile } from "@/lib/firebase/users";
import { requestAccountDeletion } from "@/lib/firebase/games";
import { resendVerificationEmail, logout } from "@/lib/firebase/auth";
import { useBoardSettingsStore } from "@/lib/store/boardSettingsStore";
import { BOARD_THEME_LIST } from "@/lib/chess/boardThemes";
import { PIECE_THEME_LIST } from "@/lib/chess/pieceThemes";
import type { SkillLevel } from "@/types/user";

const SKILL_LEVELS: SkillLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

export default function SettingsPage() {
  const router = useRouter();
  const { firebaseUser, profile, isLoading } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [skill, setSkill] = useState<SkillLevel | null>(
    profile?.skillLevel ?? null
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const boardTheme = useBoardSettingsStore((s) => s.boardTheme);
  const pieceTheme = useBoardSettingsStore((s) => s.pieceTheme);
  const setBoardTheme = useBoardSettingsStore((s) => s.setBoardTheme);
  const setPieceTheme = useBoardSettingsStore((s) => s.setPieceTheme);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;

    setSaving(true);
    try {
      await updateOwnProfile(firebaseUser.uid, {
        username,
        country,
        skillLevel: skill,
      });
      toast.success("Settings saved.");
    } catch {
      toast.error("Could not save your settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await requestAccountDeletion();
      toast.success("Account deleted. Goodbye!");
      await logout();
      router.push("/");
    } catch {
      toast.error("Could not delete the account. Try again later.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Spinner label="Loading settings…" />
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-text-primary mb-4">
          Log in to change your settings.
        </p>
        <Link
          href="/login?redirect=/settings"
          className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <PageHeader
        title="Settings"
        description="Your profile, board preferences and account."
        actions={
          profile?.username ? (
            <Link
              href={`/profile/${profile.username}`}
              className="text-xs font-medium text-accent-link"
            >
              View public profile
            </Link>
          ) : undefined
        }
      />

      <form onSubmit={handleSave} className="bg-bg-secondary rounded-xl p-5 mb-6">
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <FiUser size={13} /> Profile
          </span>
        </SectionTitle>

        <label className="block mb-4">
          <span className="block text-xs text-text-secondary mb-1">
            Username
          </span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength={3}
            maxLength={20}
            required
            className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary"
          />
        </label>

        <div className="mb-4">
          <CountrySelector value={country} onChange={setCountry} />
        </div>

        <label className="block mb-4">
          <span className="block text-xs text-text-secondary mb-1">
            Skill level
          </span>
          <select
            value={skill ?? ""}
            onChange={(event) =>
              setSkill((event.target.value || null) as SkillLevel | null)
            }
            className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary"
          >
            <option value="">Prefer not to say</option>
            {SKILL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          <FiSave size={14} /> {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <section className="bg-bg-secondary rounded-xl p-5 mb-6">
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <FiShield size={13} /> Account
          </span>
        </SectionTitle>
        <p className="text-xs text-text-secondary mb-3">
          {firebaseUser.email} ·{" "}
          {firebaseUser.emailVerified ? (
            <span className="text-result-win">email verified</span>
          ) : (
            <span className="text-accent-secondary">email not verified</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {!firebaseUser.emailVerified && (
            <button
              onClick={() =>
                void resendVerificationEmail()
                  .then(() => toast.success("Verification email sent."))
                  .catch(() => toast.error("Could not send the email."))
              }
              className="text-xs font-medium bg-bg-primary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
            >
              Resend verification email
            </button>
          )}
          <button
            onClick={() => void logout().then(() => router.push("/"))}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-primary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
          >
            <FiLogOut size={13} /> Log out
          </button>
        </div>
      </section>

      <section className="bg-bg-secondary rounded-xl p-5 mb-6">
        <SectionTitle>Board appearance</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">
              Board theme
            </span>
            <select
              value={boardTheme}
              onChange={(event) =>
                setBoardTheme(event.target.value as typeof boardTheme)
              }
              className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary"
            >
              {BOARD_THEME_LIST.map((theme) => (
                <option key={theme.name} value={theme.name}>
                  {theme.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">
              Piece set
            </span>
            <select
              value={pieceTheme}
              onChange={(event) =>
                setPieceTheme(event.target.value as typeof pieceTheme)
              }
              className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary"
            >
              {PIECE_THEME_LIST.map((theme) => (
                <option key={theme.name} value={theme.name}>
                  {theme.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="bg-bg-secondary rounded-xl p-5 mb-6">
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <FiBell size={13} /> Notifications
          </span>
        </SectionTitle>
        <p className="text-xs text-text-secondary mb-3">
          Game results, friend requests and forum replies land in your{" "}
          <Link href="/notifications" className="text-accent-link">
            inbox
          </Link>
          .
        </p>
        <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            defaultChecked
            onChange={(event) =>
              void updateOwnProfile(firebaseUser.uid, {
                notifyGameResults: event.target.checked,
              } as Record<string, unknown>)
            }
            className="accent-accent-primary"
          />
          Notify me about rated game results
        </label>
      </section>

      <section className="bg-bg-secondary rounded-xl p-5 border border-result-loss/30">
        <SectionTitle>
          <span className="inline-flex items-center gap-2 text-result-loss">
            <FiTrash2 size={13} /> Danger zone
          </span>
        </SectionTitle>
        <p className="text-xs text-text-secondary mb-3">
          Deleting your account removes your profile, games, puzzles and
          messages. This cannot be undone.
        </p>
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="text-xs font-semibold bg-result-loss text-white px-3 py-2 rounded-lg disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete everything"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs font-medium text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs font-medium border border-result-loss/50 text-result-loss hover:bg-result-loss/10 px-3 py-2 rounded-lg"
          >
            Delete my account
          </button>
        )}
      </section>

    </div>
  );
}
