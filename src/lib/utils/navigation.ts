import type { IconType } from "react-icons";
import {
  FiPlay,
  FiTarget,
  FiBookOpen,
  FiUsers,
  FiEye,
  FiHome,
  FiBarChart2,
  FiAward,
  FiCalendar,
  FiMessageCircle,
  FiUserPlus,
  FiMessageSquare,
  FiSettings,
} from "react-icons/fi";

export interface NavItem {
  label: string;
  href: string;
  icon: IconType;
}

// Primary links shown in the top navbar (desktop)
export const PRIMARY_NAV: NavItem[] = [
  { label: "Play", href: "/play", icon: FiPlay },
  { label: "Puzzles", href: "/puzzles", icon: FiTarget },
  { label: "Learn", href: "/learn", icon: FiBookOpen },
  { label: "Community", href: "/forums", icon: FiUsers },
  { label: "Watch", href: "/watch", icon: FiEye },
];

// Extended list shown in the left sidebar (desktop only)
export const SIDEBAR_NAV: NavItem[] = [
  { label: "Home", href: "/", icon: FiHome },
  { label: "Play", href: "/play", icon: FiPlay },
  { label: "Puzzles", href: "/puzzles", icon: FiTarget },
  { label: "Learn", href: "/learn", icon: FiBookOpen },
  { label: "Analysis", href: "/analysis/editor", icon: FiBarChart2 },
  { label: "Leaderboard", href: "/leaderboard", icon: FiAward },
  { label: "Tournaments", href: "/tournaments", icon: FiCalendar },
  { label: "Clubs", href: "/clubs", icon: FiUsers },
  { label: "Forums", href: "/forums", icon: FiMessageCircle },
  { label: "Friends", href: "/friends", icon: FiUserPlus },
  { label: "Messages", href: "/messages", icon: FiMessageSquare },
  { label: "Settings", href: "/settings", icon: FiSettings },
];

// Condensed set for the mobile bottom nav
export const BOTTOM_NAV: NavItem[] = [
  { label: "Home", href: "/", icon: FiHome },
  { label: "Play", href: "/play", icon: FiPlay },
  { label: "Puzzles", href: "/puzzles", icon: FiTarget },
  { label: "Learn", href: "/learn", icon: FiBookOpen },
  { label: "More", href: "/settings", icon: FiSettings },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
