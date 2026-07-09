// bc-confined-space MCP server — Cloudflare Worker (remote MCP over Streamable HTTP + SSE).
// Endpoint: https://mcp.bcsafetydocs.com/mcp
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SERVER_INFO, registerAll } from "./tools.js";

export class BCSafetyMCP extends McpAgent {
  server = new McpServer(SERVER_INFO);

  async init() {
    registerAll(this.server);
  }
}

const mcpHandler = BCSafetyMCP.serve("/mcp");
const sseHandler = BCSafetyMCP.serveSSE("/sse");

export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
      return mcpHandler.fetch(request, env, ctx);
    }
    if (url.pathname === "/sse" || url.pathname.startsWith("/sse/")) {
      return sseHandler.fetch(request, env, ctx);
    }
    return new Response(
      JSON.stringify(
        {
          name: SERVER_INFO.name,
          version: SERVER_INFO.version,
          description:
            "MCP server for WorkSafeBC (British Columbia) OHS Regulation reference data: " +
            "confined space entry (OHSR Part 9), atmospheric exposure limits, gas testing " +
            "protocol, required safety documentation, and FLHA/JSA requirements. " +
            "Returns requirements with OHSR citations — never compliance verdicts.",
          endpoints: { streamable_http: "/mcp", sse: "/sse" },
          website: "https://bcsafetydocs.com",
          disclaimer:
            "Reference information only — must be verified by a qualified person against the " +
            "current WorkSafeBC OHS Regulation. Not legal or regulatory advice.",
        },
        null,
        2
      ),
      { headers: { "content-type": "application/json; charset=utf-8" } }
    );
  },
};
