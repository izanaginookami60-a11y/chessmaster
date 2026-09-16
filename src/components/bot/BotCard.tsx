import type { BotDefinition } from "@/lib/chess/bots";
import { BotAvatar } from "./BotAvatar";

interface BotCardProps {
  bot: BotDefinition;
  onClick: () => void;
}

export function BotCard({ bot, onClick }: BotCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 bg-bg-secondary hover:bg-bg-hover rounded-xl p-4 text-left transition-colors"
    >
      <BotAvatar bot={bot} size={52} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-text-primary truncate">
            {bot.name}
          </p>
          <span className="text-xs font-medium text-text-secondary bg-bg-tertiary px-1.5 py-0.5 rounded">
            {bot.elo}
          </span>
        </div>
        <p className="text-xs text-text-secondary mt-0.5 truncate">
          {bot.personality}
        </p>
        <p className="text-xs text-accent-link mt-0.5 truncate">
          {bot.style}
        </p>
      </div>
    </button>
  );
}
