import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["C:\\Users\\User\\Desktop\\bcsafetydocs\\mcp-server\\server.js"],
});

const client = new Client({ name: "test-client", version: "1.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));

const resources = await client.listResources();
console.log("RESOURCES:", resources.resources.map((r) => r.uri).join(", "));

const r1 = await client.callTool({ name: "get_standby_requirements", arguments: { hazard_level: "high" } });
console.log("\n--- get_standby_requirements(high) ---");
console.log(r1.content[0].text.slice(0, 500));

const r2 = await client.callTool({ name: "get_section_reference", arguments: { section: "s.9.34" } });
console.log("\n--- get_section_reference(s.9.34) ---");
console.log(r2.content[0].text.slice(0, 400));

const r3 = await client.callTool({ name: "search_regulations", arguments: { query: "H2S" } });
const parsed = JSON.parse(r3.content[0].text);
console.log("\n--- search_regulations(H2S) ---");
console.log("matches:", parsed.matches, "topics:", Object.keys(parsed.results ?? {}).join(", "));

const r4 = await client.readResource({ uri: "bcsafety://confined-space/part9-overview" });
console.log("\n--- resource read ---");
console.log("resource bytes:", r4.contents[0].text.length);

await client.close();
console.log("\nALL TESTS PASSED");
