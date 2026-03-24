import lifeTables from "@/data/lifeTables.json";

export type RegionKey = keyof typeof lifeTables.regions;
export type Sex = "male" | "female";

export type Smoking = "never" | "former" | "current";
export type Activity = "low" | "moderate" | "high";
export type Alcohol = "none" | "light" | "heavy";
export type BmiBand = "underweight" | "normal" | "overweight" | "obese";
export type GeneralHealth = "excellent" | "good" | "fair" | "poor";

export type LifestyleModifiers = {
  smoking: Smoking;
  activity: Activity;
  alcohol: Alcohol;
  bmi: BmiBand;
  generalHealth: GeneralHealth;
};

export type LifeInputs = {
  age: number;
  sex: Sex;
  region: RegionKey;
  lifestyle: LifestyleModifiers;
};

export type TimeBreakdown = {
  years: number;
  monthsApprox: number;
  weeksApprox: number;
  daysApprox: number;
  hoursApprox: number;
  minutesApprox: number;
  secondsApprox: number;
  totalSecondsApprox: number;
};

export type AdjustmentLine = {
  label: string;
  yearsDelta: number;
};

export type LifeEstimateResult = {
  baselineRemainingYears: number;
  adjustmentYears: number;
  adjustments: AdjustmentLine[];
  remainingYears: number;
  expectedTotalYears: number;
  livedYears: number;
  breakdown: TimeBreakdown;
  livedBreakdown: TimeBreakdown;
};

const AGES = lifeTables.ages as number[];

function interpolateRemaining(age: number, series: number[]): number {
  if (age <= AGES[0]) return series[0];
  const last = AGES.length - 1;
  if (age >= AGES[last]) return Math.max(0.05, series[last]);

  let i = 0;
  while (i < last && AGES[i + 1] < age) i++;

  const x0 = AGES[i];
  const x1 = AGES[i + 1];
  const y0 = series[i];
  const y1 = series[i + 1];
  const t = (age - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}

function lifestyleAdjustment(ls: LifestyleModifiers): AdjustmentLine[] {
  const lines: AdjustmentLine[] = [];

  const smoking: Record<Smoking, number> = {
    never: 0,
    former: -1.5,
    current: -7,
  };
  lines.push({
    label: "Smoking",
    yearsDelta: smoking[ls.smoking],
  });

  const activity: Record<Activity, number> = {
    low: -2,
    moderate: 0,
    high: 2.5,
  };
  lines.push({
    label: "Physical activity",
    yearsDelta: activity[ls.activity],
  });

  const alcohol: Record<Alcohol, number> = {
    none: 0,
    light: 0.3,
    heavy: -3.5,
  };
  lines.push({
    label: "Alcohol pattern",
    yearsDelta: alcohol[ls.alcohol],
  });

  const bmi: Record<BmiBand, number> = {
    underweight: -1,
    normal: 0,
    overweight: -1,
    obese: -2.8,
  };
  lines.push({
    label: "BMI category (self-report)",
    yearsDelta: bmi[ls.bmi],
  });

  const health: Record<GeneralHealth, number> = {
    excellent: 1,
    good: 0,
    fair: -2,
    poor: -4.5,
  };
  lines.push({
    label: "General health (subjective)",
    yearsDelta: health[ls.generalHealth],
  });

  return lines;
}

const DAYS_PER_YEAR = 365.25;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;

export function yearsToBreakdown(years: number): TimeBreakdown {
  const daysApprox = years * DAYS_PER_YEAR;
  const hoursApprox = daysApprox * HOURS_PER_DAY;
  const minutesApprox = hoursApprox * MINUTES_PER_HOUR;
  const secondsApprox = minutesApprox * SECONDS_PER_MINUTE;
  return {
    years,
    monthsApprox: years * 12,
    weeksApprox: daysApprox / 7,
    daysApprox,
    hoursApprox,
    minutesApprox,
    secondsApprox,
    totalSecondsApprox: secondsApprox,
  };
}

const MAX_ADJUSTMENT_MAGNITUDE = 12;

export function estimateRemainingLife(inputs: LifeInputs): LifeEstimateResult {
  const { age, sex, region, lifestyle } = inputs;

  const regionData = lifeTables.regions[region];
  const series = sex === "male" ? regionData.male : regionData.female;
  const baselineRemainingYears = interpolateRemaining(age, series);

  const adjLines = lifestyleAdjustment(lifestyle);
  let adjustmentYears = adjLines.reduce((s, l) => s + l.yearsDelta, 0);
  adjustmentYears = Math.max(
    -MAX_ADJUSTMENT_MAGNITUDE,
    Math.min(MAX_ADJUSTMENT_MAGNITUDE, adjustmentYears),
  );

  let remainingYears = baselineRemainingYears + adjustmentYears;
  remainingYears = Math.max(0.1, remainingYears);
  remainingYears = Math.min(remainingYears, 120 - age);

  const expectedTotalYears = age + remainingYears;
  const livedYears = age;

  return {
    baselineRemainingYears,
    adjustmentYears,
    adjustments: adjLines,
    remainingYears,
    expectedTotalYears,
    livedYears,
    breakdown: yearsToBreakdown(remainingYears),
    livedBreakdown: yearsToBreakdown(livedYears),
  };
}

export function getRegionLabel(key: RegionKey): string {
  return lifeTables.regions[key].label;
}

export const REGION_KEYS: RegionKey[] = ["global", "us", "high_income"];
