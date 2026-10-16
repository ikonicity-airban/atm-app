---
name: ui-skills-root
description: >-
  Structural router for UI tasks (by ibelick). Evaluates the UI goal and routes
  the agent to the smallest, most relevant set of specialized UI, layout, motion,
  and accessibility skills. Use when starting any frontend feature or UI refactor.
---

# UI Skills Root

You are the routing and dispatch layer for all UI, UX, and frontend design engineering tasks. Rather than loading an overwhelming monolithic set of rules into context, evaluate the user's interface request and route to the minimal, high-leverage skill set.

---

## 1. Routing Protocol

When a user asks for frontend UI work, follow this sequence:

```
[User Request]
       │
       ▼
1. Is this UI / UX related?
   ├── NO  ──► Defer to standard engineering or domain skills (e.g., /develop logical track).
   └── YES ──► Identify the primary visual and structural objective:
```

### Routing Matrix

| Objective / Symptoms | Primary Skill to Load | Supporting Standards |
|---|---|---|
| **Weightless, floating cards, 3D perspective, glassmorphism, GSAP motion** | `antigravity-design-expert` | Spec 0012 PageShell standards |
| **Purging AI generic layouts, visual hierarchy, typography scales, color harmony** | `improve-ui` | `coss` Base UI tokens |
| **Spring micro-interactions, modal transitions, button physics, motion audits** | `improve-animations` | Emil Kowalski motion rules |
| **Wireframing, visual layouts, design systems, extracting Design DNA** | `google-stitch` | Stitch MCP / Component schemas |
| **Header overlap, responsive padding, container density, safe clearance** | Spec 0012 (`PageShell`) | `web-design-guidelines` |
| **WCAG AA contrast, 44px hit targets, screen reader focus, keyboard accessibility** | `web-design-guidelines` | `scripts/check-contrast.ts` |

---

## 2. Dispatch Rules

1. **Keep Context Lean**:
   - Activate only 1 or 2 specialized skills per task. For example:
     - Building a new pricing hero card: load `antigravity-design-expert` + `improve-ui`.
     - Polishing button interactions and modal sheets: load `improve-animations`.
     - Fixing mobile layout and header collision: load Spec 0012 spatial standards.
2. **Resolve Ambiguity Fast**:
   - If the visual direction is unspecified, ask one concise question or default to the approved project design system (`docs/specs/`, `AGENTS.md`, and `antigravity-design-expert`).
3. **Execution Guardrails**:
   - Never use generic red/green/blue colors; use tailored HSL or hex tokens.
   - Always verify 44px minimum touch targets and zero pulsing placeholders.
