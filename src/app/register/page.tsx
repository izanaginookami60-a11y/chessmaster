"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { registerWithEmail, loginWithGoogle } from "@/lib/firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/config";
import { CountrySelector } from "@/components/auth/CountrySelector";

function getAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already registered. Try logging in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (username.trim().length < 3) {
      toast.error("Username must be at least 3 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await registerWithEmail({
        username: username.trim(),
        email,
        password,
      });

      if (country) {
        await updateDoc(doc(firestore, "users", user.uid), { country });
      }

      toast.success("Account created! Check your email to verify it.");
      router.push("/profile/setup");
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignUp() {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      toast.success("Welcome to ChessMaster!");
      router.push("/profile/setup");
    } catch {
      toast.error("Google sign-up failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md bg-bg-secondary rounded-xl p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          Create your account
        </h1>
        <p className="text-text-secondary text-sm mb-6">
          Join ChessMaster and start playing in minutes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary"
              placeholder="chessplayer123"
            />
          </div>

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
            <label className="block text-sm text-text-secondary mb-1">
              Country
            </label>
            <CountrySelector value={country} onChange={setCountry} />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent-primary text-bg-primary font-semibold py-2.5 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-bg-hover flex-1" />
          <span className="text-text-secondary text-xs">OR</span>
          <div className="h-px bg-bg-hover flex-1" />
        </div>

        <button
          onClick={handleGoogleSignUp}
          disabled={isSubmitting}
          className="w-full bg-bg-primary border border-bg-hover text-text-primary font-medium py-2.5 rounded-lg disabled:opacity-50"
        >
          Continue with Google
        </button>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent-link">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
