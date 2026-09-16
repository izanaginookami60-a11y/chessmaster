"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/firebase/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      // Always show success, even if the email doesn't exist — this
      // prevents leaking which emails are registered.
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md bg-bg-secondary rounded-xl p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          Reset your password
        </h1>

        {sent ? (
          <div>
            <p className="text-text-secondary text-sm mt-4 mb-6">
              If an account exists for <strong>{email}</strong>, we&apos;ve
              sent a link to reset your password. Check your inbox (and spam
              folder).
            </p>
            <Link
              href="/login"
              className="block text-center w-full bg-accent-primary text-bg-primary font-semibold py-2.5 rounded-lg"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-text-secondary text-sm mb-6">
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-text-primary"
                placeholder="you@example.com"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent-primary text-bg-primary font-semibold py-2.5 rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
            <p className="text-center text-sm text-text-secondary mt-6">
              <Link href="/login" className="text-accent-link">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
