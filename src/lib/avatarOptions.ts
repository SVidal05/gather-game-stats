// Emoji avatars (original set)
export const EMOJI_AVATARS = [
  "🎮", "🎲", "🃏", "🏆", "⭐", "🎯", "🎪", "🎨",
  "🦊", "🐉", "🦁", "🐺", "🦅", "🐙", "🦄", "🐸",
];

// Image avatars extracted from PlayStation avatar collection
export const IMAGE_AVATARS = [
  { id: "rdr2", src: "/avatars/avatar-rdr2.png", label: "Red Dead Redemption 2" },
  { id: "beach", src: "/avatars/avatar-beach.png", label: "Beach Weather" },
  { id: "lollipop", src: "/avatars/avatar-lollipop.png", label: "Lollipop Girl" },
  { id: "re4-ada", src: "/avatars/avatar-re4-ada.png", label: "Resident Evil 4 Ada" },
  { id: "smite-sol", src: "/avatars/avatar-smite-sol.png", label: "Smite Sol" },
  { id: "rdr2-molly", src: "/avatars/avatar-rdr2-molly.png", label: "RDR2 Molly" },
  { id: "tuna", src: "/avatars/avatar-tuna.png", label: "Tuna" },
  { id: "farcry5", src: "/avatars/avatar-farcry5-boomer.png", label: "Far Cry 5 Boomer" },
  { id: "twilight-giant", src: "/avatars/avatar-twilight-giant.png", label: "Chibi Giant" },
  { id: "twilight-chibi", src: "/avatars/avatar-twilight-chibi.png", label: "Chibi Rose" },
  { id: "twilight-falling", src: "/avatars/avatar-twilight-falling.png", label: "Falling Rose" },
  { id: "twilight-flower", src: "/avatars/avatar-twilight-flower.png", label: "Flower" },
  { id: "twilight-golem", src: "/avatars/avatar-twilight-golem.png", label: "Golem" },
  { id: "twilight-hurt", src: "/avatars/avatar-twilight-hurt.png", label: "Hurt Rose" },
  { id: "twilight-iron", src: "/avatars/avatar-twilight-iron.png", label: "Iron Maiden" },
  { id: "twilight-mushroom", src: "/avatars/avatar-twilight-mushroom.png", label: "Mushroom" },
  { id: "twilight-orb", src: "/avatars/avatar-twilight-orb.png", label: "Orb" },
  { id: "twilight-peaceful", src: "/avatars/avatar-twilight-peaceful.png", label: "Peaceful Rose" },
  { id: "twilight-rabbit", src: "/avatars/avatar-twilight-rabbit.png", label: "Rabbit" },
  { id: "twilight-rose", src: "/avatars/avatar-twilight-rose.png", label: "Rose" },
  { id: "twilight-sitting", src: "/avatars/avatar-twilight-sitting.png", label: "Sitting Rose" },
  { id: "mind-zero", src: "/avatars/avatar-mind-zero.png", label: "Mind Zero" },
  { id: "gothic-prayer", src: "/avatars/avatar-gothic-prayer.png", label: "Gothic Prayer" },
];

// Check if an avatar string is an image path
export function isImageAvatar(avatar: string): boolean {
  return avatar.startsWith("/avatars/");
}
