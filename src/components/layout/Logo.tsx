import Link from "next/link";
import { GiChessKnight } from "react-icons/gi";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <GiChessKnight className="text-accent-primary" size={28} />
      <span className="font-bold text-lg text-text-primary hidden sm:inline">
        ChessMaster
      </span>
    </Link>
  );
}
