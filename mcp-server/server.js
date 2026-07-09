#!/usr/bin/env node
// bc-confined-space MCP server — stdio transport (local use with Claude Code / Claude Desktop).
// Tool definitions live in tools.js, shared with the Cloudflare Worker (worker.js).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SERVER_INFO, registerAll } from "./tools.js";

const server = new McpServer(SERVER_INFO);
registerAll(server);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("bc-confined-space MCP server (v2, 5 tools) running on stdio");
