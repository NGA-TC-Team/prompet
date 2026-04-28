"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "motion/react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
 * RunCat-style 4-frame gallop. Each frame coordinates body squash, leg
 * positions, tail rotation, and a tiny gravity bob. The cat's bottom edge in
 * the SVG is the ground plane: feet land at y=15 (close to the viewBox bottom)
 * so the SVG's bottom edge can sit on the workspace divider line.
 *
 * Vertical motion lives entirely inside the body group — the *position* of the
 * cat in the strip is fixed at bottom:0, only the body bobs/squashes within.
 * ──────────────────────────────────────────────────────────────────────────── */

interface Frame {
  body: { sx: number; sy: number; y: number };
  fl: { x2: number; y2: number };
  bl: { x2: number; y2: number };
  tail: number;
  headY: number;
}

const FRAMES: Frame[] = [
  // 0 — Stretched: forelegs forward, hindlegs back, body long & low.
  { body: { sx: 1.06, sy: 0.94, y: 0 }, fl: { x2: 30, y2: 15 }, bl: { x2: 4, y2: 15 }, tail: -16, headY: -0.4 },
  // 1 — Front planting, back swinging through.
  { body: { sx: 1.0, sy: 1.0, y: 0 }, fl: { x2: 27, y2: 15 }, bl: { x2: 9, y2: 12.5 }, tail: -4, headY: 0 },
  // 2 — Gathered: legs all under body, body short & tall, push moment.
  { body: { sx: 0.92, sy: 1.07, y: 0 }, fl: { x2: 22, y2: 12.5 }, bl: { x2: 13, y2: 12.5 }, tail: 12, headY: 0.4 },
  // 3 — Push-off: legs reaching out again, brief airborne (whole body lifts).
  { body: { sx: 1.0, sy: 1.0, y: -1.2 }, fl: { x2: 25, y2: 12.5 }, bl: { x2: 7, y2: 15 }, tail: 4, headY: 0 },
];

const FRAME_MS = 110;

function CatSide({ className }: { className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % FRAMES.length), FRAME_MS);
    return () => clearInterval(t);
  }, []);
  const F = FRAMES[i];
  const tween = { duration: (FRAME_MS / 1000) * 0.7, ease: "easeInOut" as const };

  return (
    <svg
      viewBox="0 0 40 16"
      fill="currentColor"
      stroke="none"
      className={className}
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      <motion.g
        animate={{ scaleX: F.body.sx, scaleY: F.body.sy, y: F.body.y }}
        transition={tween}
        style={{ transformOrigin: "20px 15px", transformBox: "view-box" }}
      >
        {/* Tail — sprouts from the upper-rear of the body (y≈7.5) so it reads
            as attached to the spine, not the legs. */}
        <motion.g
          animate={{ rotate: F.tail }}
          transition={tween}
          style={{ transformOrigin: "6px 7.5px", transformBox: "view-box" }}
        >
          <path d="M 5 7.5 Q 0 4 1.2 -0.4 Q 2.4 4 7 7.5 Z" />
        </motion.g>

        {/* Body silhouette */}
        <path d="M 6 11 V 9 Q 6 6 10 6 H 24 Q 27 6 27 9 V 11 Z" />

        {/* Head + ears (filled), then eye as a background-colored cutout */}
        <motion.g animate={{ y: F.headY }} transition={tween}>
          <circle cx="31" cy="8" r="3.2" />
          <path d="M 28.8 5.6 L 28 2.6 L 30.4 4.6 Z" />
          <path d="M 33.2 5.6 L 34 2.6 L 31.6 4.6 Z" />
          {/* eye — uses page background so it punches through the filled head;
              both currentColor and --background swap with the theme. */}
          <circle cx="32" cy="7.6" r="0.55" style={{ fill: "var(--background)" }} />
          {/* whiskers stay as fine strokes for character */}
          <path
            d="M 30 9 L 27.8 9.6"
            stroke="currentColor"
            strokeWidth={0.6}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 34 9 L 36.2 9.6"
            stroke="currentColor"
            strokeWidth={0.6}
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>

        {/* Legs as thin filled rectangles (rounded ends via stroke alongside) */}
        <motion.line
          x1="22"
          y1="11"
          animate={{ x2: F.fl.x2, y2: F.fl.y2 }}
          transition={tween}
          stroke="currentColor"
          strokeWidth={1.3}
          strokeLinecap="round"
        />
        <motion.line
          x1="24"
          y1="11"
          animate={{ x2: F.fl.x2 + 1.6, y2: F.fl.y2 }}
          transition={tween}
          stroke="currentColor"
          strokeWidth={1.3}
          strokeLinecap="round"
        />
        <motion.line
          x1="9"
          y1="11"
          animate={{ x2: F.bl.x2, y2: F.bl.y2 }}
          transition={tween}
          stroke="currentColor"
          strokeWidth={1.3}
          strokeLinecap="round"
        />
        <motion.line
          x1="11"
          y1="11"
          animate={{ x2: F.bl.x2 + 1.6, y2: F.bl.y2 }}
          transition={tween}
          stroke="currentColor"
          strokeWidth={1.3}
          strokeLinecap="round"
        />
      </motion.g>
    </svg>
  );
}

/**
 * Filled monochrome butterfly with a flapping animation.
 * Each wing pivots around the body axis (x=8) — scaleX [1, 0.25, 1] folds the
 * wing inward toward the body, then snaps back open. Both wings flap in sync.
 */
function Butterfly({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      stroke="none"
      className={className}
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      {/* Wings — both pivot around the body axis at x=8 for the flap. */}
      <motion.path
        d="M8 6.2 C 3.6 3.6, 1 5.4, 2.2 9.2 C 2.9 11.5, 5.5 11.4, 8 8.6 Z"
        animate={{ scaleX: [1, 0.25, 1] }}
        transition={{ duration: 0.32, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "8px 8px", transformBox: "view-box" }}
      />
      <motion.path
        d="M8 6.2 C 12.4 3.6, 15 5.4, 13.8 9.2 C 13.1 11.5, 10.5 11.4, 8 8.6 Z"
        animate={{ scaleX: [1, 0.25, 1] }}
        transition={{ duration: 0.32, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "8px 8px", transformBox: "view-box" }}
      />
      {/* Body — thin filled spindle so it stays crisp against bright backgrounds. */}
      <path d="M 8 3 Q 8.7 7 8 12.5 Q 7.3 7 8 3 Z" />
      {/* Antennae — fine strokes preserve the insect character. */}
      <path
        d="M 8 3 Q 7 1.8 6.2 1.2"
        stroke="currentColor"
        strokeWidth={0.7}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 8 3 Q 9 1.8 9.8 1.2"
        stroke="currentColor"
        strokeWidth={0.7}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

interface Props {
  className?: string;
}

// h-6 (24px) × viewBox aspect 40/16 = 60px wide cat element.
const CAT_PIXEL_WIDTH = 60;
const BUTTERFLY_PIXEL_WIDTH = 14;

export function CatButterfly({ className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(0);

  // Start with the butterfly already a comfortable trailing distance ahead
  // of the cat so the very first frame does not trigger a collision.
  const butterflyX = useMotionValue(110);
  const butterflyY = useMotionValue(0);
  const catX = useMotionValue(20);

  // Track container width via ResizeObserver so the butterfly's wandering
  // bounds stay in sync with the viewport.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      widthRef.current = el.getBoundingClientRect().width;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Refs that survive renders. The cat's head always faces right; "running"
  // is expressed by the in-place gallop animation plus this horizontal slide
  // along the line, so we don't track facing at all.
  const trailJitterRef = useRef(0);
  const jitterTargetRef = useRef(0);
  const phaseRef = useRef(0);
  const softTargetRef = useRef(20);

  // Butterfly: irregular hops, with vertical-priority escape when close to cat
  // and a no-fly zone around the cat so it can never land *on* the cat.
  useEffect(() => {
    let cancelled = false;
    let pending: Array<{ cancel: () => void }> = [];

    const wait = (ms: number) =>
      new Promise<void>((r) => {
        const id = setTimeout(r, ms);
        pending.push({ cancel: () => clearTimeout(id) });
      });

    async function loop() {
      while (!cancelled && widthRef.current < 60) await wait(80);

      while (!cancelled) {
        const w = widthRef.current;
        const bxNow = butterflyX.get();
        const byNow = butterflyY.get();
        const cx = catX.get();
        const catCenter = cx + CAT_PIXEL_WIDTH / 2;
        const dxToCat = bxNow - catCenter;
        const closeToCat = Math.abs(dxToCat) < 110;

        let targetX: number;
        let targetY: number;
        let duration: number;

        if (closeToCat) {
          // Near the cat, the butterfly basically only moves on the vertical
          // axis. ±2 px horizontal jitter is below the cat's flip threshold,
          // so the cat doesn't keep changing direction.
          targetX = Math.max(
            6,
            Math.min(w - BUTTERFLY_PIXEL_WIDTH - 6, bxNow + (Math.random() - 0.5) * 4),
          );
          const ySign = byNow > 0 ? -1 : 1;
          targetY = ySign * (3 + Math.random() * 4);
          duration = 0.35 + Math.random() * 0.45;
        } else {
          targetX = 6 + Math.random() * Math.max(0, w - BUTTERFLY_PIXEL_WIDTH - 12);
          targetY = -3 + Math.random() * 8;
          duration = 1.2 + Math.random() * 2.4;
        }

        // No-fly zone: never let the new target sit inside the cat's bbox.
        const noFlyMin = cx - 6;
        const noFlyMax = cx + CAT_PIXEL_WIDTH + 6;
        if (targetX > noFlyMin && targetX < noFlyMax) {
          targetX =
            Math.abs(targetX - noFlyMin) < Math.abs(targetX - noFlyMax)
              ? noFlyMin
              : noFlyMax;
          targetX = Math.max(6, Math.min(w - BUTTERFLY_PIXEL_WIDTH - 6, targetX));
        }

        const cAnim = animate(butterflyX, targetX, { duration, ease: "easeInOut" });
        const cAnimY = animate(butterflyY, targetY, { duration, ease: "easeInOut" });
        pending.push(cAnim, cAnimY);
        await Promise.all([cAnim, cAnimY]);
        pending = pending.filter((p) => p !== cAnim && p !== cAnimY);
        if (cancelled) break;
        await wait(closeToCat ? 220 + Math.random() * 320 : 220 + Math.random() * 620);
      }
    }
    void loop();
    return () => {
      cancelled = true;
      for (const p of pending) p.cancel();
    };
  }, [butterflyX, butterflyY, catX]);

  // Cat RAF — single mount for the lifetime of the strip. The cat never
  // turns around; horizontal sliding + the gallop frame cycle express
  // "running" on top of the divider line.
  useEffect(() => {
    const MIN_GAP = CAT_PIXEL_WIDTH + 6;
    const GAP_AMPLITUDE = 24;
    const MAX_STEP = 0.85;

    let raf = 0;
    // Real values set on mount (impure calls aren't allowed during render).
    softTargetRef.current = catX.get();
    phaseRef.current = Math.random() * Math.PI * 2;

    function tick() {
      const w = widthRef.current;

      trailJitterRef.current += (jitterTargetRef.current - trailJitterRef.current) * 0.04;
      if (Math.random() < 0.012) jitterTargetRef.current = -6 + Math.random() * 12;

      phaseRef.current += 0.018;
      const gap =
        MIN_GAP + (GAP_AMPLITUDE * (1 - Math.cos(phaseRef.current))) / 2 + trailJitterRef.current;
      const rawTarget = butterflyX.get() - gap;
      softTargetRef.current += (rawTarget - softTargetRef.current) * 0.025;
      const target = Math.max(
        -(CAT_PIXEL_WIDTH + 6),
        Math.min(w - CAT_PIXEL_WIDTH + 6, softTargetRef.current),
      );

      const current = catX.get();
      const smoothing = 0.04 + Math.random() * 0.02;
      const desired = (target - current) * smoothing;
      const step = Math.max(-MAX_STEP, Math.min(MAX_STEP, desired));
      let next = current + step;

      // Non-overlap clamp — always block on the butterfly's left (trailing).
      const bx = butterflyX.get();
      const catRight = next + CAT_PIXEL_WIDTH;
      if (catRight > bx && next < bx + BUTTERFLY_PIXEL_WIDTH) {
        next = bx - CAT_PIXEL_WIDTH;
      }
      catX.set(next);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Intentionally empty deps — RAF is owned for the strip's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none relative h-8 w-full text-muted-foreground/65", className)}
      aria-hidden="true"
    >
      {/* Butterfly — flies around in the upper half. */}
      <motion.div className="absolute top-1" style={{ x: butterflyX, y: butterflyY }}>
        <motion.div
          animate={{ rotate: [-12, 12, -12] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Butterfly className="h-3.5 w-3.5" />
        </motion.div>
      </motion.div>

      {/* Cat — bottom edge of the SVG is the ground line. Always faces right;
          horizontal motion + the gallop frame cycle express running. */}
      <motion.div className="absolute bottom-0 left-0" style={{ x: catX }}>
        <CatSide className="block h-6 w-auto" />
      </motion.div>
    </div>
  );
}
