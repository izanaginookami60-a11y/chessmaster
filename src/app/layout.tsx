import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "ChessMaster — Play chess online",
    template: "%s · ChessMaster",
  },
  description:
    "Play chess online, challenge bots, solve puzzles, and improve your rating.",
  applicationName: "ChessMaster",
  keywords: ["chess", "play chess online", "chess puzzles", "chess analysis"],
  openGraph: {
    title: "ChessMaster",
    description:
      "Play chess online, challenge bots, solve puzzles, and improve your rating.",
    url: APP_URL,
    siteName: "ChessMaster",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChessMaster",
    description: "Play chess online, challenge bots, and solve puzzles.",
  },
};

export const viewport: Viewport = {
  themeColor: "#312E2B",
};

// Runs before first paint so the saved theme is applied without a flash
// of the default (dark) palette. Kept tiny and dependency-free.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem("cm_theme");
    if (t !== "light" && t !== "dark") t = "dark";
    document.documentElement.dataset.theme = t;
  } catch (e) {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-bg-primary text-text-primary antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#272522",
                color: "#FFFFFF",
                border: "1px solid #3C3835",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}

