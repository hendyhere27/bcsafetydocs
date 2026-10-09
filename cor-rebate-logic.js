// COR incentive estimator: the ONE place the arithmetic lives.
// Loaded by cor-rebate-calculator.html (as an ES module) and imported by the
// free-docs worker (../cor-rebate-logic.js), which re-computes from the raw
// inputs so the emailed numbers never come from the client.
//
// Rules (WorkSafeBC "Incentives" page, re-read 2026-10-09):
//   incentive = assessable payroll x (classification unit base rate / 100) x 10%,
//   per classification unit, with a minimum of the lesser of $1,000 or 75% of
//   the premiums paid, applied at the account level. No maximum is stated.
//   Payment is considered from Q2 of the year AFTER certification.
// Per-worker cap: WorkSafeBC's maximum wage rate, $127,500 for 2026
//   (compensation-related maximum wage rates page, effective 2026-01-01).
//   Update MAX_WAGE each January (rate notification arrives in November).

export const CONSTANTS = {
  MAX_WAGE: 127500,
  MAX_WAGE_YEAR: 2026,
  INCENTIVE_PCT: 0.1,
  MIN_CAP: 1000,
  MIN_PCT: 0.75,
  KIT_PRICE: 279,
  CHECKED: "9 October 2026",
};

const LIMITS = {
  payroll: [10000, 50000000],
  workers: [1, 1000],
  baseRate: [0.05, 20],
};

const round2 = (n) => Math.round(n * 100) / 100;

function num(v) {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return NaN;
  const cleaned = v.replace(/[\s,$]/g, "");
  return cleaned === "" ? NaN : Number(cleaned);
}

// input: { payroll, workers?, baseRate }  (numbers or numeric strings)
export function calculate(input) {
  const i = input && typeof input === "object" ? input : {};
  const payroll = num(i.payroll);
  const baseRate = num(i.baseRate);
  const hasWorkers = i.workers !== undefined && i.workers !== null && String(i.workers).trim() !== "";
  const workers = hasWorkers ? num(i.workers) : null;

  if (!Number.isFinite(payroll) || payroll < LIMITS.payroll[0] || payroll > LIMITS.payroll[1]) {
    return { ok: false, error: "Enter your annual payroll in dollars (between $10,000 and $50,000,000)." };
  }
  if (!Number.isFinite(baseRate) || baseRate < LIMITS.baseRate[0] || baseRate > LIMITS.baseRate[1]) {
    return { ok: false, error: "Enter your base rate per $100 of payroll, for example 1.55 (between 0.05 and 20)." };
  }
  if (hasWorkers && (!Number.isInteger(workers) || workers < LIMITS.workers[0] || workers > LIMITS.workers[1])) {
    return { ok: false, error: "Number of workers must be a whole number, or leave it blank." };
  }

  // Per-worker cap: with a head-count, assessable payroll can't exceed
  // workers x the maximum wage rate. It's an upper bound on the cap's effect
  // (an uneven pay spread can push the real figure lower), so it is labelled
  // an estimate everywhere it appears.
  const cap = hasWorkers ? workers * CONSTANTS.MAX_WAGE : null;
  const capApplied = cap !== null && payroll > cap;
  const assessablePayroll = capApplied ? cap : payroll;

  const basePremium = round2((assessablePayroll * baseRate) / 100);
  const tenPercent = round2(basePremium * CONSTANTS.INCENTIVE_PCT);
  const floor = round2(Math.min(CONSTANTS.MIN_CAP, basePremium * CONSTANTS.MIN_PCT));
  const floorApplied = floor > tenPercent;
  const annual = Math.round(Math.max(tenPercent, floor));
  const threeYear = annual * 3;

  const kit = CONSTANTS.KIT_PRICE;
  const kitMultiple = annual > 0 ? Math.round((annual / kit) * 10) / 10 : 0;
  const paybackYears = annual > 0 ? Math.round((kit / annual) * 10) / 10 : null;

  return {
    ok: true,
    inputs: { payroll: round2(payroll), workers, baseRate: round2(baseRate) },
    assessablePayroll: round2(assessablePayroll),
    capApplied,
    cap,
    basePremium,
    tenPercent,
    floor,
    floorApplied,
    annual,
    threeYear,
    kit,
    kitMultiple,
    paybackYears,
  };
}

export const fmt = (n) =>
  "$" + Math.round(n).toLocaleString("en-CA", { maximumFractionDigits: 0 });
