// COR readiness gap check: the ONE place the 13 elements, questions, scoring
// and document mapping live. Loaded by cor-gap-check.html (ES module) and
// imported by the free-docs worker (../cor-gap-logic.js), which re-scores from
// the raw answers so emailed results never come from the client.
//
// IMPORTANT framing: the 13-element list is the national framework used for the
// kit's coverage map. It has NOT been verified against any certifying partner's
// own (often gated) audit instrument, and partners differ (Energy Safety Canada
// uses 10 elements). This is a readiness check, never an audit score or a
// pass/fail prediction.

export const STATUS = ["have", "partial", "none"];
const POINTS = { have: 2, partial: 1, none: 0 };

export const SECTORS = {
  construction: "Construction",
  agriculture: "Agriculture",
  hospitality: "Hospitality / tourism",
  forestry: "Forestry",
  oilgas: "Oil & gas",
  other: "Other / not sure",
};

// kit:false = free email-gated template; kit:true = only in the COR kit.
export const DOCS = {
  policy: { title: "OHS Policy Statement", free: true, url: "/policy-statement.html" },
  hazardReg: { title: "Formal Hazard Assessment Register", free: false },
  jsa: { title: "JSA / Field Level Hazard Assessment", free: true, url: "/jsa.html" },
  flha: { title: "Daily FLHA Form", free: true, url: "/flha.html" },
  swp: { title: "Safe Work Procedure Template", free: true, url: "/safe-work-procedure.html" },
  confined: { title: "Confined Space Entry Permit", free: true, url: "/confined-space-permit.html" },
  hotwork: { title: "Hot Work Permit", free: true, url: "/hot-work-permit.html" },
  loto: { title: "Lockout / Tagout Procedure", free: true, url: "/loto.html" },
  rules: { title: "Health & Safety Company Rules", free: false },
  ppe: { title: "PPE Program", free: false },
  maint: { title: "Preventive Maintenance Program & Log", free: false },
  training: { title: "Worker Orientation & Training Record", free: false },
  meetings: { title: "Safety Meeting Report & Communication Log", free: false },
  inspect: { title: "Workplace Inspection Program & Checklist", free: false },
  incident: { title: "Incident Investigation Report", free: true, url: "/incident-report.html" },
  emergency: { title: "Emergency Response Plan", free: true, url: "/emergency-response.html" },
  records: { title: "Records & Statistics", free: false },
  legis: { title: "Legislation Access & Awareness Register", free: false },
};

export const ELEMENTS = [
  { id: 1, name: "Health & safety policy", basis: "OHSR s.3.3(a)",
    q: "Do you have a signed health and safety policy statement that sets out the aims and responsibilities of the employer, supervisors and workers?",
    ready: ["A signed, dated policy statement with a review date.", "Proof workers have seen it: posted, in orientation, or acknowledged."],
    docs: ["policy"] },
  { id: 2, name: "Hazard assessment & control", basis: "OHSR s.3.3(b)–(c), ss.3.9–3.10",
    q: "Do you identify hazards in writing, rate the risk, and record how each one is controlled?",
    ready: ["A hazard register by task or area, with risk ratings and controls.", "Field-level checks (JSA or daily FLHA) done before work, and updated after changes."],
    docs: ["hazardReg", "jsa", "flha"] },
  { id: 3, name: "Safe work practices", basis: "WCA s.21 · OHSR s.3.3",
    q: "Do you have written general safe work practices (the everyday rules for doing work safely) that workers have been shown?",
    ready: ["Written practices that match how the work is really done.", "A record that workers were shown them."],
    docs: ["swp"] },
  { id: 4, name: "Safe job procedures", basis: "OHSR Parts 9, 10, 12 · s.3.3",
    q: "Do you have written step-by-step procedures or permits for your higher-risk tasks, such as confined space entry, hot work or lockout? (If you don't do those, answer for your own highest-risk tasks.)",
    ready: ["Written procedures for each high-risk task, kept where the work happens.", "Completed permits or procedure sign-offs showing they are actually used."],
    docs: ["swp", "confined", "hotwork", "loto"] },
  { id: 5, name: "Company rules", basis: "WCA s.22",
    q: "Do you have written health and safety rules and a clear process for dealing with a breach, which workers have acknowledged?",
    ready: ["Written rules and a progressive response to breaches.", "Signed worker acknowledgments."],
    docs: ["rules"] },
  { id: 6, name: "Personal protective equipment", basis: "OHSR Part 8",
    q: "Do you have a written PPE program covering what is required for which task, who provides it, training, and inspection or replacement?",
    ready: ["A hazard-based PPE list by task.", "Records of PPE training and issue."],
    docs: ["ppe"] },
  { id: 7, name: "Preventive maintenance", basis: "OHSR ss.4.3, 4.9–4.10",
    q: "Do you have a schedule and records for inspecting and maintaining equipment and vehicles?",
    ready: ["An equipment list with a maintenance schedule.", "Signed inspection and maintenance entries."],
    docs: ["maint"] },
  { id: 8, name: "Training & communication", basis: "OHSR ss.3.23–3.25 · WCA ss.37, 43–45",
    q: "Do you orient new workers, keep training records, and hold regular safety meetings with written minutes?",
    ready: ["Orientation records for every new or reassigned worker.", "Safety meeting minutes across the year."],
    docs: ["training", "meetings"] },
  { id: 9, name: "Workplace inspections", basis: "OHSR ss.3.5, 3.7–3.8",
    q: "Do you inspect the workplace on a regular schedule, record what you find, and track fixes to completion?",
    ready: ["Completed inspection checklists on your set schedule.", "A corrective-action log showing items closed out."],
    docs: ["inspect"] },
  { id: 10, name: "Investigations & reporting", basis: "WCA ss.68–72",
    q: "Do you investigate incidents and near misses, record causes and corrective actions, and report to WorkSafeBC when required?",
    ready: ["Written investigations with causes and follow-up actions.", "A record of what you reported and when."],
    docs: ["incident"] },
  { id: 11, name: "Emergency preparedness", basis: "OHSR Part 4",
    q: "Do you have a written emergency plan (fire, first aid, evacuation, rescue as relevant to you) and have you practised it?",
    ready: ["A written plan with contacts, roles and muster points.", "Drill or practice records."],
    docs: ["emergency"] },
  { id: 12, name: "Statistics & records", basis: "OHSR s.3.3(f)",
    q: "Do you keep your inspection, training, meeting and incident records together, and review incident trends?",
    ready: ["One place where the records can be found quickly.", "A simple summary of incidents and corrective actions."],
    docs: ["records"] },
  { id: 13, name: "Legislation", basis: "WCA s.21(2)(f)",
    q: "Can workers find the Workers Compensation Act and OHS Regulation, and is a notice posted saying where they are kept?",
    ready: ["A posted notice saying where the Act and Regulation are kept.", "A record that workers know where to find them."],
    docs: ["legis"] },
];

// Suggested order to close gaps: the foundations first.
const PRIORITY = [1, 2, 9, 8, 10, 11, 3, 4, 7, 6, 12, 5, 13];

const LEVELS = {
  strong: { id: "strong", label: "Strong foundation", blurb: "Most elements are in place. Focus on keeping records going and closing the few remaining gaps." },
  partly: { id: "partly", label: "Partly there", blurb: "You have a base to build on. Closing the gaps, then running the system long enough to produce records, is the path to audit-ready." },
  early: { id: "early", label: "Early stages", blurb: "Most elements still need building. That's normal at the start: work through the gaps in the suggested order." },
};

export function assess(input) {
  const a = input && typeof input === "object" ? input : {};
  const answers = a.answers && typeof a.answers === "object" ? a.answers : {};
  const clean = {};
  for (const el of ELEMENTS) {
    const v = answers[el.id];
    if (!STATUS.includes(v)) return { ok: false, error: "Please answer all 13 questions." };
    clean[el.id] = v;
  }
  const sector = Object.prototype.hasOwnProperty.call(SECTORS, a.sector) ? a.sector : "other";

  let points = 0;
  const counts = { have: 0, partial: 0, none: 0 };
  for (const el of ELEMENTS) {
    points += POINTS[clean[el.id]];
    counts[clean[el.id]]++;
  }
  const percent = Math.round((points / (ELEMENTS.length * 2)) * 100);
  const level = percent >= 80 ? LEVELS.strong : percent >= 50 ? LEVELS.partly : LEVELS.early;

  const byId = Object.fromEntries(ELEMENTS.map((e) => [e.id, e]));
  const elements = ELEMENTS.map((e) => ({ id: e.id, name: e.name, basis: e.basis, status: clean[e.id], ready: e.ready, docs: e.docs.map((k) => ({ key: k, ...DOCS[k] })) }));
  const rank = (id) => PRIORITY.indexOf(id);
  const gapIds = ELEMENTS.map((e) => e.id)
    .filter((id) => clean[id] !== "have")
    .sort((x, y) => (POINTS[clean[x]] - POINTS[clean[y]]) || (rank(x) - rank(y)));
  const gaps = gapIds.map((id) => elements.find((e) => e.id === id));

  const seen = new Set();
  const gapDocs = [];
  for (const g of gaps) for (const d of g.docs) if (!seen.has(d.key)) { seen.add(d.key); gapDocs.push(d); }

  return {
    ok: true,
    answers: clean,
    sector,
    counts,
    points,
    percent,
    level,
    elements,
    gaps,
    top: gaps.slice(0, 3),
    gapDocs,
    freeDocs: gapDocs.filter((d) => d.free),
    kitDocs: gapDocs.filter((d) => !d.free),
  };
}

// Short, verified partner notes (sources: each partner's public pages and
// documents, checked 9 Oct 2026; see BC_COR_Audit_Quick_Reference_SOURCES.md).
export const PARTNER_NOTES = {
  construction: "BCCSA: Small COR is for 19 or fewer employees and can use your own trained internal auditor; Large COR (20 or more) needs an external auditor for certification. BCCSA says there should be at least 6 months of supporting evidence, with 12 months recommended.",
  agriculture: "AgSafe BC: small employers (19 or fewer full-time employees) can use a trained internal auditor or an AgSafe-approved external auditor; large employers use an external auditor for certification. AgSafe doesn't publish a minimum records period on the pages we checked, so ask them how much history you need.",
  hospitality: "go2HR: SECOR (Small Employer COR) is for fewer than 20 employees. Its Terms of Participation say an internal auditor can do the audits for under-20 employers, though its website audit page says external, so confirm with go2HR. No minimum records period is published on the pages we checked.",
  forestry: "BC Forest Safety Council (SAFE Companies): the audit reviews the 12 consecutive months before it, and small employers (2 to 19 workers) use an internal auditor. Its audit structure differs from the 13-element framework used here, so check BCFSC's own audit tool; much of the written-program content still overlaps.",
  oilgas: "Energy Safety Canada: COR is for 11 or more employees and SECOR for 10 or fewer. Its protocol uses 10 elements rather than 13, so check ESC's own audit protocol; much of the written-program content still overlaps. For SECOR, ESC advises having 12 months of documentation before the audit.",
  other: "Your certifying partner is normally the one for your sector; WorkSafeBC matches employers without a dedicated partner to the closest fit. Ask yours how much record history it expects before your first audit: BCCSA, for example, says at least 6 months with 12 recommended.",
};
