---
name: aeroindex-frontend-refinement
description: Build or refine a polished AeroIndex India-style React frontend for analytical aviation or public-statistics products. Use when creating or improving a dark-first data platform with a separate public landing page, authentication screens, analyst and administrator workspaces, a professional institutional palette, visual style guide, accessible ambient animation, and connected local mock state.
---

# AeroIndex Frontend Refinement

## Purpose

Use this skill to create an evidence-led, aviation-operations frontend rather than a consumer booking interface. The intended product should present high-frequency airfare intelligence, route analysis, CPI-compatible quality signals, anomaly monitoring, auditability, and governed administration in one coherent experience.

Use this workflow for a new implementation or a substantial visual/product refinement. Preserve the existing architecture when a user supplies a finalized structure. Keep the product frontend-only unless the user explicitly asks for a backend integration.

## Working Model

Treat the product as three clearly distinct contexts that share the same brand system.

| Context | Job | Required visual character |
|---|---|---|
| **Public landing** | Explain the purpose and guide users to authentication. | Cinematic but restrained; left-aligned analyst narrative, realistic aircraft/cloud imagery, sparse floating signal instruments. |
| **Analyst workspace** | Explore reliable price signals, routes, methodologies, and evidence. | A national signal desk with a populated command sidebar, telemetry strip, route context, and data-first analytical modules. |
| **System Admin workspace** | Monitor operations, access, security, scheduling, and audit governance. | A control console with system-node context, service health, processing ledgers, policy controls, and distinct administrator navigation. |

## Product-Build Workflow

### 1. Preserve the Product Contract

Read any supplied product brief or master prompt before changing code. Extract the official product name, brand statements, required routes, reusable components, mock-data expectations, and any non-negotiable implementation constraints. Do not quietly redesign a finalized architecture.

When the application is static, keep the source of truth in typed local mock data and React state. Reuse the same selected route, quality score, anomaly status, and basket state across screens so that demonstrations feel connected rather than staged as disconnected pages.

### 2. Establish the Visual Direction in Writing

Create or update `ideas.md` before implementation. Record three distinct directions only when the request is not an explicit reference match. Commit to one direction, then document the palette rationale, typography, layout, signature motifs, interaction behavior, logo concept, brand voice, and motion constraints.

Choose an **aviation operations room** direction for an AeroIndex-style product. Avoid consumer travel imagery, excessive glow, generic rounded-card layouts, oversaturated gradients, and default-looking type. The design should answer: *Does this reinforce the sense of monitored airspace and statistical accountability?*

### 3. Create the Information Architecture

Build complete routes rather than placeholders. At minimum, implement a public landing page; separate login and signup routes; an analyst dashboard; route detail; CPI compatibility; booking-window analysis; heatmap; anomaly monitor; explainable price changes; synthetic basket; data explorer; audit trail; and distinct admin routes.

Use reusable components for score displays, anomaly cards, charts, audit timelines, route selectors, pipeline status, route recommendations, theme controls, and the deterministic assistant. Keep actions local and observable: marking an anomaly, switching a role, changing a basket route, or simulating ingestion should change state visibly.

### 4. Apply the Institutional Airspace System

Use a layered graphite-navy base with mineral light surfaces for the alternate theme. Assign each accent a tightly controlled role.

| Token | Suggested value | Meaning |
|---|---:|---|
| Graphite navy | `#111923` | Primary dark field and command canvas |
| Steel signal | `#536F8C` | Navigation and primary controls |
| Verification teal | `#6A9893` | Identity, live status, current series, selected route signal |
| Sage success | `#6F8A75` | Healthy, eligible, and passed outcomes |
| Antique bronze | `#A48662` | Reference series and caution |
| Brick exception | `#A86360` | Anomalies, errors, and review flags |

Use verification teal sparingly. Do not use it as a general-purpose bright glow. Apply steel blue to standard controls, bronze to reference data, and brick red only to exceptions. Ensure the light theme is an intentional mineral-and-steel composition rather than an inverted dark theme.

### 5. Use Visual Assets and Motion Deliberately

Use realistic low-key aircraft and cloud imagery for the landing and authentication threshold. Reserve the visual safe area for high-contrast text. Use flight-path arcs, waypoint dots, trace lines, and clipped corner marks as recurring system motifs.

Ambient motion should be quiet and slow. Animate only transform and opacity: aircraft drift over 18–24 seconds, cloud strata over 24–32 seconds, and route arcs through subtle opacity variation. Never use playful bounce, rapid movement, blinking, or broad neon effects. Provide both reduced-motion behavior and an in-product animation preference.

### 6. Build the Theme and Accessibility Controls

Default to dark mode and provide a persistent `Dark / Executive Light` toggle using `localStorage`. The Executive Light theme must retain the same semantic color rules while using high-contrast mineral backgrounds and steel-blue structure.

Provide a settings control for “Ambient flight motion.” Store the preference in `localStorage`; apply a root class such as `motion-reduced` to disable the landing aircraft, cloud, and route-arc animations. Respect `prefers-reduced-motion` independently, even when the user has not set the control.

Add a documented keyboard shortcut such as `M` for this user preference. Ignore the shortcut while the user is typing in an input, textarea, select, or editable field. Present the shortcut in the setting’s tooltip and an accessible status message. Give the settings control an explicit accessible name, `aria-pressed` state, and tooltip that explains both the visual effect and persistence behavior.

Defensively normalize keyboard-event keys before comparison. Treat a missing or non-string `event.key` as an unmatched input; do not call string methods on it directly. This protects settings pages and embedded browsers that may dispatch incomplete keyboard events.

### 7. Build Filterable Administrative Statistics

Design a quick-statistics panel as an operational readout rather than a generic KPI grid. Add a date-window control and route selector; bind both controls to local React state and recompute the shown values from a small deterministic scenario table. Make the selected filters visible in the panel context, and use semantic colors: verification teal for current signal, sage for quality, brick red for reviews, and bronze for coverage/reference context.

Use non-empty select values, keyboard-native controls, and screen-reader-friendly labels. Avoid claiming that demonstration figures are live production data.

### 8. Surface Shortcut Discovery and Preserve Filter Context

Place an on-screen shortcut reference panel in the analyst workspace so keyboard features are discoverable without documentation. Use the same command-frame language as the surrounding workspace: a small telemetry panel, compact `kbd` tokens, and concise descriptions. Include only shortcuts that actually work, and state that shortcuts are inactive while the user enters text or selects values.

Persist analytical filters such as a date window and route scope with `localStorage`. Initialize each filter lazily, validate stored values against the current option list, and write updates through an effect. Preserve user context across a return visit without pretending that static demonstration data is a live session state.

### 9. Export Filtered Demonstration Data Safely

For frontend-only exports, build a small structured row set from the active filter state. Generate CSV in the browser with a `Blob`, an object URL, a temporary anchor, and URL cleanup. Include a title row or metadata fields for the selected time window, monitored route, generation timestamp, and a clear `demonstration data` designation. Escape CSV fields and give the downloaded file a meaningful route-and-range filename.

Do not export personal data, credentials, or unfiltered hidden state. The export must reflect exactly the values currently shown in the filtered quick-statistics readout.

### 10. Add Global Command Navigation and Interaction Telemetry

Use the prebuilt command dialog and command-list primitives to build one global navigation palette. Open it with `Ctrl+K` on Windows/Linux and `Cmd+K` on macOS. List navigable public, analyst, and administrator routes in clear groups, filter through the built-in command search, and close the palette after navigation. Do not override ordinary text-entry keyboard behavior with single-key route shortcuts.

Track meaningful engagement actions through one small client-side helper. Record command-palette opens and command selections; real keyboard shortcuts; filter selections; and data import/export actions. Use the installed analytics runtime when it is available and also retain a capped local demonstration event log. Send only action names and non-sensitive context such as route scope, time window, and workspace; never send imported cell values, personally identifying information, or file contents.

### 11. Build a Client-Side CSV Import Preview

In the administrator ingestion area, use a file input restricted to `.csv` and parse its text only in the browser. Show a modal preview before any local finalization: file name, parsed row count, header row, a short sample table, and a validation summary. Reject empty input and surface a clear error state for malformed/insufficient rows.

Finalizing in a static demonstration may update local UI state only. Label the result as a local demonstration import, show an explicit confirmation, and track the import action without recording CSV values. Do not present the local preview as a real production upload.

### 12. Include a Compact Visual Style Guide

Create a public `/style-guide` route suitable for presentation use. It should show the named palette swatches and use cases, Sora and Space Grotesk hierarchy, telemetry text treatment, status tags, representative buttons, an instrument tile, and the live theme control. Keep the guide compact and executive-facing, not a generic component-library dump.

Include a dedicated accessibility section. Show the ambient-motion setting in both enabled and reduced states, describe the keyboard shortcut, and explain that system reduced-motion preferences are honored. Use the real setting state for the interactive example so the guide is demonstrable rather than static.

### 13. Verify and Deliver

Run TypeScript validation and a production build after substantial changes. Take representative screenshots of the landing page, style guide, analyst dashboard, and admin dashboard. Use visual feedback as a holistic refinement pass: update composition, hierarchy, palette, and motifs together rather than making isolated micro-adjustments.

Before delivery, create a checkpoint. State what changed, mention successful checks, attach the checkpoint, and offer only practical next steps. Do not claim the product is official government data or a published CPI figure; keep the demonstration boundary explicit.

## Quality Gates

Confirm these conditions before delivering.

| Area | Gate |
|---|---|
| Architecture | Public, auth, analyst, and admin contexts are separate and navigable. |
| Data continuity | Route selection and mock state are reused across analytical screens. |
| Theme | Dark and Executive Light modes persist and remain readable. |
| Accessibility | Ambient flight motion can be disabled, the setting exposes a tooltip and keyboard shortcut, and OS reduced-motion preference is respected. |
| Filters | Administrative quick statistics respond visibly to a date window and monitored-route selector. |
| Shortcut discovery | The analyst workspace visibly lists real supported shortcuts with clear focus and keyboard presentation. |
| Persistence and export | Filter state survives a return visit, and CSV export mirrors the selected filters and is marked as demonstration data. |
| Command navigation | Ctrl/Cmd+K opens one global accessible command palette and command selection changes routes. |
| Import protection | CSV data is previewed and validated before a clearly local demonstration finalization. |
| Engagement telemetry | Only non-sensitive interaction context is recorded for shortcuts, filters, commands, imports, and exports. |
| Visual language | Command rail, telemetry labels, clipped instrument surfaces, and muted flight-path cues recur across workspaces. |
| Palette | Teal is reserved for verified signal; bronze and brick red are semantic, not decorative. |
| Demonstration | No external paid services are required; actions work with deterministic local state. |
| Validation | Type checking, build, and representative visual checks pass. |
