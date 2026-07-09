import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [join(here, "server.js")],
});

const client = new Client({ name: "test-client", version: "1.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log(`TOOLS (${tools.tools.length}):`, tools.tools.map((t) => t.name).join(", "));
if (tools.tools.length > 6) throw new Error("v1 must be 5-6 tools max");

function parse(result) {
  return JSON.parse(result.content[0].text);
}

function assertEnvelope(name, body) {
  for (const field of ["ohsr_references", "last_verified", "plain_language", "scope_note"]) {
    if (body[field] === undefined) throw new Error(`${name}: missing envelope field '${field}'`);
  }
  const text = JSON.stringify(body).toLowerCase();
  for (const banned of ["you are compliant", "safe to enter", "entry is permitted."]) {
    if (text.includes(banned)) throw new Error(`${name}: verdict language detected: '${banned}'`);
  }
  console.log(`  envelope OK (refs: ${body.ohsr_references.length}, verified: ${body.last_verified})`);
}

// 1. check_atmospheric_limits — exceedance and below-minimum cases
console.log("\n--- check_atmospheric_limits(h2s, 15) ---");
let body = parse(await client.callTool({ name: "check_atmospheric_limits", arguments: { gas: "h2s", reading: 15 } }));
console.log(" ", body.reading_relative_to_limit);
console.log(" ", body.regulation_requires.slice(0, 120) + "...");
assertEnvelope("check_atmospheric_limits", body);

console.log("\n--- check_atmospheric_limits(oxygen, 18.9) ---");
body = parse(await client.callTool({ name: "check_atmospheric_limits", arguments: { gas: "oxygen", reading: 18.9 } }));
console.log(" ", body.reading_relative_to_limit);
assertEnvelope("check_atmospheric_limits", body);

// 2. get_confined_space_requirements
console.log("\n--- get_confined_space_requirements(high) ---");
body = parse(await client.callTool({ name: "get_confined_space_requirements", arguments: { hazard_characterization: "high" } }));
console.log(" ", body.standby_person_requirements.slice(0, 110) + "...");
console.log("  product:", body.related_product?.url);
assertEnvelope("get_confined_space_requirements", body);

// 3. get_gas_testing_protocol
console.log("\n--- get_gas_testing_protocol(reentry_after_vacancy) ---");
body = parse(await client.callTool({ name: "get_gas_testing_protocol", arguments: { scenario: "reentry_after_vacancy" } }));
console.log(" ", body.scenario_requirement);
assertEnvelope("get_gas_testing_protocol", body);

// 4. get_required_documentation
console.log("\n--- get_required_documentation(confined_space_entry) ---");
body = parse(await client.callTool({ name: "get_required_documentation", arguments: { job_type: "confined_space_entry" } }));
console.log("  docs in order:", body.documents_in_order.map((d) => `${d.order}. ${d.document}`).join(" | "));
assertEnvelope("get_required_documentation", body);

// 5. explain_flha_requirements with task trigger
console.log("\n--- explain_flha_requirements('welding inside a tank') ---");
body = parse(await client.callTool({ name: "explain_flha_requirements", arguments: { task: "welding inside a tank" } }));
console.log("  triggers:", (body.task_specific_triggers ?? []).map((t) => t.trigger).join(", "));
assertEnvelope("explain_flha_requirements", body);

// Resource
const resources = await client.listResources();
console.log("\nRESOURCES:", resources.resources.map((r) => r.uri).join(", "));
const res = await client.readResource({ uri: "bcsafety://worksafebc/reference" });
console.log("resource bytes:", res.contents[0].text.length);

await client.close();
console.log("\nALL TESTS PASSED");
