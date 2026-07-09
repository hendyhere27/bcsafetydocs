// BC WorkSafeBC OHS Regulation Part 9 (Confined Spaces) reference data.
// Source: BC Safety Docs Confined Space Entry Permit (BC_Confined_Space_Entry_Permit_Part9.docx),
// which references B.C. Reg. 296/97, OHS Regulation Part 9, sections 9.1, 9.25, 9.29-9.36.

export const DISCLAIMER =
  "Working tool only — must be reviewed by a qualified person and verified against the current " +
  "WorkSafeBC OHS Regulation (B.C. Reg. 296/97, Part 9) before use. Not legal or regulatory advice.";

export const hazardClassifications = {
  low: {
    level: "LOW HAZARD",
    definition:
      "Clean respirable air: O2 approximately 20.9%, no measurable flammable gas/vapour, " +
      "no contaminant exceeding 10% of its exposure limit.",
    sections: ["s.9.1"],
  },
  moderate: {
    level: "MODERATE HAZARD",
    definition:
      "Not clean respirable air, but the atmosphere still permits unaided escape if " +
      "ventilation or the respirator fails.",
    sections: ["s.9.25"],
  },
  high: {
    level: "HIGH HAZARD",
    definition:
      "Atmosphere may cause death, incapacitation, injury, acute illness, or prevent " +
      "unaided escape if ventilation or the respirator fails.",
    sections: ["s.9.25"],
  },
  notes: [
    "The classification rationale must be documented on the entry permit (why the classification was assigned).",
    "Continuous monitoring is required if a flammable/explosive atmosphere >20% LEL could develop during entry (s.9.34).",
  ],
};

export const atmosphericThresholds = {
  oxygen: { parameter: "O2 minimum", limit: ">= 19.5%", note: "Clean respirable air is approximately 20.9% O2 (s.9.1)" },
  lel: { parameter: "LEL action threshold", limit: "< 20% LEL", note: "Continuous monitoring required if >20% LEL could develop during entry (s.9.34)" },
  h2s: { parameter: "H2S ceiling", limit: "<= 10 ppm (ceiling)", note: "Ceiling limit — never to be exceeded" },
  co: { parameter: "CO", limit: "< 25 ppm TWA", note: "TLV time-weighted average" },
  retest: {
    parameter: "Retest interval",
    limit: "Retest required if all workers absent from the space for more than 20 minutes",
    note: "s.9.34",
  },
};

export const ventilationRequirements = {
  low: {
    hazardLevel: "LOW",
    requirement:
      "Minimum 85 m³/h (50 cfm) of clean respirable air per worker via mechanical ventilation, " +
      "unless all low-hazard exceptions are met.",
    sections: ["s.9.30-9.32"],
  },
  moderate: {
    hazardLevel: "MODERATE",
    requirement:
      "Continuous mechanical ventilation supplying clean respirable air required at all times.",
    sections: ["s.9.31"],
  },
  high: {
    hazardLevel: "HIGH",
    requirement:
      "Continuous mechanical ventilation required; natural ventilation is NOT permitted. " +
      "Supplied-air respirator or SCBA required when ventilation is insufficient.",
    sections: ["s.9.29", "s.9.32"],
  },
};

export const standbyRequirements = {
  low: {
    hazardLevel: "LOW",
    requirement:
      "1 standby person; continuous means to summon rescue; checks on workers at least every 20 minutes.",
    sections: ["s.9.35"],
  },
  moderate: {
    hazardLevel: "MODERATE",
    requirement:
      "1 or more standby persons at or near the entrance; visual checks at least every 20 minutes; " +
      "continuous means to summon rescue.",
    sections: ["s.9.35"],
  },
  high: {
    hazardLevel: "HIGH",
    requirement:
      "1 or more standby persons AT the entrance continuously attending; continuously monitoring workers; " +
      "capable of immediate rescue; must prevent lifeline entanglement. An emergency escape respirator must be " +
      "within arm's reach of or on each entrant at all times.",
    sections: ["s.9.35", "s.9.36"],
  },
};

export const isolationLockoutPurge = {
  title: "Isolation, Lockout & Purge Verification",
  sections: ["s.9.30-9.32"],
  checklist: [
    "All energy sources isolated and locked out (LOTO per OHS Regulation Part 10)",
    "Pipelines: double block and bleed confirmed (bleed checked within 20 minutes of entry)",
    "Space purged and ventilated prior to atmospheric testing",
    "Mechanical ventilation running with flow confirmed (minimum 85 m³/h per worker for low hazard)",
    "Supplied-air / SCBA determination recorded (required for moderate and high hazard per s.9.29)",
    "Isolation/lockout details recorded: equipment ID, lock numbers, person responsible",
  ],
};

export const requiredEquipment = {
  title: "Required PPE & Equipment",
  items: [
    "CSA Grade 1 safety footwear",
    "Hard hat (CSA Z94.1)",
    "Safety glasses / goggles",
    "Face shield",
    "SCBA (self-contained breathing apparatus)",
    "Supplied-air respirator",
    "Emergency escape respirator (HIGH hazard: within arm's reach of or on each entrant at all times, s.9.36)",
    "Air-purifying respirator (type must be specified)",
    "Safety harness & lifeline",
    "Tripod / mechanical retrieval device",
    "Chemical-resistant gloves",
    "High-visibility vest",
    "Personal gas monitor",
    "Continuous area gas monitor",
    "Intrinsically safe lighting",
  ],
  recordkeeping: [
    "Respiratory / supplied-air details: type, tank pressure, duration, cylinder number",
    "Hazard-specific equipment details: H2S monitor calibration date, escape pack location, etc.",
  ],
};

export const rescuePlan = {
  title: "Rescue Plan",
  elements: [
    "Rescue method: non-entry retrieval or entry rescue (must be specified)",
    "Rescue equipment on site: tripod, SCBA, stretcher, AED, etc.",
    "Emergency contact / phone number",
    "Nearest hospital / AED location",
  ],
};

export const permitStructure = {
  title: "BC Confined Space Entry Permit — structure per WorkSafeBC OHS Regulation Part 9",
  regulation: "B.C. Reg. 296/97, sections 9.1, 9.25, 9.29-9.36",
  sections: [
    {
      number: 1,
      name: "Permit Identification",
      fields: [
        "Permit No.", "Issue Date", "Permit Valid Until (date/time)", "Company/Employer",
        "Worksite/Project Name", "Confined Space Location/ID (address, tag no., drawing ref.)",
        "Description of Space (tank / vault / manhole / pit / sump — be specific)",
        "Work to be Performed Inside Space",
      ],
    },
    {
      number: 2,
      name: "Atmospheric Hazard Classification (s.9.1 / s.9.25)",
      fields: ["LOW / MODERATE / HIGH classification checkbox", "Classification rationale (document why)"],
    },
    {
      number: 3,
      name: "Isolation, Lockout & Purge Verification (s.9.30-9.32)",
      fields: ["Checklist items (see isolation/lockout/purge data)", "Isolation/lockout details"],
    },
    { number: 4, name: "Required PPE & Equipment", fields: ["Equipment checklist", "Respiratory/supplied-air details", "Other hazard-specific equipment"] },
    { number: 5, name: "Standby Person Requirements (s.9.35 / s.9.36)", fields: ["Standby person name(s)", "Standby person qualifications/training"] },
    { number: 6, name: "Rescue Plan", fields: ["Rescue method", "Rescue equipment on site", "Emergency contact", "Nearest hospital / AED location"] },
    { number: 7, name: "Authorized Entrants", fields: ["Entrant name (print)", "Signature (entry)", "Time in", "Time out / initials"] },
    {
      number: 8,
      name: "Authorization & Closure",
      fields: [
        "Issuing supervisor signature (confirms conditions safe, controls in place, entrants briefed)",
        "Closing supervisor signature (formally closes permit, records time all workers exited)",
      ],
    },
  ],
  page2: {
    name: "Page 2: Atmospheric Monitoring Continuation",
    contents: [
      "Ventilation requirements summary (s.9.30-9.32)",
      "Extended atmospheric monitoring log (16 rows): test time, O2 %, LEL %, H2S ppm, CO ppm, other gas, equipment & calibration date, tester name & signature (s.9.34)",
      "Entrants continuation log",
      "Supervisor notes / deviations / permit amendments",
      "Permit amendment signatures (if conditions change, re-evaluate and re-authorize)",
    ],
  },
};

export const sectionIndex = {
  "9.1": "Definitions, including 'clean respirable air' (O2 ~20.9%, no measurable flammable gas/vapour, no contaminant >10% of exposure limit) — basis for LOW hazard classification.",
  "9.25": "Atmospheric hazard classification — MODERATE (atmosphere permits unaided escape on ventilation/respirator failure) and HIGH (atmosphere may cause death, incapacitation, injury, acute illness, or prevent unaided escape).",
  "9.29": "Supplied-air respirator and SCBA requirements — required for moderate and high hazard atmospheres; required for high hazard when ventilation is insufficient.",
  "9.30": "Ventilation and purge requirements — space purged and ventilated prior to atmospheric testing; minimum 85 m³/h (50 cfm) clean respirable air per worker for low hazard.",
  "9.31": "Continuous mechanical ventilation — required at all times for moderate hazard atmospheres.",
  "9.32": "High hazard ventilation — continuous mechanical ventilation required, natural ventilation not permitted; supplied-air/SCBA when ventilation insufficient.",
  "9.34": "Atmospheric testing and monitoring — retest if all workers absent more than 20 minutes; continuous monitoring if flammable/explosive atmosphere >20% LEL could develop during entry.",
  "9.35": "Standby person requirements per hazard level — LOW: 1 standby, rescue summons, 20-minute checks; MODERATE: 1+ at/near entrance, visual checks every 20 minutes; HIGH: 1+ AT entrance continuously attending, continuous monitoring, capable of immediate rescue, prevent lifeline entanglement.",
  "9.36": "High hazard escape respirator — emergency escape respirator must be within arm's reach of or on each entrant at all times.",
};
