"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Footer } from "./Footer";
import { VerifyEmailBanner } from "@/components/auth/VerifyEmailBanner";
import { usePresence } from "@/lib/hooks/usePresence";

// Pages that render their own full-screen layout with no site chrome.
const NO_CHROME_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/profile/setup",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Keeps /presence/{uid} fresh so friends see who is online.
  usePresence();
  const hideChrome = NO_CHROME_PREFIXES.some((p) => pathname.startsWith(p));


  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <VerifyEmailBanner />

      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}
