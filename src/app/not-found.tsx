import Link from "next/link";
import { GiChessKnight } from "react-icons/gi";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <GiChessKnight className="text-accent-primary mx-auto mb-4" size={48} />
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Page not found
      </h1>
      <p className="text-text-secondary text-sm mb-6">
        That page has been captured. Try one of these instead:
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/"
          className="bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
        >
          Home
        </Link>
        <Link
          href="/play"
          className="border border-bg-hover text-text-primary font-medium px-4 py-2 rounded-lg"
        >
          Play
        </Link>
        <Link
          href="/puzzles"
          className="border border-bg-hover text-text-primary font-medium px-4 py-2 rounded-lg"
        >
          Puzzles
        </Link>
      </div>
    </div>
  );
}
