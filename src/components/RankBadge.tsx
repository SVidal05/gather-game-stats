import { Crown, Medal, Award } from "lucide-react";

interface RankBadgeProps {
  rank: number;
  size?: "sm" | "md" | "lg";
}

const RANK_STYLES = {
  1: { bg: "bg-[hsl(var(--gold)/0.15)]", border: "border-[hsl(var(--gold)/0.3)]", text: "text-[hsl(var(--gold))]", icon: Crown },
  2: { bg: "bg-[hsl(220,20%,75%,0.15)]", border: "border-[hsl(220,20%,75%,0.3)]", text: "text-[hsl(220,20%,70%)]", icon: Medal },
  3: { bg: "bg-[hsl(28,70%,50%,0.15)]", border: "border-[hsl(28,70%,50%,0.3)]", text: "text-[hsl(28,70%,50%)]", icon: Award },
} as const;

const SIZE_MAP = {
  sm: { badge: "w-5 h-5", icon: "w-3 h-3", text: "text-[10px]" },
  md: { badge: "w-6 h-6", icon: "w-3.5 h-3.5", text: "text-xs" },
  lg: { badge: "w-8 h-8", icon: "w-4 h-4", text: "text-sm" },
};

export function RankBadge({ rank, size = "md" }: RankBadgeProps) {
  const s = SIZE_MAP[size];

  if (rank <= 3) {
    const style = RANK_STYLES[rank as 1 | 2 | 3];
    const Icon = style.icon;
    return (
      <div className={`${s.badge} rounded-md ${style.bg} border ${style.border} flex items-center justify-center`}>
        <Icon className={`${s.icon} ${style.text}`} />
      </div>
    );
  }

  return (
    <span className={`${s.text} font-bold text-muted-foreground w-5 text-center`}>
      #{rank}
    </span>
  );
}
