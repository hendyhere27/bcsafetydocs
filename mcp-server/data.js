// BC WorkSafeBC OHS Regulation reference data for the bc-confined-space MCP server.
// Primary source: BC Safety Docs Confined Space Entry Permit (BC_Confined_Space_Entry_Permit_Part9.docx),
// referencing B.C. Reg. 296/97 (OHSR) Part 9 sections 9.1, 9.25, 9.29-9.36.
//
// Design rule: every tool response states what the regulation REQUIRES — never whether a
// specific situation is compliant. Compliance determinations require a qualified person.

export const LAST_VERIFIED = "2026-07-10";

export const CROSS_GAS_WARNING =
  "A normal O2 reading does not indicate a safe atmosphere. H2S and CO are lethal at " +
  "concentrations too small to measurably affect the oxygen percentage — a fatal CO or H2S " +
  "concentration will not move O2 outside its normal range. All four readings (O2, LEL, H2S, CO) " +
  "must independently meet their limits; a passing O2 reading clears nothing else.";

export const SCOPE_NOTE =
  "Reference information only. This states what the OHS Regulation requires — it is not a " +
  "determination that any specific entry, task, or workplace is compliant or safe. Entry and " +
  "compliance decisions must be made by a qualified person on site.";

export const DISCLAIMER =
  "Working tool only — must be reviewed by a qualified person and verified against the current " +
  "WorkSafeBC OHS Regulation (B.C. Reg. 296/97) before use. Not legal or regulatory advice.";

export const PRODUCTS = {
  confinedSpace: {
    name: "BC Confined Space Entry Permit (WorkSafeBC Part 9)",
    url: "https://bcsafetydocs.com/",
  },
  jsa: {
    name: "JSA / Field Level Hazard Assessment template",
    url: "https://bcsafetydocs.com/jsa.html",
  },
  flha: {
    name: "Daily FLHA form",
    url: "https://bcsafetydocs.com/flha.html",
  },
  hotWork: {
    name: "Hot Work Permit template",
    url: "https://bcsafetydocs.com/hot-work-permit.html",
  },
  loto: {
    name: "Lockout / Tagout Procedure template",
    url: "https://bcsafetydocs.com/loto.html",
  },
  incident: {
    name: "Incident Investigation Report template",
    url: "https://bcsafetydocs.com/incident-report.html",
  },
  emergency: {
    name: "Emergency Response Plan template",
    url: "https://bcsafetydocs.com/emergency-response.html",
  },
  swp: {
    name: "Safe Work Procedure template",
    url: "https://bcsafetydocs.com/safe-work-procedure.html",
  },
  bundle: {
    name: "Starter Bundle (Confined Space Permit + JSA)",
    url: "https://bcsafetydocs.com/bundle.html",
  },
};

// ---------------------------------------------------------------------------
// 1. Atmospheric limits (check_atmospheric_limits)
// ---------------------------------------------------------------------------

export const gasLimits = {
  oxygen: {
    gas: "Oxygen (O2)",
    unit: "% by volume",
    minimum: 19.5,
    normal: 20.9,
    limitStatement:
      "OHSR s.9.1 defines clean respirable air at approximately 20.9% O2 and requires no " +
      "contaminant above 10% of its exposure limit. BC's OHSR does not state a numeric O2 floor " +
      "directly (unlike OSHA 1910.146). 19.5% is the universal industry-standard threshold " +
      "(aligned with OSHA/ACGIH convention) used by a qualified person to determine an atmosphere " +
      "no longer meets the low-hazard definition.",
    crossGasWarning: CROSS_GAS_WARNING,
    ohsrReferences: ["OHSR s.9.1 (definition of clean respirable air)", "OHSR Part 9"],
    belowAction:
      "An atmosphere below the 19.5% industry-standard threshold clearly does not meet the OHSR " +
      "s.9.1 clean-respirable-air definition (~20.9% O2) and cannot be treated as low hazard. The " +
      "space must be classified moderate or high hazard (s.9.25), ventilated (s.9.30-9.32), and " +
      "supplied-air respirator or SCBA requirements under s.9.28(a) apply. Retest before any entry.",
    aboveNormalAction:
      "A reading materially above 20.9% indicates possible oxygen enrichment, which increases fire " +
      "and explosion risk. OHSR Part 9 requires identifying the enrichment source and having a " +
      "qualified person reassess the hazard classification before entry. Verify the applicable " +
      "enrichment limit against the current OHSR.",
  },
  lel: {
    gas: "Flammable gas/vapour (LEL)",
    unit: "% of Lower Explosive Limit",
    ceiling: 20,
    limitStatement:
      "OHSR Part 9 sets 20% LEL as the action threshold (s.9.25(6) / s.9.28(b)). 'Clean " +
      "respirable air' requires no measurable flammable gas or vapour (s.9.1). Continuous " +
      "monitoring is required if a flammable/explosive atmosphere exceeding 20% LEL could " +
      "develop during entry (s.9.25(6)).",
    ohsrReferences: ["OHSR s.9.1", "OHSR s.9.25(6) (continuous monitoring)", "OHSR s.9.28(b)"],
    exceedsAction:
      "OHSR s.9.25(6) requires continuous monitoring where an atmosphere exceeding 20% LEL could " +
      "develop. A reading at or above 20% LEL means the atmosphere does not meet the low-hazard " +
      "criteria (s.9.1); classification under s.9.25, ventilation under s.9.30-9.32, and ignition " +
      "source control requirements apply. Any measurable flammable gas means the s.9.1 " +
      "clean-respirable-air definition is not met.",
  },
  h2s: {
    gas: "Hydrogen sulphide (H2S)",
    unit: "ppm",
    ceiling: 10,
    ceilingType: "ceiling limit — never to be exceeded, even momentarily",
    limitStatement:
      "The BC exposure limit for H2S is a 10 ppm ceiling (OHSR s.5.48 exposure limits table; " +
      "referenced by the Part 9 permit as the confined space threshold).",
    ohsrReferences: ["OHSR s.5.48 (exposure limits)", "OHSR Part 9"],
    exceedsAction:
      "A ceiling limit must never be exceeded. OHSR requires that an atmosphere over the exposure " +
      "limit not be classified low hazard (s.9.1 allows no contaminant above 10% of its exposure " +
      "limit for low hazard); classification per s.9.25, ventilation per s.9.30-9.32, and " +
      "supplied-air/SCBA requirements per s.9.28(a) apply.",
  },
  co: {
    gas: "Carbon monoxide (CO)",
    unit: "ppm",
    twa: 25,
    twaType: "TLV-TWA (8-hour time-weighted average)",
    limitStatement:
      "The BC exposure limit for CO is 25 ppm as an 8-hour time-weighted average (OHSR s.5.48 " +
      "exposure limits table; referenced by the Part 9 permit).",
    ohsrReferences: ["OHSR s.5.48 (exposure limits)", "OHSR Part 9"],
    exceedsAction:
      "A spot reading at or above 25 ppm indicates the TWA limit could be exceeded over a shift. " +
      "OHSR s.9.1 permits no contaminant above 10% of its exposure limit for a low hazard " +
      "classification (i.e. 2.5 ppm CO for low hazard); above that, classification per s.9.25 and " +
      "the corresponding ventilation and respiratory protection requirements apply.",
  },
};

// ---------------------------------------------------------------------------
// 2. Confined space requirements by hazard characterization
// ---------------------------------------------------------------------------

export const confinedSpaceRequirements = {
  low: {
    hazardLevel: "LOW HAZARD",
    classificationCriteria:
      "Clean respirable air: O2 approximately 20.9%, no measurable flammable gas/vapour, no " +
      "contaminant above 10% of its exposure limit (OHSR s.9.1).",
    permit: [
      "Written entry permit identifying the space, the work, and the hazard classification with documented rationale",
      "Atmospheric test results recorded before entry (O2, LEL, H2S, CO as applicable)",
      "Isolation, lockout (per OHSR Part 10) and purge verification recorded",
      "Entrant sign-in/sign-out log",
      "Issuing supervisor authorization signature; formal closure signature when all workers have exited",
    ],
    ventilation:
      "Minimum 85 m³/h (50 cfm) of clean respirable air per worker via mechanical ventilation, " +
      "unless all low-hazard exceptions are met (OHSR s.9.31(1)).",
    standby:
      "1 standby person; continuous means to summon rescue; checks on workers at least every " +
      "20 minutes (OHSR s.9.34).",
    rescue:
      "Documented rescue plan: rescue method (non-entry retrieval or entry rescue), rescue " +
      "equipment on site, emergency contact, nearest hospital/AED location.",
    monitoring:
      "Retest required if all workers are absent from the space for more than 20 minutes (OHSR s.9.25(3)).",
    ohsrReferences: ["s.9.1", "s.9.25(3)", "s.9.31(1)", "s.9.34"],
  },
  moderate: {
    hazardLevel: "MODERATE HAZARD",
    classificationCriteria:
      "Not clean respirable air, but the atmosphere still permits unaided escape if ventilation " +
      "or the respirator fails (OHSR s.9.25).",
    permit: [
      "All low-hazard permit elements, plus:",
      "Supplied-air respirator or SCBA determination recorded (required per OHSR s.9.28(a))",
      "Respiratory/supplied-air details: type, tank pressure, duration, cylinder number",
    ],
    ventilation:
      "Continuous mechanical ventilation supplying clean respirable air required at all times (OHSR s.9.30).",
    standby:
      "1 or more standby persons at or near the entrance; visual checks at least every 20 minutes; " +
      "continuous means to summon rescue (OHSR s.9.35).",
    rescue:
      "Documented rescue plan as for low hazard; rescue capability must match the increased risk " +
      "of the atmosphere.",
    monitoring:
      "Retest if all workers absent more than 20 minutes (OHSR s.9.25(3)); continuous monitoring " +
      "if an atmosphere exceeding 20% LEL could develop during entry (OHSR s.9.25(6)).",
    ohsrReferences: ["s.9.25", "s.9.28(a)", "s.9.30", "s.9.35"],
  },
  high: {
    hazardLevel: "HIGH HAZARD",
    classificationCriteria:
      "Atmosphere may cause death, incapacitation, injury, acute illness, or prevent unaided " +
      "escape if ventilation or the respirator fails (OHSR s.9.25).",
    permit: [
      "All moderate-hazard permit elements, plus:",
      "Emergency escape respirator within arm's reach of or on each entrant at all times (OHSR s.9.36)",
      "Permit amendment signatures required if conditions change mid-job (re-evaluate and re-authorize)",
    ],
    ventilation:
      "Continuous mechanical ventilation required; natural ventilation NOT permitted " +
      "(OHSR s.9.33(2)(a)). Supplied-air respirator or SCBA required when ventilation is " +
      "insufficient (OHSR s.9.28(a) / s.9.32).",
    standby:
      "1 or more standby persons AT the entrance continuously attending; continuously monitoring " +
      "workers; capable of immediate rescue; must prevent lifeline entanglement (OHSR s.9.35 / s.9.36).",
    rescue:
      "Documented rescue plan with immediate-rescue capability: retrieval equipment (tripod, " +
      "harness, lifeline), SCBA for rescuers if entry rescue, stretcher/AED locations, emergency contacts.",
    monitoring:
      "Retest if all workers absent more than 20 minutes (OHSR s.9.25(3)); continuous monitoring " +
      "if an atmosphere exceeding 20% LEL could develop during entry (OHSR s.9.25(6)).",
    ohsrReferences: ["s.9.25", "s.9.28(a)", "s.9.32", "s.9.33(2)(a)", "s.9.35", "s.9.36"],
  },
  unknown: {
    hazardLevel: "NOT YET CLASSIFIED",
    classificationCriteria:
      "OHSR Part 9 requires the atmosphere to be classified (low / moderate / high per s.9.1 and " +
      "s.9.25) before entry requirements can be determined. Classification requires atmospheric " +
      "testing by a qualified person and a documented rationale on the entry permit.",
    permit: [
      "Atmospheric testing (O2, LEL, H2S, CO and any task-specific contaminants) before classification",
      "Documented classification rationale on the entry permit",
    ],
    ventilation: "Determined by classification (OHSR s.9.30-9.32).",
    standby: "Determined by classification (OHSR s.9.34 / s.9.35 / s.9.36).",
    rescue: "A documented rescue plan is required for every classification level.",
    monitoring: "OHSR s.9.25 testing and retest rules apply once entry begins.",
    ohsrReferences: ["s.9.1", "s.9.25"],
  },
};

// ---------------------------------------------------------------------------
// 3. Gas testing protocol
// ---------------------------------------------------------------------------

export const gasTestingProtocol = {
  sequence: [
    {
      step: 1,
      test: "Oxygen (O2)",
      why:
        "Test O2 first: combustible-gas (LEL) sensors read low in oxygen-deficient atmospheres, " +
        "so an LEL reading is only reliable once O2 is confirmed adequate.",
      limit: ">= 19.5% (industry-standard threshold; clean respirable air is ~20.9%, OHSR s.9.1)",
    },
    {
      step: 2,
      test: "Flammable gas/vapour (LEL)",
      why: "Fire/explosion risk must be ruled out before assessing toxics.",
      limit: "< 20% LEL; no measurable flammable gas for low hazard (OHSR s.9.1, s.9.25(6), s.9.28(b))",
    },
    {
      step: 3,
      test: "Toxic gases (H2S, CO, plus any task-specific contaminants)",
      why: "Toxic exposure assessment against BC exposure limits (OHSR s.5.48).",
      limit: "H2S <= 10 ppm ceiling; CO < 25 ppm TWA; <=10% of exposure limit for low hazard (s.9.1)",
    },
  ],
  generalRules: [
    "Test before entry, at all levels of the space (top, middle, bottom — gases stratify), and record results on the entry permit.",
    "Purge and ventilate the space BEFORE atmospheric testing (OHSR s.9.30-9.32); test results must reflect the entry condition.",
    "Record test time, readings, instrument used, and calibration date for every test — the permit's monitoring log requires equipment and calibration date per row.",
  ],
  retestRules: [
    "Retest required if all workers have been absent from the space for more than 20 minutes (OHSR s.9.25(3)).",
    "Continuous monitoring required if a flammable/explosive atmosphere exceeding 20% LEL could develop during entry (OHSR s.9.25(6)).",
    "If conditions change mid-job (new hazard introduced, ventilation interrupted), OHSR requires re-evaluation and re-authorization — the permit must be amended and re-signed.",
  ],
  instrumentRequirements: [
    "Calibrated multi-gas monitor (O2 / LEL / H2S / CO at minimum); calibration date must be recorded on the permit",
    "Bump test per manufacturer's instructions before use",
    "Personal gas monitor on entrants; continuous area monitor where continuous monitoring is required (s.9.25(6))",
    "Intrinsically safe equipment where a flammable atmosphere is possible",
  ],
  scenarios: {
    initial_entry: "Full 3-step sequence at all levels, recorded on the permit before authorization.",
    reentry_after_vacancy:
      "If all workers were out of the space for more than 20 minutes, a full retest is required " +
      "before re-entry (OHSR s.9.25(3)).",
    flammable_risk:
      "Where an atmosphere exceeding 20% LEL could develop during the work (e.g. coating, " +
      "hot work nearby, sludge disturbance), continuous monitoring is required for the duration " +
      "of entry (OHSR s.9.25(6)).",
    ongoing_work:
      "The permit's extended monitoring log (16 rows) records periodic readings for the duration " +
      "of entry: time, O2, LEL, H2S, CO, other gas, equipment and calibration date, tester signature.",
  },
  ohsrReferences: ["s.9.1", "s.9.25(3)", "s.9.25(6)", "s.9.30-9.32", "s.5.48"],
};

// ---------------------------------------------------------------------------
// 4. Required documentation by job type
// ---------------------------------------------------------------------------

export const requiredDocumentation = {
  confined_space_entry: {
    jobType: "Confined space entry",
    documents: [
      {
        order: 1,
        document: "Hazard assessment / space classification",
        purpose: "Identify and classify the atmospheric hazard (low/moderate/high) with documented rationale",
        basis: "OHSR s.9.1 / s.9.25",
      },
      {
        order: 2,
        document: "Lockout/tagout procedure and isolation verification",
        purpose: "All energy sources isolated and locked out; pipelines double-block-and-bleed",
        basis: "OHSR Part 10 (de-energization and lockout); s.9.30-9.32 for purge/isolation",
        product: "loto",
      },
      {
        order: 3,
        document: "Confined space entry permit",
        purpose:
          "Records classification, atmospheric tests, isolation, PPE, standby persons, rescue plan, " +
          "entrant log, and authorization/closure signatures",
        basis: "OHSR Part 9 (s.9.1, 9.25, 9.29-9.36)",
        product: "confinedSpace",
      },
      {
        order: 4,
        document: "Atmospheric monitoring log",
        purpose: "Ongoing readings during entry with instrument and calibration details",
        basis: "OHSR s.9.25",
        product: "confinedSpace",
      },
      {
        order: 5,
        document: "Rescue plan",
        purpose: "Method, equipment, emergency contacts, nearest hospital/AED",
        basis: "OHSR Part 9",
        product: "confinedSpace",
      },
    ],
  },
  hot_work: {
    jobType: "Hot work (welding, cutting, grinding)",
    documents: [
      {
        order: 1,
        document: "FLHA / hazard assessment for the task and location",
        purpose: "Identify fire hazards, combustibles within range, and required controls",
        basis: "Employer hazard assessment duties (Workers Compensation Act s.21; OHSR risk assessment provisions)",
        product: "jsa",
      },
      {
        order: 2,
        document: "Hot work permit",
        purpose: "Authorizes the work, records fire watch, extinguisher placement, and area preparation",
        basis: "OHSR Part 12 — Welding, Cutting and Allied Processes (verify exact sections against current OHSR)",
        product: "hotWork",
      },
      {
        order: 3,
        document: "Fire watch record",
        purpose: "Documents the fire watch during and after hot work",
        basis: "OHSR Part 12 / fire code requirements (verify against current OHSR and local fire code)",
      },
    ],
    note:
      "Hot work inside or adjacent to a confined space also triggers the full confined space " +
      "documentation set, and continuous atmospheric monitoring under OHSR s.9.25(6).",
  },
  excavation: {
    jobType: "Excavation / trenching",
    documents: [
      {
        order: 1,
        document: "Utility locates and drawings",
        purpose: "Underground utilities identified before ground is broken",
        basis: "OHSR Part 20 — Excavations (verify exact sections against current OHSR)",
      },
      {
        order: 2,
        document: "Written safe work procedure / sloping-shoring plan",
        purpose: "Cave-in protection method for the soil conditions and depth",
        basis: "OHSR Part 20 — Excavations (verify exact sections against current OHSR)",
        product: "swp",
      },
      {
        order: 3,
        document: "Daily FLHA and excavation inspection record",
        purpose: "Conditions re-assessed each shift and after weather or vibration changes",
        basis: "OHSR Part 20; employer hazard assessment duties",
        product: "flha",
      },
    ],
    note:
      "An excavation that qualifies as a confined space under OHSR Part 9 (enclosed or partially " +
      "enclosed, not designed for continuous occupancy) additionally requires the full confined " +
      "space documentation set, including classification and atmospheric testing.",
  },
  lockout_tagout: {
    jobType: "Lockout / tagout (equipment de-energization)",
    documents: [
      {
        order: 1,
        document: "Written lockout procedure (equipment-specific)",
        purpose: "Identifies all energy sources, isolation points, and verification steps",
        basis: "OHSR Part 10 — De-energization and Lockout",
        product: "loto",
      },
      {
        order: 2,
        document: "Lockout log / lock registry",
        purpose: "Records lock numbers, who applied them, and removal authorization",
        basis: "OHSR Part 10",
        product: "loto",
      },
    ],
  },
  daily_work: {
    jobType: "General daily field work",
    documents: [
      {
        order: 1,
        document: "FLHA / JSA completed before work begins",
        purpose: "Task-level hazard identification and controls, signed by the crew",
        basis: "Employer hazard assessment duties (Workers Compensation Act s.21; OHSR risk assessment provisions)",
        product: "flha",
      },
      {
        order: 2,
        document: "Safe work procedures for high-risk tasks",
        purpose: "Written procedures for tasks with recognized serious hazards",
        basis: "OHSR / WCA employer duties (verify task-specific OHSR parts)",
        product: "swp",
      },
    ],
  },
  incident: {
    jobType: "Incident / accident response",
    documents: [
      {
        order: 1,
        document: "Preliminary incident investigation report",
        purpose: "Immediate-cause investigation commenced right away (WorkSafeBC requires prompt preliminary investigation)",
        basis: "Workers Compensation Act, Part 2 Division 10 — employer investigation duties (verify current sections)",
        product: "incident",
      },
      {
        order: 2,
        document: "Full incident investigation report with corrective actions",
        purpose: "Root causes and corrective actions, submitted/retained per WorkSafeBC requirements",
        basis: "Workers Compensation Act, Part 2 Division 10 (verify current sections)",
        product: "incident",
      },
    ],
  },
  emergency_planning: {
    jobType: "Emergency preparedness",
    documents: [
      {
        order: 1,
        document: "Written emergency response plan",
        purpose: "Evacuation, rescue, first aid, and notification procedures for the worksite",
        basis: "OHSR Part 4 — emergency preparedness provisions (verify exact sections against current OHSR)",
        product: "emergency",
      },
      {
        order: 2,
        document: "Confined space rescue plan (where entries occur)",
        purpose: "Space-specific rescue method, equipment, and contacts",
        basis: "OHSR Part 9",
        product: "confinedSpace",
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// 5. FLHA / JSA requirements
// ---------------------------------------------------------------------------

export const flhaRequirements = {
  requiredContents: [
    "Date, worksite/location, and the specific task being assessed",
    "Task broken into steps, with the hazards of each step identified",
    "Risk ranking for each hazard (severity x likelihood, or the employer's adopted scheme)",
    "Controls for each hazard, following the hierarchy of controls (elimination, substitution, engineering, administrative, PPE)",
    "Required PPE listed for the task",
    "Names and signatures of all crew members performing the work",
    "Supervisor review/signature",
    "Provision to re-assess when conditions change (new hazard, new worker, weather, scope change)",
  ],
  timing:
    "Completed before work begins each day/shift and re-done when task, crew, or conditions change.",
  basis: [
    "Workers Compensation Act s.21 — employer's general duty to ensure worker health and safety",
    "OHSR risk assessment provisions applicable to the task (task-specific OHSR parts impose their own written assessment requirements — e.g. Part 9 for confined spaces, Part 20 for excavations)",
  ],
  taskTriggers: {
    "confined space":
      "A confined space task additionally requires classification and an entry permit under OHSR " +
      "Part 9 — the FLHA alone does not satisfy Part 9.",
    "hot work":
      "Hot work additionally requires a hot work permit and fire watch under OHSR Part 12 (verify " +
      "exact sections).",
    excavation:
      "Excavation work additionally requires utility locates and cave-in protection documentation " +
      "under OHSR Part 20 (verify exact sections).",
    electrical:
      "Electrical work additionally triggers OHSR Part 19 (electrical safety) requirements and, " +
      "where de-energization is used, Part 10 lockout documentation.",
    lockout:
      "Equipment de-energization requires written lockout procedures under OHSR Part 10.",
  },
};
