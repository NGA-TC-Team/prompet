"use client";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface Props {
  active: boolean;
  className?: string;
}

const DOTS: ReadonlyArray<{ cx: number; delay: number }> = [
  { cx: 5, delay: 0 },
  { cx: 12, delay: 0.12 },
  { cx: 19, delay: 0.24 },
];

/** Three-dot ellipsis whose dots ripple up-down sequentially while `active`. */
export function WaveDots({ active, className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      {DOTS.map(({ cx, delay }) => (
        <motion.circle
          key={cx}
          cx={cx}
          r={1.6}
          fill="currentColor"
          animate={active ? { cy: [12, 7, 12, 13, 12] } : { cy: 12 }}
          transition={
            active
              ? { duration: 0.85, repeat: Infinity, delay, ease: "easeInOut" }
              : { duration: 0.2 }
          }
        />
      ))}
    </svg>
  );
}
