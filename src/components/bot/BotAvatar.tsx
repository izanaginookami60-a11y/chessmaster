import type { BotDefinition } from "@/lib/chess/bots";

interface BotAvatarProps {
  bot: BotDefinition;
  size?: number;
}

export function BotAvatar({ bot, size = 48 }: BotAvatarProps) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: bot.avatarColor,
        fontSize: size * 0.4,
      }}
    >
      {bot.name.charAt(0)}
    </div>
  );
}
