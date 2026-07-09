# BC Safety Docs MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that gives AI assistants
structured reference access to WorkSafeBC (British Columbia) OHS Regulation requirements —
confined space entry under OHSR Part 9, BC atmospheric exposure limits, gas testing protocol,
required safety documentation by job type, and FLHA/JSA requirements.

Source data: the BC Safety Docs document set ([bcsafetydocs.com](https://bcsafetydocs.com)),
built around B.C. Reg. 296/97 (OHSR) Part 9, s.9.1, 9.25, 9.29–9.36 and s.5.48.

## Design principles

- **Requirements, never verdicts.** Every response states what the regulation requires
  ("OHSR s.9.34 requires a retest after a 20-minute vacancy") — never whether a specific
  situation is compliant or an entry may proceed. Those are qualified-person determinations.
- **Every response carries** the specific OHSR section references, a `last_verified` date, a
  plain-language interpretation, a scope note, and — where genuinely relevant — a link to the
  matching bcsafetydocs.com template.
- **Grounded citations only.** Sections verified against the source permit cite exactly;
  citations outside that set are given at the Part/Division level and marked
  "verify against current OHSR" rather than guessed.

## Tools (v1 — 5 tools)

| Tool | Ask it like a contractor would |
|---|---|
| `check_atmospheric_limits` | "Is 15 ppm H2S over the WorkSafeBC limit?" — input gas + reading; returns the BC limit, OHSR citation, and what the regulation requires at that reading |
| `get_confined_space_requirements` | "What does WorkSafeBC require for a high hazard confined space entry?" — permit, ventilation, standby person, rescue plan, and monitoring requirements per hazard level |
| `get_gas_testing_protocol` | "What order do I test gases in before entry, and when do I retest?" — testing sequence, retest intervals, instrument requirements (s.9.34) |
| `get_required_documentation` | "What paperwork does WorkSafeBC require for hot work / excavation / confined space entry?" — required documents, in completion order, with regulation basis |
| `explain_flha_requirements` | "What does a compliant FLHA need for trenching?" — required contents, timing, signatures, plus task-specific triggers |

Plus one resource: `bcsafety://worksafebc/reference` (the complete reference set as one JSON document).

## Setup

```sh
cd mcp-server
npm install
```

### Claude Code

```sh
claude mcp add bc-confined-space -- node C:\Users\User\Desktop\bcsafetydocs\mcp-server\server.js
```

### Claude Desktop

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

Spawns the server over stdio and exercises all 5 tools plus the resource. The test also enforces
the design rules: max 6 tools, the response envelope (`ohsr_references`, `last_verified`,
`plain_language`, `scope_note`) on every response, and a ban on verdict language
("you are compliant", "safe to enter").

> **Disclaimer:** Working tool only — all data must be reviewed by a qualified person and
> verified against the current WorkSafeBC OHS Regulation before use. Not legal or regulatory advice.
