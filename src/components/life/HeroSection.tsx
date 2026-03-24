"use client";

import { motion, useReducedMotion } from "framer-motion";

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function HeroSection() {
  const reduce = useReducedMotion();

  const fadeUp = reduce
    ? {
        initial: false as const,
        animate: { opacity: 1, y: 0 },
      }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
      };

  const transition = (delay: number) =>
    reduce
      ? { duration: 0 }
      : { duration: 0.55, ease: easeOut, delay };

  return (
    <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-accent/10 via-background to-background">
      <div
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl motion-reduce:opacity-60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-1/4 size-56 rounded-full bg-chart-2/15 blur-3xl motion-reduce:opacity-60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[min(100vw,42rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 blur-2xl"
        aria-hidden
      />

      <header className="relative mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16 sm:gap-7 sm:py-20">
        <motion.p
          className="inline-flex w-fit items-center gap-2 rounded-full border border-border/80 bg-card/85 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md"
          {...fadeUp}
          transition={transition(0)}
        >
          <span className="size-1.5 rounded-full bg-primary/70 ring-2 ring-primary/20" />
          Astro, Tailwind, shadcn, Motion
        </motion.p>

        <motion.h1
          className="text-balance font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]"
          {...fadeUp}
          transition={transition(0.06)}
        >
          How much time might you have left, in human-sized units?
        </motion.h1>

        <motion.p
          className="text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl sm:leading-relaxed"
          {...fadeUp}
          transition={transition(0.12)}
        >
          Pick your age, region table, and a few everyday factors. We turn
          population-style life expectancy into years, months, weeks, days, and
          beyond. Built for curiosity, not clinics.
        </motion.p>
      </header>
    </div>
  );
}
