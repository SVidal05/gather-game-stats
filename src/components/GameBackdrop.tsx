import { motion } from "framer-motion";

interface GameBackdropProps {
  image: string;
  /** CSS object-position value, e.g. "50% 30%" */
  objectPosition?: string;
  /** Overlay opacity 0–1 (default 0.82) */
  overlayOpacity?: number;
  className?: string;
}

/**
 * Full-bleed blurred game artwork backdrop.
 * Place as the first child inside a `relative` container, then layer content on top with `relative z-10`.
 */
export function GameBackdrop({
  image,
  objectPosition = "50% 30%",
  overlayOpacity = 0.82,
  className = "",
}: GameBackdropProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl"
        style={{ objectPosition }}
        loading="lazy"
      />
      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0 bg-background"
        style={{ opacity: overlayOpacity }}
      />
      {/* Subtle gradient edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
    </motion.div>
  );
}
