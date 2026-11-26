// WorkSafeBC OHS administrative penalty estimator (Workers Compensation Act s.95).
// Follows WorkSafeBC Prevention Manual Policy Item P2-95-5 "OHS Penalty Amounts".
// Figures checked 26 November 2026. Update STAT_MAX every January (s.333 CPI adjustment):
// https://www.worksafebc.com/en/law-policy/occupational-health-safety/cpi-adjustment

export const CONSTANTS = {
  YEAR: 2026,
  STAT_MAX: 816148.69,   // s.95(2) maximum OHS penalty, 2026
  CITATION_MAX: 1312.96, // s.94(2) maximum OHS citation, 2026
  RATE: 0.005,           // basic amount = 0.5% of penalty payroll
  MIN_BASIC: 1250,       // minimum basic amount
  CHECKED: "26 November 2026",
};

// Item 2(b): each circumstance doubles the basic amount; the doublings add
// (1 circumstance = 2x, 2 = 4x, 3 = 6x).
export const CIRCUMSTANCES = [
  { id: "highRisk", label: "High-risk violation" },
  { id: "intentional", label: "Intentional violation" },
  { id: "s73", label: "Discouraged a worker from reporting (s.73)" },
  { id: "s79", label: "Obstructed an officer or inspection (s.79)" },
  { id: "stopOrder", label: "Breached a stop-work or stop-use order" },
];

const round2 = (n) => Math.round(n * 100) / 100;

function parseMoney(v) {
  const s = String(v ?? "").replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}

export function calculate(input) {
  const payroll = parseMoney(input.payroll);
  if (!Number.isFinite(payroll) || payroll < 0) {
    return { ok: false, error: "Enter last year's payroll as a number, for example 650,000." };
  }
  if (payroll > 5e9) return { ok: false, error: "That payroll looks too large. Check the number." };

  const ids = new Set((input.circumstances || []).filter((c) => CIRCUMSTANCES.some((x) => x.id === c)));
  const k = ids.size;
  const priors = Math.max(0, Math.min(5, parseInt(input.priors, 10) || 0));

  const halfMax = round2(CONSTANTS.STAT_MAX / 2);
  const pct = round2(payroll * CONSTANTS.RATE);
  let basicPayroll = Math.max(CONSTANTS.MIN_BASIC, pct);
  const minApplied = pct < CONSTANTS.MIN_BASIC;
  const halfCapApplied = basicPayroll > halfMax;
  if (halfCapApplied) basicPayroll = halfMax;

  const circMult = k === 0 ? 1 : 2 * k;
  const basic = round2(basicPayroll * circMult);
  const repeatMult = 2 ** priors;
  let total = round2(basic * repeatMult);
  const maxApplied = total > CONSTANTS.STAT_MAX;
  if (maxApplied) total = CONSTANTS.STAT_MAX;

  return {
    ok: true,
    inputs: { payroll, circumstances: [...ids], priors },
    pct, basicPayroll: round2(basicPayroll), minApplied, halfCapApplied,
    k, circMult, basic, priors, repeatMult, total, maxApplied,
    low: round2(Math.min(total * 0.7, CONSTANTS.STAT_MAX)),
    high: round2(Math.min(total * 1.3, CONSTANTS.STAT_MAX)),
  };
}

export const fmt = (n) =>
  "$" + Number(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
