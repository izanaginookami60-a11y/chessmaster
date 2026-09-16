import Link from "next/link";
import { Logo } from "./Logo";

const FOOTER_LINKS: Array<{ heading: string; links: Array<{ label: string; href: string }> }> = [
  {
    heading: "Play",
    links: [
      { label: "Play Online", href: "/play/online" },
      { label: "Play Bots", href: "/play/computer" },
      { label: "Puzzles", href: "/puzzles" },
      { label: "Analysis Board", href: "/analysis/editor" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { label: "Lessons", href: "/learn" },
      { label: "Openings", href: "/openings" },
      { label: "Articles", href: "/learn/articles" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Forums", href: "/forums" },
      { label: "Clubs", href: "/clubs" },
      { label: "Tournaments", href: "/tournaments" },
      { label: "Leaderboard", href: "/leaderboard" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-bg-hover bg-bg-secondary mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="col-span-2 sm:col-span-1">
          <Logo />
          <p className="text-xs text-text-secondary mt-3">
            Play, learn, and improve — anywhere, anytime.
          </p>
        </div>

        {FOOTER_LINKS.map((group) => (
          <div key={group.heading}>
            <h4 className="text-sm font-semibold text-text-primary mb-3">
              {group.heading}
            </h4>
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-text-secondary hover:text-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-bg-hover px-6 py-4 text-center text-xs text-text-secondary">
        © {new Date().getFullYear()} ChessMaster. All rights reserved.
      </div>
    </footer>
  );
}
