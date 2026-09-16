"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMenu } from "react-icons/fi";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { MobileMenu } from "./MobileMenu";
import { PRIMARY_NAV, isActivePath } from "@/lib/utils/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isGuest } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-bg-secondary border-b border-bg-hover">
        <div className="flex items-center gap-4 px-4 h-14">
          <button
            className="md:hidden p-2 -ml-2 text-text-primary"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu size={22} />
          </button>

          <Logo />

          <nav className="hidden md:flex items-center gap-1 ml-2">
            {PRIMARY_NAV.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "text-accent-primary bg-accent-primary/10"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          <SearchBar />

          <div className="flex items-center gap-1">
            <ThemeToggle />
            {(isAuthenticated || isGuest) && <NotificationBell />}
            <UserMenu />
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
