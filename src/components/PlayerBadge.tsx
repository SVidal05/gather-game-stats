import { Player } from "@/lib/types";

interface PlayerBadgeProps {
  player: Player;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-12 h-12 text-xl",
};

export function PlayerBadge({ player, size = "md", showName = true }: PlayerBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold shrink-0`}
        style={{ backgroundColor: player.color + "22", border: `2px solid ${player.color}` }}
      >
        {player.avatar}
      </div>
      {showName && (
        <span className="font-semibold text-sm" style={{ color: player.color }}>
          {player.name}
        </span>
      )}
    </div>
  );
}
