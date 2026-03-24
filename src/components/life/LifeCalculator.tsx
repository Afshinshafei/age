"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Beer,
  Cigarette,
  ClipboardCopy,
  Globe2,
  HeartPulse,
  Moon,
  Ruler,
  Sparkles,
  Sun,
  Timer,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  estimateRemainingLife,
  getRegionLabel,
  type Activity as ActivityLevel,
  type Alcohol,
  type BmiBand,
  type GeneralHealth,
  type RegionKey,
  type Sex,
  type Smoking,
} from "@/lib/lifeExpectancy";
import { cn } from "@/lib/utils";

const MAX_YEAR_DOTS = 110;

function YearLifeDots({
  livedYears,
  expectedTotalYears,
}: {
  livedYears: number;
  expectedTotalYears: number;
}) {
  const total = Math.min(
    MAX_YEAR_DOTS,
    Math.max(1, Math.round(expectedTotalYears)),
  );
  const filled = Math.min(Math.max(0, Math.round(livedYears)), total);
  const remaining = total - filled;

  return (
    <div
      className="space-y-2"
      role="img"
      aria-label={`Estimated lifespan about ${total} years shown as dots: ${filled} filled for time already lived, ${remaining} open for time that may still lie ahead`}
    >
      <p className="text-muted-foreground text-xs leading-snug">
        One dot per year of estimated lifespan.{" "}
        <span className="text-foreground">Filled</span> is lived,{" "}
        <span className="text-foreground">open ring</span> is still ahead
        (rough model).
      </p>
      <div className="flex max-h-36 flex-wrap content-start gap-1 overflow-y-auto rounded-xl border border-border/60 bg-muted/30 p-2.5 sm:max-h-44">
        {Array.from({ length: total }, (_, i) => {
          const isLived = i < filled;
          return (
            <span
              key={i}
              title={
                isLived
                  ? `About year ${i + 1} of life (lived)`
                  : `About year ${i + 1} of life (ahead, estimate)`
              }
              className={cn(
                "size-2 shrink-0 rounded-full sm:size-2.5",
                isLived
                  ? "bg-primary shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_45%,transparent)]"
                  : "bg-transparent shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--color-muted-foreground)_35%,transparent)] dark:shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--color-muted-foreground)_50%,transparent)]",
              )}
            />
          );
        })}
      </div>
      <p className="text-muted-foreground font-mono text-[11px] tabular-nums">
        {filled} lived · {remaining} ahead · {total} in this strip
        {Math.round(expectedTotalYears) > MAX_YEAR_DOTS
          ? ` (capped at ${MAX_YEAR_DOTS} dots)`
          : null}
      </p>
    </div>
  );
}

const SEX_LABEL: Record<Sex, string> = {
  female: "Female",
  male: "Male",
};

const SMOKING_LABEL: Record<Smoking, string> = {
  never: "Never",
  former: "Former",
  current: "Current",
};

const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

const ALCOHOL_LABEL: Record<Alcohol, string> = {
  none: "None",
  light: "Light",
  heavy: "Heavy",
};

const BMI_LABEL: Record<BmiBand, string> = {
  underweight: "Underweight",
  normal: "Normal",
  overweight: "Overweight",
  obese: "Obese",
};

const HEALTH_LABEL: Record<GeneralHealth, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

function formatBig(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function CountUp({
  value,
  decimals = 1,
  reduceMotion,
}: {
  value: number;
  decimals?: number;
  reduceMotion: boolean;
}) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = value;
    const ctrl = animate(from, value, {
      duration: reduceMotion ? 0 : 0.85,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => ctrl.stop();
  }, [value, reduceMotion]);

  return <>{display.toFixed(decimals)}</>;
}

const listVariants = (reduce: boolean) =>
  reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.06, delayChildren: 0.05 },
        },
      };

const listItemVariants = (reduce: boolean) =>
  reduce
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 14 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.35, ease: "easeOut" as const },
        },
      };

export default function LifeCalculator() {
  const reduceMotion = useReducedMotion() ?? false;
  const [age, setAge] = useState(35);
  const [sex, setSex] = useState<Sex>("female");
  const [region, setRegion] = useState<RegionKey>("global");
  const [smoking, setSmoking] = useState<Smoking>("never");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [alcohol, setAlcohol] = useState<Alcohol>("light");
  const [bmi, setBmi] = useState<BmiBand>("normal");
  const [generalHealth, setGeneralHealth] = useState<GeneralHealth>("good");
  const [tickSeconds, setTickSeconds] = useState(0);
  /** Fractional seconds left for a smooth shrinking bar */
  const [secondsRemainingFrac, setSecondsRemainingFrac] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const dark = stored === "dark" || (!stored && prefersDark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }, []);

  const result = useMemo(
    () =>
      estimateRemainingLife({
        age,
        sex,
        region,
        lifestyle: {
          smoking,
          activity,
          alcohol,
          bmi,
          generalHealth,
        },
      }),
    [age, sex, region, smoking, activity, alcohol, bmi, generalHealth],
  );

  const baseSeconds = Math.floor(result.breakdown.totalSecondsApprox);

  useEffect(() => {
    let alive = true;
    const start = Date.now();
    const loop = () => {
      if (!alive) return;
      const elapsedSec = (Date.now() - start) / 1000;
      const remaining = Math.max(0, baseSeconds - elapsedSec);
      setSecondsRemainingFrac(remaining);
      setTickSeconds(Math.floor(remaining));
      if (remaining > 0 && alive) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => {
      alive = false;
    };
  }, [baseSeconds]);

  const copySummary = useCallback(async () => {
    const lines = [
      "Life window estimate (educational, not medical advice)",
      `Age: ${age}, sex: ${sex}, region: ${getRegionLabel(region)}`,
      `Estimated remaining: ${result.remainingYears.toFixed(1)} years`,
      `Roughly ${formatBig(result.breakdown.daysApprox)} days, ${formatBig(result.breakdown.hoursApprox)} hours`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [age, sex, region, result]);

  return (
    <div
      id="calculator"
      className="mx-auto w-full max-w-3xl scroll-mt-24 px-4 pb-20 pt-8 sm:pt-10"
    >
      <motion.div
        className="mb-8 flex items-center justify-between gap-4"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
            <Sparkles className="size-4 text-primary" aria-hidden />
          </span>
          <div className="min-w-0">
            <span className="text-sm font-medium text-foreground">Your life window</span>
            <p className="text-muted-foreground text-xs leading-snug">
              Tune inputs, watch the estimate respond
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
        >
          <Sun className="hidden size-4 dark:inline" />
          <Moon className="size-4 dark:hidden" />
        </Button>
      </motion.div>

      <div className="flex flex-col gap-8">
        <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md motion-reduce:transition-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="size-5" aria-hidden />
              Demographics
            </CardTitle>
            <CardDescription>
              Baseline comes from period-style remaining life tables by region
              and sex.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="age-slider">Age (years)</Label>
                <Input
                  id="age-number"
                  type="number"
                  min={0}
                  max={120}
                  className="w-20 text-right"
                  value={age}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v))
                      setAge(Math.min(120, Math.max(0, Math.round(v))));
                  }}
                  aria-label="Age in years"
                />
              </div>
              <Slider
                id="age-slider"
                min={0}
                max={100}
                value={[age]}
                onValueChange={(v) => setAge(v[0] ?? 0)}
                aria-label="Age slider"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Sex (table column)</Label>
                <Select
                  value={sex}
                  onValueChange={(v) => setSex(v as Sex)}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue>{SEX_LABEL[sex]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Region baseline</Label>
                <Select
                  value={region}
                  onValueChange={(v) => setRegion(v as RegionKey)}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue>{getRegionLabel(region)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">World average</SelectItem>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="high_income">High-income average</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md motion-reduce:transition-none">
          <CardHeader>
            <CardTitle className="text-lg">Lifestyle and health</CardTitle>
            <CardDescription>
              Small adjustments inspired by population studies. Totals are
              capped so the model stays conservative.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Cigarette className="size-3.5" aria-hidden />
                  Smoking
                </Label>
                <Select
                  value={smoking}
                  onValueChange={(v) => setSmoking(v as Smoking)}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue>{SMOKING_LABEL[smoking]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="former">Former</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Activity className="size-3.5" aria-hidden />
                  Activity
                </Label>
                <Select
                  value={activity}
                  onValueChange={(v) => setActivity(v as ActivityLevel)}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue>{ACTIVITY_LABEL[activity]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Beer className="size-3.5" aria-hidden />
                  Alcohol
                </Label>
                <Select
                  value={alcohol}
                  onValueChange={(v) => setAlcohol(v as Alcohol)}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue>{ALCOHOL_LABEL[alcohol]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Ruler className="size-3.5" aria-hidden />
                  BMI band
                </Label>
                <Select value={bmi} onValueChange={(v) => setBmi(v as BmiBand)}>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue>{BMI_LABEL[bmi]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="underweight">Underweight</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="overweight">Overweight</SelectItem>
                    <SelectItem value="obese">Obese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <HeartPulse className="size-3.5" aria-hidden />
                General health (your view)
              </Label>
              <Select
                value={generalHealth}
                onValueChange={(v) => setGeneralHealth(v as GeneralHealth)}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue>{HEALTH_LABEL[generalHealth]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${age}-${sex}-${region}-${smoking}-${activity}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
          >
            <Card className="border-primary/25 bg-gradient-to-br from-primary/5 via-card to-accent/10 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Globe2 className="size-6" aria-hidden />
                  Estimated time ahead
                </CardTitle>
                <CardDescription>
                  Based on ~<CountUp reduceMotion={reduceMotion} value={result.baselineRemainingYears} />{" "}
                  years remaining before lifestyle adjustments (table:{" "}
                  {getRegionLabel(region)}, {sex}).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  <CountUp reduceMotion={reduceMotion} value={result.remainingYears} /> years
                  <span className="text-muted-foreground text-lg font-normal">
                    {" "}
                    left on average
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Implied total lifespan about{" "}
                  <span className="font-medium text-foreground">
                    <CountUp reduceMotion={reduceMotion} value={result.expectedTotalYears} /> years
                  </span>
                  . You have already lived about{" "}
                  <span className="font-medium text-foreground">
                    <CountUp reduceMotion={reduceMotion} value={result.livedYears} decimals={0} />
                  </span>{" "}
                  years.
                </p>

                <YearLifeDots
                  livedYears={result.livedYears}
                  expectedTotalYears={result.expectedTotalYears}
                />

                <motion.ul
                  className="grid gap-3 sm:grid-cols-2"
                  variants={listVariants(reduceMotion)}
                  initial="hidden"
                  animate="show"
                >
                  {[
                    {
                      label: "Months (approx.)",
                      value: formatBig(result.breakdown.monthsApprox),
                    },
                    {
                      label: "Weeks (approx.)",
                      value: formatBig(result.breakdown.weeksApprox),
                    },
                    {
                      label: "Days (approx.)",
                      value: formatBig(result.breakdown.daysApprox),
                    },
                    {
                      label: "Hours (approx.)",
                      value: formatBig(result.breakdown.hoursApprox),
                    },
                    {
                      label: "Minutes (approx.)",
                      value: formatBig(result.breakdown.minutesApprox),
                    },
                    {
                      label: "Seconds (approx.)",
                      value: formatBig(result.breakdown.secondsApprox),
                    },
                  ].map((row) => (
                    <motion.li
                      key={row.label}
                      variants={listItemVariants(reduceMotion)}
                      className="rounded-lg border border-border/70 bg-card/90 px-3 py-2.5 shadow-sm transition-shadow hover:border-border hover:shadow-md"
                    >
                      <p className="text-muted-foreground text-xs">{row.label}</p>
                      <p className="font-mono text-base font-medium tabular-nums">
                        {row.value}
                      </p>
                    </motion.li>
                  ))}
                </motion.ul>

                <motion.div
                  className="relative overflow-hidden rounded-2xl border-2 border-primary/35 bg-gradient-to-br from-primary/20 via-background to-chart-2/15 p-1 shadow-[0_0_48px_-12px_color-mix(in_oklab,var(--color-primary)_55%,transparent)] dark:shadow-[0_0_56px_-8px_color-mix(in_oklab,var(--color-primary)_40%,transparent)]"
                  layout
                >
                  <div className="rounded-[0.85rem] bg-card/40 p-4 backdrop-blur-sm sm:p-5">
                    <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted/80 ring-1 ring-border/60">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary via-chart-2 to-primary"
                        initial={false}
                        animate={{
                          width: `${Math.min(100, Math.max(0, (secondsRemainingFrac / Math.max(1, baseSeconds)) * 100))}%`,
                        }}
                        transition={{
                          type: "tween",
                          duration: reduceMotion ? 0 : 0.4,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-2 ring-primary/25 sm:size-16">
                        <Timer
                          className="size-7 text-primary sm:size-8"
                          aria-hidden
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-primary mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-xs">
                          Seconds you can feel
                        </p>
                        <p className="text-muted-foreground mb-3 max-w-md text-xs sm:text-sm">
                          Toy ticker tied to the estimate above. It restarts when
                          you change inputs so you notice each second drop.
                        </p>
                        <div className="relative">
                          <motion.span
                            key={tickSeconds}
                            className="block font-mono text-5xl leading-none tabular-nums tracking-tighter text-foreground drop-shadow-sm sm:text-6xl md:text-7xl"
                            initial={
                              reduceMotion
                                ? false
                                : { scale: 1.12, filter: "brightness(1.25)" }
                            }
                            animate={{ scale: 1, filter: "brightness(1)" }}
                            transition={{
                              duration: reduceMotion ? 0 : 0.22,
                              ease: [0.34, 1.56, 0.64, 1],
                            }}
                          >
                            {tickSeconds.toLocaleString()}
                          </motion.span>
                          {!reduceMotion ? (
                            <motion.div
                              className="pointer-events-none absolute -inset-3 -z-10 rounded-xl bg-primary/10"
                              animate={{
                                opacity: [0.45, 0.08],
                                scale: [1, 1.04],
                              }}
                              transition={{
                                duration: 0.9,
                                repeat: Infinity,
                                repeatDelay: 0.15,
                                ease: "easeOut",
                              }}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <div>
                  <p className="mb-2 text-sm font-medium">Adjustments (years)</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {result.adjustments.map((a) => (
                      <li key={a.label} className="flex justify-between gap-4">
                        <span>{a.label}</span>
                        <span
                          className={
                            a.yearsDelta === 0
                              ? "text-muted-foreground"
                              : a.yearsDelta > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                          }
                        >
                          {a.yearsDelta > 0 ? "+" : ""}
                          {a.yearsDelta.toFixed(1)}
                        </span>
                      </li>
                    ))}
                    <Separator className="my-2" />
                    <li className="flex justify-between font-medium text-foreground">
                      <span>Net adjustment (capped)</span>
                      <span>
                        {result.adjustmentYears > 0 ? "+" : ""}
                        {result.adjustmentYears.toFixed(1)}
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={copySummary}
                  className="gap-2"
                >
                  <ClipboardCopy className="size-4" />
                  {copied ? "Copied" : "Copy summary"}
                </Button>
                <p className="text-muted-foreground text-xs sm:max-w-xs sm:text-right">
                  Not medical advice. Talk to a clinician about your health.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>

        <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md motion-reduce:transition-none">
          <CardHeader>
            <CardTitle className="text-base">Method and sources</CardTitle>
            <CardDescription>
              Rounded period-style remaining life expectancies, then simple
              lifestyle deltas from population research summaries.
            </CardDescription>
          </CardHeader>
          <CardContent className="max-w-none text-muted-foreground">
            <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed">
              <li>
                <a
                  className="text-primary underline-offset-4 hover:underline"
                  href="https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates"
                  target="_blank"
                  rel="noreferrer"
                >
                  WHO global health estimates
                </a>{" "}
                for broad population mortality patterns.
              </li>
              <li>
                <a
                  className="text-primary underline-offset-4 hover:underline"
                  href="https://www.ssa.gov/oact/STATS/table4c6.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  US SSA life tables
                </a>{" "}
                as a reference shape for the US curve.
              </li>
              <li>
                <a
                  className="text-primary underline-offset-4 hover:underline"
                  href="https://www.cdc.gov/nchs/products/life_tables.htm"
                  target="_blank"
                  rel="noreferrer"
                >
                  CDC / NCHS life tables
                </a>{" "}
                for national context.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
