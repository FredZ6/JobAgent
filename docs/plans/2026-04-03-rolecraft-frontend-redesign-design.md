# Rolecraft Frontend Redesign Design

## Summary

This redesign keeps Rolecraft's current page architecture and workflow model intact while upgrading the product into a more distinctive, trustworthy, dual-theme interface. The target direction is "crafted studio meets tactical workspace": warm, human, and editorial in tone, but sharp and efficient in the way it handles progress, states, and review checkpoints.

## Product Reading

Rolecraft is not a mass-market automation dashboard. It is a local-first job-application copilot with explicit human review in the loop. The product helps users:

- capture reusable candidate context
- import jobs intentionally
- evaluate fit before investing effort
- generate supporting artifacts
- inspect best-effort automation without hiding uncertainty
- complete the final submission manually

That product stance should be visually obvious. The interface should not imply "one click and the system handles it." It should communicate guided control.

## Chosen Direction

### Theme

`Studio Ledger`

### Tone

- Crafted
- Deliberate
- Contemporary
- Trustworthy
- Calm under load

### Explicit anti-directions

- no purple neon
- no cyberpunk glow
- no generic dark SaaS dashboard
- no faux-vintage or overly retro treatment

## Visual System

### Typography

Use a display serif for major brand and page headings, paired with a modern sans for body copy, controls, and dense workflow information. Headings should feel intentional and authored, while operational UI stays crisp and readable.

### Color

Use warm mineral neutrals with copper and moss accents in light mode, then reinterpret them for dark mode with ink-heavy surfaces and muted highlight tones. Status colors should be distinct but controlled rather than loud.

### Surfaces

Replace the current soft translucent card language with more substantial layered surfaces: framed panels, stronger borders, richer shadows, and tonal depth. Surfaces should feel like working documents and control trays, not floating glass.

### Layout

Keep the existing route map, but introduce stronger rhythm:

- more deliberate masthead composition
- asymmetric hero/overview regions on the home page
- denser metrics and list treatments on operational pages
- better differentiation between summary, action, and evidence sections

## Page Strategy

### Global shell

Turn the shell into a branded workspace frame with:

- clearer brand block
- theme toggle
- stronger active navigation state
- a utility rail feeling without adding clutter

### Home page

Replace the MVP-centric overview with a narrative entry page that explains the working loop:

- orient the user to the product promise
- surface the workflow stages
- offer strong entry points into setup, profile, and jobs

### Dashboard

Recast the dashboard as a command ledger:

- metrics become more compact and scannable
- stage counts read as workflow inventory, not generic KPI cards
- timeline filters feel deliberate and controllable

### Jobs list

Make the import surface feel like the "front door" to the workflow:

- stronger import form styling
- richer job cards with stage and readiness cues
- better empty and loading states

### Job detail

Differentiate between:

- the role record itself
- generated analysis and resume artifacts
- workflow execution and retry state
- application review outputs

This page should feel like a case file with operational controls, not a stack of equal cards.

## Theme Support

Support both light and dark themes through CSS variables defined at the root layer. The first implementation should use a client-side theme toggle and system-aware default behavior. Theme styling should be centralized so the rest of the component tree inherits tokens instead of branching heavily in component code.

## Implementation Approach

1. Introduce shared theme tokens and shell-level theme controls.
2. Upgrade the global shell and shared primitives so the redesign propagates broadly.
3. Rebuild the landing page around the product workflow and value proposition.
4. Restyle the dashboard, jobs list, and job detail pages as the highest-value operational surfaces.
5. Keep component APIs stable where possible so the redesign is mostly a presentation refactor rather than a data-flow rewrite.

## Verification

- update and run page-level tests affected by copy or structural changes
- run web unit tests for touched routes/components
- manually verify both light and dark themes on key pages if the app can be started locally
