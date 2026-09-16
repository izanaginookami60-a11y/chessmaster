"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiX } from "react-icons/fi";
import { SIDEBAR_NAV, isActivePath } from "@/lib/utils/navigation";
import { Logo } from "./Logo";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-bg-secondary flex flex-col">
        <div className="flex items-center justify-between px-4 h-14 border-b border-bg-hover">
          <Logo />
          <button
            onClick={onClose}
            className="p-2 text-text-primary"
            aria-label="Close menu"
          >
            <FiX size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {SIDEBAR_NAV.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${
                  active
                    ? "text-accent-primary bg-accent-primary/10"
                    : "text-text-primary hover:bg-bg-hover"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
