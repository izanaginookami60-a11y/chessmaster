"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/hooks/useAuth";
import { resendVerificationEmail } from "@/lib/firebase/auth";

export function VerifyEmailBanner() {
  const { firebaseUser, isAuthenticated } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Only show for real (non-guest) accounts with an unverified email
  if (!isAuthenticated || !firebaseUser || firebaseUser.emailVerified) {
    return null;
  }

  async function handleResend() {
    setIsSending(true);
    try {
      await resendVerificationEmail();
      setSent(true);
      toast.success("Verification email sent.");
    } catch {
      toast.error("Couldn't send the email. Please try again shortly.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="bg-accent-secondary/10 border-b border-accent-secondary/30 text-sm text-text-primary px-4 py-2 flex items-center justify-center gap-3">
      <span>Please verify your email address to unlock rated play.</span>
      <button
        onClick={handleResend}
        disabled={isSending || sent}
        className="text-accent-secondary font-medium underline disabled:opacity-50"
      >
        {sent ? "Email sent" : isSending ? "Sending..." : "Resend email"}
      </button>
    </div>
  );
}
