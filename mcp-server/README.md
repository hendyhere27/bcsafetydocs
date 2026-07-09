# BC Confined Space MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that gives AI assistants
structured access to WorkSafeBC OHS Regulation Part 9 (Confined Spaces) reference data — hazard
classifications, atmospheric thresholds, ventilation and standby person requirements, permit
structure, and section references (B.C. Reg. 296/97, s.9.1, 9.25, 9.29–9.36).

Source data: the BC Safety Docs Confined Space Entry Permit ([bcsafetydocs.com](https://bcsafetydocs.com)).

> **Disclaimer:** Working tool only — all data must be reviewed by a qualified person and verified
> against the current WorkSafeBC OHS Regulation before use. Not legal or regulatory advice.

## Setup

```sh
cd mcp-server
npm install
```

## Tools

| Tool | What it returns |
|---|---|
| `get_hazard_classification` | LOW / MODERATE / HIGH atmospheric hazard criteria (s.9.1, s.9.25) |
| `get_atmospheric_thresholds` | O2 ≥ 19.5%, LEL < 20%, H2S ≤ 10 ppm ceiling, CO < 25 ppm TWA, retest rules |
| `get_ventilation_requirements` | Ventilation rules per hazard level (s.9.30–9.32), incl. 85 m³/h per worker |
| `get_standby_requirements` | Standby person rules per hazard level (s.9.35, s.9.36) |
| `get_isolation_lockout_checklist` | Isolation, LOTO, and purge verification checklist |
| `get_equipment_checklist` | Required PPE & equipment list |
| `get_rescue_plan_elements` | Required rescue plan elements |
| `get_permit_structure` | Full 8-section permit structure with fields, plus page-2 monitoring log |
| `get_section_reference` | What a specific Part 9 section covers (e.g. "9.34") |
| `search_regulations` | Keyword search across all of the above |

Plus one resource: `bcsafety://confined-space/part9-overview` (everything as one JSON document).

## Use with Claude Code

```sh
claude mcp add bc-confined-space -- node C:\Users\User\Desktop\bcsafetydocs\mcp-server\server.js
```

## Use with Claude Desktop

Add to `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "bc-confined-space": {
      "command": "node",
      "args": ["C:\\Users\\User\\Desktop\\bcsafetydocs\\mcp-server\\server.js"]
    }
  }
}
```

## Test

```sh
node test-client.mjs
```

Spawns the server, lists tools/resources, and exercises several tool calls end-to-end.
