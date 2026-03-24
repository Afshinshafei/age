"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is this telling me when I will die?",
    a: "No. It is a rough educational model based on population averages and simple lifestyle tweaks. Real outcomes depend on genetics, environment, care, luck, and choices this toy cannot see.",
  },
  {
    q: "Where do the numbers come from?",
    a: "The starting curve is inspired by published remaining life expectancies (period-style tables) for broad regions. The sliders apply small deltas informed by summaries of smoking, activity, alcohol, weight, and self-rated health in population studies.",
  },
  {
    q: "Why do seconds and hours look so huge?",
    a: "They are straight multiplications from estimated years (using 365.25 days per year). They are meant to feel vivid, not precise to the minute.",
  },
  {
    q: "Can I use this on GitHub Pages?",
    a: "Yes. The site is static. Set your GitHub username in astro.config site (or SITE_URL in CI) and keep base aligned with your repository name.",
  },
];

export default function FaqSection() {
  const reduce = useReducedMotion();

  return (
    <section
      id="faq"
      className="mx-auto w-full max-w-3xl scroll-mt-24 px-4 pb-28"
      aria-labelledby="faq-heading"
    >
      <motion.div
        className="mb-8"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduce ? 0 : 0.45,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <p className="text-primary mb-2 text-xs font-semibold uppercase tracking-[0.18em]">
          Help
        </p>
        <h2
          id="faq-heading"
          className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Common questions
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed sm:text-base">
          Quick answers about what this calculator does and how to think about
          the numbers.
        </p>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduce ? 0 : 0.4,
          delay: reduce ? 0 : 0.06,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="rounded-2xl border border-border/70 bg-gradient-to-b from-card via-card to-muted/25 p-1 shadow-sm ring-1 ring-foreground/[0.04]"
      >
        <Accordion className="w-full px-1 pb-1">
          {faqs.map((item, i) => (
            <AccordionItem
              key={item.q}
              value={`item-${i}`}
              className="overflow-hidden rounded-xl px-0.5"
            >
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
