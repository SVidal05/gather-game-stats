import { Player } from "@/lib/types";
import { isImageAvatar } from "@/lib/avatarOptions";

interface PlayerBadgeProps {
  player: Player;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-xl",
};

export function PlayerBadge({ player, size = "md", showName = true }: PlayerBadgeProps) {
  const isImage = isImageAvatar(player.avatar);

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center font-bold shrink-0 overflow-hidden`}
        style={{ backgroundColor: player.color + "15", border: `2px solid ${player.color}` }}
      >
        {isImage ? (
          <img
            src={player.avatar}
            alt={player.name}
            className="w-full h-full object-cover"
          />
        ) : (
          player.avatar
        )}
      </div>
      {showName && (
        <span className="font-semibold text-sm text-foreground">
          {player.name}
        </span>
      )}
    </div>
  );
}
