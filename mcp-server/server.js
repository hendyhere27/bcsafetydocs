#!/usr/bin/env node
// MCP server exposing WorkSafeBC OHS Regulation Part 9 (Confined Spaces) reference data.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  DISCLAIMER,
  hazardClassifications,
  atmosphericThresholds,
  ventilationRequirements,
  standbyRequirements,
  isolationLockoutPurge,
  requiredEquipment,
  rescuePlan,
  permitStructure,
  sectionIndex,
} from "./data.js";

const server = new McpServer({
  name: "bc-confined-space",
  version: "1.0.0",
});

const HazardLevel = z.enum(["low", "moderate", "high"]);

function reply(data) {
  return {
    content: [
      { type: "text", text: JSON.stringify({ ...wrap(data), disclaimer: DISCLAIMER }, null, 2) },
    ],
  };
}

function wrap(data) {
  return Array.isArray(data) || typeof data !== "object" ? { result: data } : data;
}

server.registerTool(
  "get_hazard_classification",
  {
    title: "Get BC confined space hazard classification",
    description:
      "Returns the WorkSafeBC OHS Regulation Part 9 atmospheric hazard classification criteria " +
      "(s.9.1 / s.9.25). Pass a level (low, moderate, high) for one classification, or omit it for all three.",
    inputSchema: {
      level: HazardLevel.optional().describe("Hazard level to look up; omit for all levels"),
    },
  },
  async ({ level }) => {
    if (level) return reply({ classification: hazardClassifications[level], notes: hazardClassifications.notes });
    const { notes, ...levels } = hazardClassifications;
    return reply({ classifications: levels, notes });
  }
);

server.registerTool(
  "get_atmospheric_thresholds",
  {
    title: "Get BC atmospheric testing thresholds",
    description:
      "Returns the BC-specific atmospheric thresholds for confined space entry: O2 minimum, LEL action " +
      "threshold, H2S ceiling, CO TWA, and the retest interval rule (s.9.34).",
    inputSchema: {},
  },
  async () => reply({ thresholds: atmosphericThresholds })
);

server.registerTool(
  "get_ventilation_requirements",
  {
    title: "Get ventilation requirements by hazard level",
    description:
      "Returns WorkSafeBC Part 9 ventilation requirements (s.9.30-9.32) for a hazard level, " +
      "or all levels if omitted. Includes the 85 m³/h per-worker minimum for low hazard.",
    inputSchema: {
      hazard_level: HazardLevel.optional().describe("Hazard level; omit for all levels"),
    },
  },
  async ({ hazard_level }) =>
    reply(hazard_level ? { ventilation: ventilationRequirements[hazard_level] } : { ventilation: ventilationRequirements })
);

server.registerTool(
  "get_standby_requirements",
  {
    title: "Get standby person requirements by hazard level",
    description:
      "Returns WorkSafeBC Part 9 standby person requirements (s.9.35 / s.9.36) for a hazard level, " +
      "or all levels if omitted. Includes the high-hazard emergency escape respirator rule.",
    inputSchema: {
      hazard_level: HazardLevel.optional().describe("Hazard level; omit for all levels"),
    },
  },
  async ({ hazard_level }) =>
    reply(hazard_level ? { standby: standbyRequirements[hazard_level] } : { standby: standbyRequirements })
);

server.registerTool(
  "get_isolation_lockout_checklist",
  {
    title: "Get isolation, lockout & purge checklist",
    description:
      "Returns the isolation, lockout (LOTO per Part 10), and purge verification checklist required " +
      "before confined space entry (s.9.30-9.32), including double block and bleed requirements.",
    inputSchema: {},
  },
  async () => reply(isolationLockoutPurge)
);

server.registerTool(
  "get_equipment_checklist",
  {
    title: "Get required PPE & equipment checklist",
    description:
      "Returns the PPE and equipment checklist for BC confined space entry, including respirators, " +
      "retrieval equipment, gas monitors, and required recordkeeping details.",
    inputSchema: {},
  },
  async () => reply(requiredEquipment)
);

server.registerTool(
  "get_rescue_plan_elements",
  {
    title: "Get rescue plan required elements",
    description:
      "Returns the elements a confined space rescue plan must document: rescue method, equipment on site, " +
      "emergency contacts, and nearest hospital/AED location.",
    inputSchema: {},
  },
  async () => reply(rescuePlan)
);

server.registerTool(
  "get_permit_structure",
  {
    title: "Get BC confined space entry permit structure",
    description:
      "Returns the full structure of a compliant BC confined space entry permit per WorkSafeBC OHS " +
      "Regulation Part 9 — all 8 sections plus the page-2 atmospheric monitoring continuation, with required fields.",
    inputSchema: {},
  },
  async () => reply(permitStructure)
);

server.registerTool(
  "get_section_reference",
  {
    title: "Look up an OHS Regulation Part 9 section",
    description:
      "Returns what a specific WorkSafeBC OHS Regulation Part 9 section covers, as referenced by the " +
      "BC confined space entry permit. Covered sections: 9.1, 9.25, 9.29, 9.30, 9.31, 9.32, 9.34, 9.35, 9.36.",
    inputSchema: {
      section: z
        .string()
        .describe('Section number, e.g. "9.25" or "s.9.35"'),
    },
  },
  async ({ section }) => {
    const key = section.replace(/^s\.?/i, "").trim();
    const summary = sectionIndex[key];
    if (!summary) {
      return reply({
        error: `Section ${key} is not in this server's index.`,
        covered_sections: Object.keys(sectionIndex),
      });
    }
    return reply({ section: `s.${key}`, summary });
  }
);

server.registerTool(
  "search_regulations",
  {
    title: "Search BC confined space regulation data",
    description:
      "Keyword search across all Part 9 confined space reference data in this server: hazard classifications, " +
      "thresholds, ventilation, standby persons, isolation/lockout, equipment, rescue plans, permit structure, " +
      "and section summaries. Returns every entry whose text matches the query.",
    inputSchema: {
      query: z.string().describe("Keyword or phrase to search for, e.g. 'H2S', 'standby', 'ventilation'"),
    },
  },
  async ({ query }) => {
    const corpus = {
      hazard_classifications: hazardClassifications,
      atmospheric_thresholds: atmosphericThresholds,
      ventilation_requirements: ventilationRequirements,
      standby_requirements: standbyRequirements,
      isolation_lockout_purge: isolationLockoutPurge,
      required_equipment: requiredEquipment,
      rescue_plan: rescuePlan,
      permit_structure: permitStructure,
      section_index: sectionIndex,
    };
    const q = query.toLowerCase();
    const hits = {};
    for (const [topic, data] of Object.entries(corpus)) {
      if (JSON.stringify(data).toLowerCase().includes(q)) hits[topic] = data;
    }
    if (Object.keys(hits).length === 0) {
      return reply({ query, matches: 0, hint: "Try broader terms like 'oxygen', 'rescue', 'lockout', 'standby'." });
    }
    return reply({ query, matches: Object.keys(hits).length, results: hits });
  }
);

server.registerResource(
  "part9-overview",
  "bcsafety://confined-space/part9-overview",
  {
    title: "WorkSafeBC Part 9 Confined Space Overview",
    description:
      "Complete overview of BC confined space entry requirements per OHS Regulation Part 9 " +
      "(B.C. Reg. 296/97, sections 9.1, 9.25, 9.29-9.36)",
    mimeType: "application/json",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            regulation: "WorkSafeBC OHS Regulation Part 9 — Confined Spaces (B.C. Reg. 296/97)",
            hazardClassifications,
            atmosphericThresholds,
            ventilationRequirements,
            standbyRequirements,
            isolationLockoutPurge,
            requiredEquipment,
            rescuePlan,
            permitStructure,
            sectionIndex,
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
console.error("bc-confined-space MCP server running on stdio");
