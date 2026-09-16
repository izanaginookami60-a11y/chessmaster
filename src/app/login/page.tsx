"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import type { User } from "firebase/auth";
import {
  loginWithEmail,
  loginWithGoogle,
  loginAsGuest,
  fetchUserProfile,
} from "@/lib/firebase/auth";
import { useAuth } from "@/lib/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";

function getAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Login failed. Please try again.";
  }
}

/** Only allow same-site relative paths through the ?redirect= param. */
function sanitizeRedirect(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

/**
 * Where should we drop the user after a successful sign-in?
 * 1. the page they were originally trying to open, if any.
 * 2. guests go straight to /play.
 * 3. accounts that never finished onboarding go to /profile/setup.
 * 4. everyone else lands on the home page.
 */
async function gotoAfterAuth(
  user: User,
  requestedRedirect: string | null,
  navigate: (href: string) => void
) {
  if (requestedRedirect) {
    navigate(requestedRedirect);
    return;
  }

  if (user.isAnonymous) {
    navigate("/play");
    return;
  }

  try {
    const profile = await fetchUserProfile(user.uid);
    if (profile && !profile.profileSetupComplete) {
      navigate("/profile/setup");
      return;
    }
  } catch {
    // Reading the profile can fail (offline, rules) — fall through home.
  }

  navigate("/");
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-bg-primary">
          <Spinner label="Loading sign-in…" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestedRedirect = sanitizeRedirect(searchParams.get("redirect"));

  // Already signed in? Skip the form. (Proxy usually catches this, but
  // its cookie can be missing while Firebase still has a live session.)
  useEffect(() => {
    if (isLoading || !firebaseUser) return;
    void gotoAfterAuth(firebaseUser, requestedRedirect, (href) =>
      router.replace(href)
    );
  }, [firebaseUser, isLoading, requestedRedirect, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await loginWithEmail(email, password);
      toast.success("Welcome back!");
      await gotoAfterAuth(user, requestedRedirect, (href) => router.push(href));
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    try {
      const user = await loginWithGoogle();
      toast.success("Welcome back!");
      await gotoAfterAuth(user, requestedRedirect, (href) => router.push(href));
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGuestLogin() {
    setIsSubmitting(true);
    try {
      const user = await loginAsGuest();
      toast.success("Playing as guest — your rating won't be saved.");
      await gotoAfterAuth(user, requestedRedirect, (href) => router.push(href));
    } catch {
      toast.error("Couldn't start a guest session. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md bg-bg-secondary rounded-xl p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          Welcome back
        </h1>
        <p className="text-text-secondary text-sm mb-6">
          Log in to continue playing.{" "}
          {requestedRedirect && (
            <span className="text-text-muted">
              You&apos;ll be taken back to the page you requested.
            </span>
          )}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm text-text-secondary">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-accent-link"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent-primary text-bg-primary font-semibold py-2.5 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-bg-hover flex-1" />
          <span className="text-text-secondary text-xs">OR</span>
          <div className="h-px bg-bg-hover flex-1" />
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full bg-bg-primary border border-bg-hover text-text-primary font-medium py-2.5 rounded-lg disabled:opacity-50"
          >
            Continue with Google
          </button>
          <button
            onClick={handleGuestLogin}
            disabled={isSubmitting}
            className="w-full bg-transparent border border-bg-hover text-text-secondary font-medium py-2.5 rounded-lg disabled:opacity-50"
          >
            Play as guest
          </button>
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent-link">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
