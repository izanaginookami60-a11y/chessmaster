"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV, isActivePath } from "@/lib/utils/navigation";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary border-t border-bg-hover flex items-stretch">
      {BOTTOM_NAV.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
          >
            <Icon
              size={20}
              className={active ? "text-accent-primary" : "text-text-secondary"}
            />
            <span
              className={`text-[10px] font-medium ${
                active ? "text-accent-primary" : "text-text-secondary"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
