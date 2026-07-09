// Live demo: realistic contractor scenarios against the deployed remote MCP server.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(new URL("https://mcp.bcsafetydocs.com/mcp"));
const client = new Client({ name: "demo-client", version: "1.0.0" });
await client.connect(transport);

async function call(name, args, label) {
  const r = await client.callTool({ name, arguments: args });
  const body = JSON.parse(r.content[0].text);
  console.log(`\n${"=".repeat(70)}\nSCENARIO: ${label}\nTOOL: ${name}(${JSON.stringify(args)})\n${"-".repeat(70)}`);
  return body;
}

// 1. Gas reading over the ceiling
let b = await call("check_atmospheric_limits", { gas: "h2s", reading: 12 },
  "Monitor shows 12 ppm H2S at the bottom of a manhole");
console.log("READING:", b.reading_relative_to_limit);
console.log("REGULATION REQUIRES:", b.regulation_requires);
console.log("PLAIN LANGUAGE:", b.plain_language);
console.log("CITATIONS:", b.ohsr_references.join(" | "));

// 2. Borderline CO reading — the 10%-of-limit rule
b = await call("check_atmospheric_limits", { gas: "co", reading: 8 },
  "CO reads 8 ppm — under the 25 ppm limit, is that fine?");
console.log("READING:", b.reading_relative_to_limit);
console.log("REGULATION REQUIRES:", b.regulation_requires);

// 3. Full requirements for a moderate hazard space
b = await call("get_confined_space_requirements", { hazard_characterization: "moderate" },
  "Valve chamber classified moderate hazard — what do I need?");
console.log("VENTILATION:", b.ventilation_requirements);
console.log("STANDBY:", b.standby_person_requirements);
console.log("PERMIT MUST INCLUDE:"); b.entry_permit_requirements.forEach((x) => console.log("  -", x));
console.log("PRODUCT:", b.related_product.url);

// 4. Crew broke for lunch — retest?
b = await call("get_gas_testing_protocol", { scenario: "reentry_after_vacancy" },
  "Crew was out of the pit for 45 minutes at lunch — retest before going back in?");
console.log("SCENARIO RULE:", b.scenario_requirement);
console.log("TEST SEQUENCE:", b.testing_sequence.map((s) => `${s.step}. ${s.test}`).join(" -> "));

// 5. Paperwork for an excavation job
b = await call("get_required_documentation", { job_type: "excavation" },
  "Trenching for a water line next week — what paperwork does WorkSafeBC want?");
b.documents_in_order.forEach((d) =>
  console.log(`  ${d.order}. ${d.document}  [${d.regulation_basis}]${d.related_product ? " -> " + d.related_product.url : ""}`)
);
console.log("NOTE:", b.note);

// 6. FLHA for a combined-hazard task
b = await call("explain_flha_requirements", { task: "hydrovac excavation around a gas main, then manhole entry" },
  "FLHA for hydrovac + manhole entry — what does it need?");
console.log("MUST CONTAIN (first 4):"); b.required_contents.slice(0, 4).forEach((x) => console.log("  -", x));
console.log("TASK TRIGGERS:", (b.task_specific_triggers ?? []).map((t) => t.trigger).join(", "));

await client.close();
console.log(`\n${"=".repeat(70)}\nLIVE DEMO COMPLETE — all calls served by https://mcp.bcsafetydocs.com/mcp`);
