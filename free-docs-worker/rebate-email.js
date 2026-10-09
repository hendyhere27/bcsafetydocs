// Builds the emailed COR incentive breakdown from a calculate() result.
// All numbers come from cor-rebate-logic.js on the server, never the client.
import { CONSTANTS, fmt } from "../cor-rebate-logic.js";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const money = (n) => "$" + (Math.round(n * 100) / 100).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const LINKS = [
  ["WorkSafeBC: COR incentives (how it is calculated and paid)", "https://www.worksafebc.com/en/health-safety/create-manage/certificate-recognition/incentives"],
  ["WorkSafeBC: find your classification unit and base rate", "https://www.worksafebc.com/en/insurance/know-coverage-costs/find-classification-industry-rate"],
  ["WorkSafeBC: certifying partners by sector", "https://www.worksafebc.com/en/health-safety/create-manage/certificate-recognition/certifying-partners"],
];

export function buildRebateEmail(r) {
  const { inputs, assessablePayroll, capApplied, cap, basePremium, tenPercent, floor, floorApplied, annual, threeYear } = r;
  const kit = CONSTANTS.KIT_PRICE;

  const steps = [
    ["Annual payroll you entered", money(inputs.payroll)],
    ...(inputs.workers
      ? [[`Workers entered`, String(inputs.workers)]]
      : []),
    ...(capApplied
      ? [[`Per-worker cap applied (${inputs.workers} × ${money(CONSTANTS.MAX_WAGE)}, ${CONSTANTS.MAX_WAGE_YEAR} maximum)`, money(cap)]]
      : []),
    ["Assessable payroll used", money(assessablePayroll)],
    ["Base rate per $100", String(inputs.baseRate)],
    ["Base premium (payroll × rate ÷ 100)", money(basePremium)],
    ["10% of base premium", money(tenPercent)],
    [`Minimum incentive (lesser of $1,000 or 75% of premiums)`, money(floor)],
    [floorApplied ? "Estimated incentive (the minimum is higher, so it applies)" : "Estimated incentive (10% is higher than the minimum)", money(annual)],
  ];

  const stepRows = steps
    .map(
      ([a, b], n) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #E5E5E5;font-size:14px;color:#444;${n === steps.length - 1 ? "font-weight:700;color:#1A1A1A;" : ""}">${esc(a)}</td>` +
        `<td style="padding:8px 0;border-bottom:1px solid #E5E5E5;font-size:14px;text-align:right;white-space:nowrap;${n === steps.length - 1 ? "font-weight:700;color:#1A1A1A;" : "color:#1A1A1A;"}">${esc(b)}</td></tr>`
    )
    .join("");

  const yearRows = [1, 2, 3]
    .map(
      (y) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #E5E5E5;font-size:14px;color:#444;">Incentive year ${y} (while certified)</td>` +
        `<td style="padding:8px 0;border-bottom:1px solid #E5E5E5;font-size:14px;text-align:right;color:#1A1A1A;">${money(annual)}</td></tr>`
    )
    .join("");

  const kitLine =
    annual >= kit
      ? `The kit costs $${kit} CAD, one time. Your estimated incentive is ${fmt(annual)} a year, about ${r.kitMultiple}× the kit price.`
      : `The kit costs $${kit} CAD, one time. Your estimated incentive is ${fmt(annual)} a year, so it would take about ${r.paybackYears} years of incentives to equal the kit price.`;

  const linkRows = LINKS.map(
    ([t, u]) => `<li style="margin:4px 0;"><a href="${esc(u)}" style="color:#1A5276;">${esc(t)}</a></li>`
  ).join("");

  const caveats = [
    "The incentive is paid after you are certified: WorkSafeBC starts considering payments in the second quarter of the year after certification, and expects to credit your assessment account by the end of June.",
    "You have to pass a certification audit through your sector's certifying partner and keep the certificate valid with annual maintenance audits. This estimate is not a promise that you will pass or receive an incentive.",
    "WorkSafeBC can withhold it: for example if payroll isn't reported on time, or after an administrative penalty or a health and safety conviction.",
    "The estimate uses your base rate, not your net rate (experience rating changes what you pay but the incentive formula uses the classification unit base rate), and one classification unit. With several units, work each out separately; the minimum applies once to the account.",
    `The per-worker cap is the ${CONSTANTS.MAX_WAGE_YEAR} maximum wage rate (${money(CONSTANTS.MAX_WAGE)}). It's an upper-bound estimate; use the assessable payroll on your WorkSafeBC payroll report for a precise figure.`,
    "The estimate leaves out what getting certified costs: your time, partner registration or program fees, any external auditor, and training for your internal auditor. Fees differ by partner and change; ask yours.",
  ];
  const caveatItems = caveats.map((c) => `<li style="margin:6px 0;font-size:14px;line-height:1.55;color:#444;">${esc(c)}</li>`).join("");

  const html =
    `<!doctype html><html><body style="margin:0;background:#F4F4F4;font-family:Arial,Helvetica,sans-serif;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 10px;">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:6px;overflow:hidden;">` +
    `<tr><td style="background:#1A1A1A;padding:18px 24px;color:#fff;font-size:18px;font-weight:800;letter-spacing:.04em;">BC<span style="color:#F5C400;">SAFETY</span>DOCS</td></tr>` +
    `<tr><td style="padding:24px;">` +
    `<div style="font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#C0392B;">COR incentive estimate</div>` +
    `<div style="font-size:26px;font-weight:800;color:#1A1A1A;margin:6px 0 4px;">Up to ${esc(fmt(annual))} a year</div>` +
    `<div style="font-size:15px;color:#444;margin-bottom:16px;">About ${esc(fmt(threeYear))} over three incentive years, if you get certified and stay certified.</div>` +
    `<div style="font-size:15px;font-weight:700;color:#1A1A1A;margin:18px 0 4px;">How we got there</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${stepRows}</table>` +
    `<div style="font-size:15px;font-weight:700;color:#1A1A1A;margin:22px 0 4px;">Three years</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${yearRows}` +
    `<tr><td style="padding:8px 0;font-size:14px;font-weight:700;color:#1A1A1A;">Total</td><td style="padding:8px 0;font-size:14px;text-align:right;font-weight:700;color:#1A1A1A;">${money(threeYear)}</td></tr></table>` +
    `<div style="margin-top:22px;padding:16px;background:#FEF9E7;border-left:4px solid #F5C400;font-size:15px;line-height:1.55;color:#1A1A1A;">` +
    `<strong>${esc(kitLine)}</strong><br><span style="font-size:13px;color:#555;">The kit is 18 editable Word documents (the written program a COR audit looks for) plus a bonus audit quick reference. It is not certification.</span><br>` +
    `<a href="https://bcsafetydocs.com/cor-kit" style="display:inline-block;margin-top:10px;background:#F5C400;color:#1A1A1A;font-weight:700;text-decoration:none;padding:10px 18px;border-radius:3px;">See the COR kit</a></div>` +
    `<div style="font-size:15px;font-weight:700;color:#1A1A1A;margin:24px 0 4px;">Read before you rely on this number</div>` +
    `<ul style="padding-left:18px;margin:6px 0;">${caveatItems}</ul>` +
    `<div style="margin-top:18px;font-size:15px;font-weight:700;color:#1A1A1A;">Official WorkSafeBC pages</div>` +
    `<ul style="padding-left:18px;font-size:14px;">${linkRows}</ul>` +
    `<div style="margin-top:20px;padding:14px;background:#F4F4F4;border-left:4px solid #2C3E50;font-size:13px;line-height:1.55;color:#555;">` +
    `<strong>Please read:</strong> this is an estimate from the figures you entered and WorkSafeBC's published incentive rules (checked ${esc(CONSTANTS.CHECKED)}). WorkSafeBC decides eligibility and the amount. BC Safety Docs is independent and not affiliated with WorkSafeBC or any certifying partner. Not financial or legal advice.</div>` +
    `<p style="font-size:13px;color:#777;margin-top:20px;">You asked for this estimate at bcsafetydocs.com. Questions? Reply to this email or write <a href="mailto:info@bcsafetydocs.com" style="color:#1A5276;">info@bcsafetydocs.com</a>.</p>` +
    `</td></tr></table></td></tr></table></body></html>`;

  const text =
    `COR INCENTIVE ESTIMATE\n\nUp to ${fmt(annual)} a year. About ${fmt(threeYear)} over three incentive years, if you get certified and stay certified.\n\n` +
    `HOW WE GOT THERE\n${steps.map(([a, b]) => `${a}: ${b}`).join("\n")}\n\n` +
    `THREE YEARS\n${[1, 2, 3].map((y) => `Incentive year ${y} (while certified): ${money(annual)}`).join("\n")}\nTotal: ${money(threeYear)}\n\n` +
    `${kitLine}\nThe kit is 18 editable Word documents plus a bonus audit quick reference. It is not certification.\nhttps://bcsafetydocs.com/cor-kit\n\n` +
    `READ BEFORE YOU RELY ON THIS NUMBER\n${caveats.map((c) => `- ${c}`).join("\n")}\n\n` +
    `OFFICIAL WORKSAFEBC PAGES\n${LINKS.map(([t, u]) => `${t}: ${u}`).join("\n")}\n\n` +
    `This is an estimate from the figures you entered and WorkSafeBC's published incentive rules (checked ${CONSTANTS.CHECKED}). WorkSafeBC decides eligibility and the amount. BC Safety Docs is independent and not affiliated with WorkSafeBC or any certifying partner. Not financial or legal advice.\n\n` +
    `You asked for this estimate at bcsafetydocs.com. Questions? info@bcsafetydocs.com\n`;

  return {
    subject: `Your COR incentive estimate: up to ${fmt(annual)} a year`,
    html,
    text,
  };
}
