"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { logout } from "@/lib/firebase/auth";
import { cn } from "@/lib/utils/cn";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
      toast.success("Logged out.");
      router.push("/login");
    } catch {
      toast.error("Couldn't log out. Please try again.");
    }
  }

  return (
    <button
      onClick={handleLogout}
      className={cn(
        "text-text-secondary hover:text-text-primary transition-colors",
        className
      )}
    >
      Log out
    </button>
  );
}
