"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FiUser, FiSettings, FiLogOut, FiChevronDown } from "react-icons/fi";
import { useAuth } from "@/lib/hooks/useAuth";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function UserMenu() {
  const { isAuthenticated, isGuest, profile, firebaseUser } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated && !isGuest) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-sm font-medium text-text-primary px-3 py-1.5 rounded-lg hover:bg-bg-hover transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="text-sm font-semibold bg-accent-primary text-bg-primary px-3 py-1.5 rounded-lg"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const displayName = isGuest
    ? "Guest"
    : profile?.username ?? firebaseUser?.displayName ?? "Player";

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-bg-hover transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-accent-primary text-bg-primary font-bold flex items-center justify-center text-sm shrink-0">
          {initial}
        </div>
        <FiChevronDown
          size={14}
          className={`text-text-secondary transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-bg-secondary border border-bg-hover rounded-lg shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-bg-hover">
            <p className="text-sm font-semibold text-text-primary truncate">
              {displayName}
            </p>
            {isGuest && (
              <p className="text-xs text-text-secondary">
                Guest — progress won&apos;t be saved
              </p>
            )}
          </div>

          {!isGuest && (
            <Link
              href={`/profile/${profile?.username ?? ""}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-hover"
            >
              <FiUser size={16} /> Profile
            </Link>
          )}

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-hover"
          >
            <FiSettings size={16} /> Settings
          </Link>

          <div className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg-hover">
            <FiLogOut size={16} className="text-text-secondary" />
            <LogoutButton className="text-sm text-text-primary hover:text-text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}
