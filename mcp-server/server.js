#!/usr/bin/env node
// bc-confined-space MCP server — WorkSafeBC (British Columbia) OHS Regulation reference tools.
//
// Design rules:
//  - Every response carries: ohsr_references, last_verified, plain_language, scope_note,
//    and (where genuinely relevant) related_product.
//  - Responses state what the regulation REQUIRES. They never state that a situation is
//    compliant, safe, or that entry is permitted — those are qualified-person determinations.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  LAST_VERIFIED,
  SCOPE_NOTE,
  DISCLAIMER,
  PRODUCTS,
  gasLimits,
  confinedSpaceRequirements,
  gasTestingProtocol,
  requiredDocumentation,
  flhaRequirements,
} from "./data.js";

const server = new McpServer({
  name: "bc-confined-space",
  version: "2.0.0",
});

function reply(payload, { references = [], plainLanguage, product } = {}) {
  const body = {
    ...payload,
    plain_language: plainLanguage,
    ohsr_references: references,
    last_verified: LAST_VERIFIED,
    scope_note: SCOPE_NOTE,
    disclaimer: DISCLAIMER,
  };
  if (product) {
    body.related_product = { name: PRODUCTS[product].name, url: PRODUCTS[product].url };
  }
  return { content: [{ type: "text", text: JSON.stringify(body, null, 2) }] };
}

// ---------------------------------------------------------------------------
// 1. check_atmospheric_limits
// ---------------------------------------------------------------------------

server.registerTool(
  "check_atmospheric_limits",
  {
    title: "Check a gas reading against WorkSafeBC exposure limits",
    description:
      "Check whether a gas monitor reading exceeds WorkSafeBC exposure limits before confined " +
      "space entry in British Columbia. Compares an oxygen (O2), flammable gas (LEL), hydrogen " +
      "sulphide (H2S), or carbon monoxide (CO) reading against the BC OHS Regulation limits " +
      "(OHSR s.9.1, s.5.48) and returns the applicable limit, the OHSR citation, and what the " +
      "regulation requires at that reading. Returns requirements, not a compliance or " +
      "entry-permission verdict.",
    inputSchema: {
      gas: z
        .enum(["oxygen", "lel", "h2s", "co"])
        .describe("Gas tested: oxygen (% vol), lel (% of LEL), h2s (ppm), co (ppm)"),
      reading: z.number().describe("The instrument reading, in the unit for that gas"),
    },
  },
  async ({ gas, reading }) => {
    const g = gasLimits[gas];
    let readingRelativeToLimit;
    let regulationRequires;

    if (gas === "oxygen") {
      if (reading < g.minimum) {
        readingRelativeToLimit = `below the ${g.minimum}% minimum`;
        regulationRequires = g.belowAction;
      } else if (reading > 22.0) {
        readingRelativeToLimit = `above normal atmospheric oxygen (~${g.normal}%) — possible enrichment`;
        regulationRequires = g.aboveNormalAction;
      } else {
        readingRelativeToLimit = `at or above the ${g.minimum}% minimum`;
        regulationRequires =
          "The reading meets the published O2 minimum. OHSR Part 9 still requires the full " +
          "classification (s.9.1/s.9.25), testing of flammables and toxics, and all other permit " +
          "requirements before entry — an acceptable O2 reading alone does not establish a low " +
          "hazard atmosphere.";
      }
    } else if (gas === "lel") {
      if (reading >= g.ceiling) {
        readingRelativeToLimit = `at or above the ${g.ceiling}% LEL action threshold`;
        regulationRequires = g.exceedsAction;
      } else if (reading > 0) {
        readingRelativeToLimit = `below the ${g.ceiling}% LEL action threshold, but measurable`;
        regulationRequires =
          "Any measurable flammable gas means the atmosphere does not meet the OHSR s.9.1 " +
          "clean-respirable-air definition, so the space cannot be classified low hazard on " +
          "atmosphere alone. If an atmosphere exceeding 20% LEL could develop during the work, " +
          "OHSR s.9.34 requires continuous monitoring.";
      } else {
        readingRelativeToLimit = "no measurable flammable gas";
        regulationRequires =
          "OHSR s.9.1 requires no measurable flammable gas or vapour for clean respirable air. " +
          "Continuous monitoring is still required under s.9.34 if an atmosphere exceeding 20% " +
          "LEL could develop during entry.";
      }
    } else if (gas === "h2s") {
      if (reading > g.ceiling) {
        readingRelativeToLimit = `above the ${g.ceiling} ppm ceiling`;
        regulationRequires = g.exceedsAction;
      } else if (reading > g.ceiling * 0.1) {
        readingRelativeToLimit = `at or below the ${g.ceiling} ppm ceiling, but above 10% of the exposure limit (1 ppm)`;
        regulationRequires =
          "OHSR s.9.1 permits no contaminant above 10% of its exposure limit for a LOW hazard " +
          "classification. At this reading the space cannot be classified low hazard; " +
          "classification under s.9.25 and the corresponding ventilation (s.9.30-9.32) and " +
          "respiratory protection (s.9.29) requirements apply. A ceiling limit must never be " +
          "exceeded at any point during the work.";
      } else {
        readingRelativeToLimit = `at or below 10% of the ${g.ceiling} ppm ceiling`;
        regulationRequires =
          "The reading is within the low-hazard contaminant criterion of OHSR s.9.1 (no " +
          "contaminant above 10% of its exposure limit). All other Part 9 classification, " +
          "testing, and permit requirements still apply before entry.";
      }
    } else {
      // co
      if (reading >= g.twa) {
        readingRelativeToLimit = `at or above the ${g.twa} ppm TWA limit`;
        regulationRequires = g.exceedsAction;
      } else if (reading > g.twa * 0.1) {
        readingRelativeToLimit = `below the ${g.twa} ppm TWA, but above 10% of the exposure limit (2.5 ppm)`;
        regulationRequires =
          "OHSR s.9.1 permits no contaminant above 10% of its exposure limit for a LOW hazard " +
          "classification. At this reading the space cannot be classified low hazard on " +
          "atmosphere alone; classification under s.9.25 applies. Note the CO limit is an " +
          "8-hour time-weighted average — exposure duration matters and must be assessed by a " +
          "qualified person.";
      } else {
        readingRelativeToLimit = `at or below 10% of the ${g.twa} ppm TWA limit`;
        regulationRequires =
          "The reading is within the low-hazard contaminant criterion of OHSR s.9.1. All other " +
          "Part 9 classification, testing, and permit requirements still apply before entry.";
      }
    }

    return reply(
      {
        gas: g.gas,
        reading: `${reading} ${g.unit}`,
        published_limit: g.limitStatement,
        reading_relative_to_limit: readingRelativeToLimit,
        regulation_requires: regulationRequires,
        important:
          "This is a factual comparison of one reading against the published limit. It is not a " +
          "compliance determination and not a decision about whether entry may proceed — " +
          "classification and entry decisions require a qualified person and the full OHSR " +
          "Part 9 process.",
      },
      {
        references: g.ohsrReferences,
        plainLanguage:
          `Your ${g.gas} reading of ${reading} ${g.unit} is ${readingRelativeToLimit}. ` +
          `The section above states what the BC regulation requires at that level.`,
        product: "confinedSpace",
      }
    );
  }
);

// ---------------------------------------------------------------------------
// 2. get_confined_space_requirements
// ---------------------------------------------------------------------------

server.registerTool(
  "get_confined_space_requirements",
  {
    title: "Get WorkSafeBC confined space entry requirements",
    description:
      "Find out what WorkSafeBC requires for a confined space entry in British Columbia under " +
      "OHS Regulation Part 9: entry permit contents, ventilation, standby/attendant person " +
      "requirements, rescue plan requirements, and monitoring rules for a low, moderate, or " +
      "high hazard atmosphere. Use 'unknown' if the space has not yet been classified. BC uses " +
      "a three-tier hazard classification (not the OSHA permit-required model) — use this tool " +
      "for BC worksites instead of generic OSHA references.",
    inputSchema: {
      hazard_characterization: z
        .enum(["low", "moderate", "high", "unknown"])
        .describe(
          "The atmospheric hazard classification per OHSR s.9.1/s.9.25, or 'unknown' if not yet classified"
        ),
    },
  },
  async ({ hazard_characterization }) => {
    const req = confinedSpaceRequirements[hazard_characterization];
    return reply(
      {
        hazard_level: req.hazardLevel,
        classification_criteria: req.classificationCriteria,
        entry_permit_requirements: req.permit,
        ventilation_requirements: req.ventilation,
        standby_person_requirements: req.standby,
        rescue_plan_requirements: req.rescue,
        monitoring_requirements: req.monitoring,
      },
      {
        references: req.ohsrReferences.map((s) => `OHSR ${s}`),
        plainLanguage:
          hazard_characterization === "unknown"
            ? "The space has to be classified (low / moderate / high) by a qualified person before " +
              "you can pin down the entry requirements — the criteria for each level are listed above."
            : `For a ${req.hazardLevel.toLowerCase()} atmosphere, the OHSR requires the permit ` +
              `elements, ventilation, standby coverage, rescue plan, and monitoring listed above. ` +
              `These are the regulation's requirements — whether a specific entry meets them is a ` +
              `qualified person's call on site.`,
        product: "confinedSpace",
      }
    );
  }
);

// ---------------------------------------------------------------------------
// 3. get_gas_testing_protocol
// ---------------------------------------------------------------------------

server.registerTool(
  "get_gas_testing_protocol",
  {
    title: "Get the WorkSafeBC gas testing protocol for confined space entry",
    description:
      "Get the atmospheric testing sequence, retest intervals, and instrument requirements " +
      "WorkSafeBC requires for confined space entry in British Columbia (OHSR s.9.34 and Part 9). " +
      "Covers the O2-first test order, testing at multiple levels, the 20-minute vacancy retest " +
      "rule, when continuous monitoring is required, and what must be recorded on the entry " +
      "permit's monitoring log. Optionally pass an entry scenario for scenario-specific rules.",
    inputSchema: {
      scenario: z
        .enum(["initial_entry", "reentry_after_vacancy", "flammable_risk", "ongoing_work"])
        .optional()
        .describe(
          "Entry scenario: first entry of the day, re-entry after the space was vacated, work " +
            "where a flammable atmosphere could develop, or ongoing monitoring during work. Omit " +
            "for the full protocol."
        ),
    },
  },
  async ({ scenario }) => {
    const payload = {
      testing_sequence: gasTestingProtocol.sequence,
      general_rules: gasTestingProtocol.generalRules,
      retest_rules: gasTestingProtocol.retestRules,
      instrument_requirements: gasTestingProtocol.instrumentRequirements,
    };
    if (scenario) {
      payload.scenario = scenario;
      payload.scenario_requirement = gasTestingProtocol.scenarios[scenario];
    }
    return reply(payload, {
      references: gasTestingProtocol.ohsrReferences.map((s) => `OHSR ${s}`),
      plainLanguage:
        "Test oxygen first (LEL sensors misread in low-O2 air), then flammables, then toxics — " +
        "at the top, middle, and bottom of the space. Retest after any 20-minute vacancy, and " +
        "monitor continuously if the work could push the atmosphere over 20% LEL. Every reading " +
        "goes on the permit with the instrument and its calibration date.",
      product: "confinedSpace",
    });
  }
);

// ---------------------------------------------------------------------------
// 4. get_required_documentation
// ---------------------------------------------------------------------------

server.registerTool(
  "get_required_documentation",
  {
    title: "Get the safety documents WorkSafeBC requires for a job type",
    description:
      "Find out which safety documents WorkSafeBC requires for a job in British Columbia, and in " +
      "what order to complete them: confined space entry, hot work (welding/cutting), excavation " +
      "and trenching, lockout/tagout, general daily field work, incident investigation, or " +
      "emergency planning. Returns each required document, its purpose, and the BC regulation it " +
      "comes from (OHSR / Workers Compensation Act).",
    inputSchema: {
      job_type: z
        .enum([
          "confined_space_entry",
          "hot_work",
          "excavation",
          "lockout_tagout",
          "daily_work",
          "incident",
          "emergency_planning",
        ])
        .describe("The type of work the documentation is for"),
    },
  },
  async ({ job_type }) => {
    const entry = requiredDocumentation[job_type];
    const references = [
      ...new Set(entry.documents.map((d) => d.basis)),
    ];
    const documents = entry.documents.map((d) => {
      const doc = { order: d.order, document: d.document, purpose: d.purpose, regulation_basis: d.basis };
      if (d.product) {
        doc.related_product = { name: PRODUCTS[d.product].name, url: PRODUCTS[d.product].url };
      }
      return doc;
    });
    const payload = { job_type: entry.jobType, documents_in_order: documents };
    if (entry.note) payload.note = entry.note;
    return reply(payload, {
      references,
      plainLanguage:
        `For ${entry.jobType.toLowerCase()}, complete the documents in the order listed — each ` +
        `later document depends on the ones before it (you can't authorize a permit before the ` +
        `hazard assessment that feeds it). Citations marked 'verify' should be checked against ` +
        `the current OHSR text.`,
    });
  }
);

// ---------------------------------------------------------------------------
// 5. explain_flha_requirements
// ---------------------------------------------------------------------------

server.registerTool(
  "explain_flha_requirements",
  {
    title: "What a compliant FLHA / JSA must contain in BC",
    description:
      "Find out what a compliant Field Level Hazard Assessment (FLHA) or Job Safety Analysis " +
      "(JSA) must contain for a BC worksite under WorkSafeBC requirements: required contents, " +
      "when it must be completed, who signs it, and which tasks (confined space, hot work, " +
      "excavation, electrical, lockout) trigger additional documentation beyond the FLHA. " +
      "Optionally pass the trade or task for task-specific requirements.",
    inputSchema: {
      task: z
        .string()
        .optional()
        .describe(
          "The trade or task being assessed, e.g. 'manhole entry for pipe inspection', " +
            "'welding on a tank', 'trenching for a water line'. Omit for general requirements."
        ),
    },
  },
  async ({ task }) => {
    const payload = {
      required_contents: flhaRequirements.requiredContents,
      timing: flhaRequirements.timing,
    };
    const references = [...flhaRequirements.basis];
    if (task) {
      const t = task.toLowerCase();
      const triggered = Object.entries(flhaRequirements.taskTriggers)
        .filter(([keyword]) => {
          if (keyword === "confined space")
            return /confined|manhole|vault|tank|pit|sump|vessel|silo/.test(t);
          if (keyword === "hot work") return /weld|cut|grind|torch|hot work|braz/.test(t);
          if (keyword === "excavation") return /excavat|trench|dig|shoring/.test(t);
          if (keyword === "electrical") return /electric|energiz|wiring|panel/.test(t);
          if (keyword === "lockout") return /lockout|loto|de-energ|isolat/.test(t);
          return t.includes(keyword);
        })
        .map(([keyword, requirement]) => ({ trigger: keyword, additional_requirement: requirement }));
      payload.task = task;
      if (triggered.length > 0) payload.task_specific_triggers = triggered;
    }
    return reply(payload, {
      references,
      plainLanguage:
        "A compliant FLHA breaks the task into steps, names the hazard at each step, ranks the " +
        "risk, assigns a control per the hierarchy of controls, and is signed by the crew and " +
        "reviewed by the supervisor before work starts — then redone whenever the task, crew, or " +
        "conditions change. Some tasks (confined space, hot work, excavation) need their own " +
        "permits and procedures on top of the FLHA.",
      product: "jsa",
    });
  }
);

// ---------------------------------------------------------------------------
// Resource: full reference set as one document
// ---------------------------------------------------------------------------

server.registerResource(
  "bc-safety-reference",
  "bcsafety://worksafebc/reference",
  {
    title: "WorkSafeBC Safety Documentation Reference (BC)",
    description:
      "Complete BC reference set: confined space requirements (OHSR Part 9), atmospheric limits, " +
      "gas testing protocol, required documentation by job type, and FLHA/JSA requirements",
    mimeType: "application/json",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            jurisdiction: "British Columbia, Canada — WorkSafeBC OHS Regulation (B.C. Reg. 296/97)",
            gas_limits: gasLimits,
            confined_space_requirements: confinedSpaceRequirements,
            gas_testing_protocol: gasTestingProtocol,
            required_documentation: requiredDocumentation,
            flha_requirements: flhaRequirements,
            last_verified: LAST_VERIFIED,
            scope_note: SCOPE_NOTE,
            disclaimer: DISCLAIMER,
          },
          null,
          2
        ),
      },
    ],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("bc-confined-space MCP server (v2, 5 tools) running on stdio");
