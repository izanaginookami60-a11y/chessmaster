"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_NAV, isActivePath } from "@/lib/utils/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-bg-hover bg-bg-secondary sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-3">
      {SIDEBAR_NAV.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium"
          >
            {active && (
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-accent-primary rounded-r" />
            )}
            <Icon
              size={18}
              className={active ? "text-accent-primary" : "text-text-secondary"}
            />
            <span
              className={active ? "text-text-primary" : "text-text-secondary"}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
