---
name: google-stitch
description: >-
  Google Stitch integration for design-to-code generation, Design DNA extraction,
  and tokenized design system synchronization. Use when translating Stitch visual layouts
  or wireframes into production React and Tailwind components.
---

# Google Stitch Integration (Design-to-Code)

This skill enables Antigravity to interface with Google Stitch design artifacts, Design DNA tokens, and visual wireframes to output production-grade React/Tailwind frontend code with zero aesthetic compromises.

---

## 1. What Google Stitch Provides

1. **Design DNA Extraction**:
   - Stitch models capture typographic scales, brand color ramps, elevation shadows, and component spacing tokens.
   - Prevents AI hallucinations by grounding component generation in the project's actual design tokens.
2. **Direct Wireframe-to-Component Synthesis**:
   - Transforms high-fidelity wireframes into accessible, responsive React components using modern Tailwind CSS.
3. **Model Context Protocol (MCP) Bridge**:
   - Connects local coding agents to Google Stitch endpoints to pull screen layouts, color palettes, and component blueprints directly into your IDE session.

---

## 2. Converting Stitch Specs to Production Code

When generating components from a Stitch design:

1. **Token Mapping**:
   - Extract primary, surface, and semantic colors from Stitch Design DNA into Tailwind utility classes or CSS variables (e.g. `--brand-primary`, `--surface-elevated`).
2. **Layout Structure**:
   - Map Stitch bounding boxes to responsive flex/grid layouts (`grid grid-cols-1 md:grid-cols-12 gap-6`).
   - Honor container width scale (`prose`, `compact`, `standard`) and safe header clearance.
3. **Component Fidelity**:
   - Implement real interactive states (hover, focus-visible, active press, disabled).
   - Ensure clean semantic HTML (`<article>`, `<header>`, `<nav>`, `<section>`, `<button>`).

---

## 3. Stitch MCP Configuration (`mcp_config.json`)

To connect Antigravity directly to the Stitch MCP server, ensure your global `~/.gemini/config/mcp_config.json` includes:

```json
{
  "mcpServers": {
    "google-stitch": {
      "command": "npx",
      "args": ["-y", "stitch-mcp"],
      "env": {
        "STITCH_API_ENDPOINT": "https://stitch.googleapis.com/mcp"
      }
    }
  }
}
```
*(If authenticating via Google Cloud, ensure standard Application Default Credentials `gcloud auth application-default login` are active).*
