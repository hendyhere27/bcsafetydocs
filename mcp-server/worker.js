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

const INFO = {
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
};

const TOOL_ROWS = [
  ["check_atmospheric_limits", "Check a gas reading (O2, LEL, H2S, CO) against BC exposure limits — returns the limit, the OHSR citation, and what the regulation requires at that reading."],
  ["get_confined_space_requirements", "Entry permit, ventilation, standby person, rescue plan, and monitoring requirements per hazard level under OHSR Part 9."],
  ["get_gas_testing_protocol", "Testing sequence (O2 first), retest intervals, the 20-minute vacancy rule, and instrument requirements (s.9.34)."],
  ["get_required_documentation", "Which safety documents WorkSafeBC requires for a job type — confined space, hot work, excavation, LOTO, daily work, incidents, emergency planning — in completion order."],
  ["explain_flha_requirements", "What a compliant FLHA / JSA must contain, when it's completed, who signs it, and which tasks trigger additional permits."],
];

const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>BC Safety Docs MCP Server | WorkSafeBC Reference Tools for AI Assistants</title>
<meta name="description" content="Free public MCP server with WorkSafeBC OHS Regulation reference tools: BC exposure limits, confined space entry requirements (OHSR Part 9), gas testing protocol, required documentation, and FLHA requirements."/>
<link rel="icon" href="https://bcsafetydocs.com/favicon-32x32.png"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',-apple-system,'Segoe UI',sans-serif;background:#1A1A1A;color:#EAEAEA;line-height:1.65;font-size:16px}
.wrap{max-width:860px;margin:0 auto;padding:56px 24px 80px}
.eyebrow{font-size:.78rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#F5C400;margin-bottom:14px}
h1{font-weight:800;font-size:clamp(2rem,5vw,3.1rem);line-height:1.08;color:#fff;margin-bottom:18px}
h1 em{font-style:normal;color:#F5C400}
.sub{color:#999;max-width:640px;margin-bottom:36px}
h2{font-weight:800;font-size:1.15rem;color:#fff;letter-spacing:.03em;text-transform:uppercase;margin:44px 0 14px;border-left:4px solid #F5C400;padding-left:12px}
code,pre{font-family:ui-monospace,'Cascadia Code',Consolas,monospace;font-size:.88em}
pre{background:#111;border:1px solid #2a2a2a;border-radius:6px;padding:14px 16px;overflow-x:auto;color:#F5C400;margin:10px 0}
.endpoint{display:flex;flex-wrap:wrap;gap:10px;align-items:baseline;margin:6px 0}
.endpoint .label{color:#888;font-size:.82rem;min-width:150px}
table{width:100%;border-collapse:collapse;margin-top:8px}
td{padding:10px 12px;border-bottom:1px solid #2a2a2a;vertical-align:top}
td:first-child{white-space:nowrap;color:#F5C400;font-family:ui-monospace,Consolas,monospace;font-size:.85rem}
td:last-child{color:#bbb;font-size:.9rem}
.rules li{margin:8px 0 8px 20px;color:#bbb;font-size:.93rem}
.rules b{color:#fff}
.disclaimer{background:#111;border:1px solid #2a2a2a;border-left:4px solid #C0392B;border-radius:4px;padding:14px 16px;font-size:.85rem;color:#999;margin-top:44px}
a{color:#F5C400}
footer{margin-top:48px;padding-top:20px;border-top:1px solid #2a2a2a;font-size:.82rem;color:#666}
footer a{color:#888}
</style>
</head>
<body>
<div class="wrap">
  <p class="eyebrow">Free public MCP server &middot; British Columbia, Canada</p>
  <h1>WorkSafeBC reference tools<br/>for <em>AI assistants.</em></h1>
  <p class="sub">A Model Context Protocol server that answers BC-specific safety questions with OHS Regulation citations: exposure limits, confined space entry requirements under OHSR Part 9, gas testing protocol, required documentation, and FLHA requirements. Built by <a href="https://bcsafetydocs.com">BC Safety Docs</a>.</p>

  <h2>Endpoints</h2>
  <div class="endpoint"><span class="label">Streamable HTTP</span><code>https://mcp.bcsafetydocs.com/mcp</code></div>
  <div class="endpoint"><span class="label">SSE (legacy clients)</span><code>https://mcp.bcsafetydocs.com/sse</code></div>

  <h2>Connect</h2>
  <p style="color:#999;font-size:.9rem">Claude Code:</p>
  <pre>claude mcp add --transport http bc-confined-space https://mcp.bcsafetydocs.com/mcp</pre>
  <p style="color:#999;font-size:.9rem">Or add the URL to any MCP-capable client (Claude Desktop connectors, Cursor, etc.). No authentication required.</p>

  <h2>Tools</h2>
  <table>${TOOL_ROWS.map(([n, d]) => `<tr><td>${n}</td><td>${d}</td></tr>`).join("")}</table>

  <h2>Design principles</h2>
  <ul class="rules">
    <li><b>Requirements, never verdicts.</b> Responses state what the regulation requires ("OHSR s.9.34 requires a retest after a 20-minute vacancy") — never whether a specific situation is compliant. Those determinations belong to a qualified person on site.</li>
    <li><b>Every response cites its sections.</b> OHSR references, a last-verified date, and a plain-language interpretation ship with every answer.</li>
    <li><b>BC, not OSHA.</b> British Columbia uses a three-tier hazard classification under OHSR Part 9 — not the US permit-required model.</li>
  </ul>

  <div class="disclaimer"><strong style="color:#C0392B">Disclaimer:</strong> Reference information only. All output must be reviewed by a qualified person and verified against the current WorkSafeBC OHS Regulation (B.C. Reg. 296/97) before use. Not legal or regulatory advice.</div>

  <footer>&copy; 2026 <a href="https://bcsafetydocs.com">BC Safety Docs</a> &middot; WorkSafeBC OHS Regulation compliance document templates for BC contractors &middot; <a href="mailto:info@bcsafetydocs.com">info@bcsafetydocs.com</a></footer>
</div>
</body>
</html>`;

export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
      return mcpHandler.fetch(request, env, ctx);
    }
    if (url.pathname === "/sse" || url.pathname.startsWith("/sse/")) {
      return sseHandler.fetch(request, env, ctx);
    }
    const accept = request.headers.get("accept") ?? "";
    if (accept.includes("text/html")) {
      return new Response(LANDING_HTML, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    return new Response(JSON.stringify(INFO, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  },
};
