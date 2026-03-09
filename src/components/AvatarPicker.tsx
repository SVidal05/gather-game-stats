import { useState } from "react";
import { motion } from "framer-motion";
import { EMOJI_AVATARS, IMAGE_AVATARS, isImageAvatar } from "@/lib/avatarOptions";
import { useI18n } from "@/lib/i18n";

interface AvatarPickerProps {
  value: string;
  onChange: (avatar: string) => void;
  size?: "sm" | "md";
}

export function AvatarPicker({ value, onChange, size = "md" }: AvatarPickerProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"emoji" | "image">(isImageAvatar(value) ? "image" : "emoji");

  const btnSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const textSize = size === "sm" ? "text-base" : "text-lg";

  return (
    <div className="space-y-2">
      <div className="flex gap-1 bg-secondary/50 rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => setTab("emoji")}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
            tab === "emoji" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          😎 Emoji
        </button>
        <button
          type="button"
          onClick={() => setTab("image")}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
            tab === "image" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🎮 Gaming
        </button>
      </div>

      {tab === "emoji" ? (
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_AVATARS.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => onChange(a)}
              className={`${btnSize} rounded-lg flex items-center justify-center ${textSize} transition-all ${
                value === a
                  ? "ring-2 ring-primary bg-primary/10 scale-105"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
          {IMAGE_AVATARS.map(img => (
            <motion.button
              key={img.id}
              type="button"
              onClick={() => onChange(img.src)}
              whileTap={{ scale: 0.92 }}
              className={`${btnSize} rounded-lg overflow-hidden transition-all border-2 ${
                value === img.src
                  ? "border-primary ring-2 ring-primary/30 scale-105"
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
              title={img.label}
            >
              <img
                src={img.src}
                alt={img.label}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
