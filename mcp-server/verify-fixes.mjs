// Verify the July 10 citation fixes against the deployed server.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(new URL("https://mcp.bcsafetydocs.com/mcp"));
const client = new Client({ name: "fix-verify", version: "1.0.0" });
await client.connect(transport);

const parse = (r) => JSON.parse(r.content[0].text);
let failures = 0;
function check(label, cond) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

// The false-reassurance case: a perfect 20.9 O2 reading
let b = parse(await client.callTool({ name: "check_atmospheric_limits", arguments: { gas: "oxygen", reading: 20.9 } }));
check("O2 20.9 response carries standing cross_gas_warning", b.cross_gas_warning?.includes("clears nothing else"));
check("O2 20.9 does NOT claim OHSR requires 19.5%", !JSON.stringify(b).includes("OHSR Part 9 requires a minimum of 19.5"));
check("O2 limit statement says no direct numeric floor in OHSR", b.published_limit.includes("does not state a numeric O2 floor"));
check("O2 20.9 response says it clears oxygen only", b.regulation_requires.includes("clears the oxygen hazard only"));
check("last_verified bumped to 2026-07-10", b.last_verified === "2026-07-10");

// Fix 1: low hazard standby cites s.9.34
b = parse(await client.callTool({ name: "get_confined_space_requirements", arguments: { hazard_characterization: "low" } }));
check("Fix 1: low standby cites s.9.34", b.standby_person_requirements.includes("s.9.34"));
check("Fix 2: low retest cites s.9.25(3)", b.monitoring_requirements.includes("s.9.25(3)"));
check("Low ventilation cites s.9.31(1)", b.ventilation_requirements.includes("s.9.31(1)"));

// Fixes 3,4,5: moderate hazard
b = parse(await client.callTool({ name: "get_confined_space_requirements", arguments: { hazard_characterization: "moderate" } }));
check("Fix 4: moderate ventilation cites s.9.30 (not s.9.31)", b.ventilation_requirements.includes("s.9.30") && !b.ventilation_requirements.includes("s.9.31"));
check("Fix 5: SAR/SCBA cites s.9.28(a) (not s.9.29 Inerting)", JSON.stringify(b.entry_permit_requirements).includes("s.9.28(a)"));
check("Fix 3: continuous LEL monitoring cites s.9.25(6)", b.monitoring_requirements.includes("s.9.25(6)"));

// Fix 6: high hazard
b = parse(await client.callTool({ name: "get_confined_space_requirements", arguments: { hazard_characterization: "high" } }));
check("Fix 6: natural ventilation ban cites s.9.33(2)(a)", b.ventilation_requirements.includes("s.9.33(2)(a)"));
check("Fix 6: no s.9.29 anywhere in high response", !JSON.stringify(b).includes("s.9.29"));

// Testing protocol
b = parse(await client.callTool({ name: "get_gas_testing_protocol", arguments: { scenario: "reentry_after_vacancy" } }));
check("Protocol: vacancy retest cites s.9.25(3)", b.scenario_requirement.includes("s.9.25(3)"));

await client.close();
console.log(failures === 0 ? "\nALL CITATION FIXES VERIFIED LIVE" : `\n${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);
