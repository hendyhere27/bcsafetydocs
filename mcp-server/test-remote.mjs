import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = process.argv[2] ?? "https://mcp.bcsafetydocs.com/mcp";
const transport = new StreamableHTTPClientTransport(new URL(url));
const client = new Client({ name: "remote-test-client", version: "1.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log(`REMOTE TOOLS (${tools.tools.length}):`, tools.tools.map((t) => t.name).join(", "));

const r = await client.callTool({
  name: "check_atmospheric_limits",
  arguments: { gas: "co", reading: 30 },
});
const body = JSON.parse(r.content[0].text);
console.log("\ncheck_atmospheric_limits(co, 30):");
console.log("  ", body.reading_relative_to_limit);
console.log("  refs:", body.ohsr_references.join(" | "));
console.log("  last_verified:", body.last_verified);
console.log("  product:", body.related_product?.url);

await client.close();
console.log("\nREMOTE TESTS PASSED");
