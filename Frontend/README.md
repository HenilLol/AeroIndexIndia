# AeroIndex India

> **A frontend demonstration for high-frequency airfare intelligence, route analysis, and governed operational monitoring.**

AeroIndex India is a polished React frontend that presents airline-fare observations as an evidence-led analytical workspace. It separates the public product narrative from analyst and administrator contexts, enabling a clear demonstration of national airfare-index monitoring, CPI-compatibility assessment, anomaly review, operational control, and configuration governance.

The interface follows an **Aviation Operations Room** design language: graphite-navy command surfaces, restrained verification teal, instrument-style telemetry labels, realistic aircraft-and-cloud atmosphere, and a professional Executive Light alternative. It is intentionally designed as a local interactive prototype rather than a production airfare collection or official CPI publishing service.

## Contents

| Area | Description |
|---|---|
| [Product scope](#product-scope) | The product contexts and main analytical story. |
| [Capabilities](#capabilities) | Public, analyst, administrator, and accessibility features. |
| [Architecture](#architecture) | Frontend structure and the shared state model. |
| [Quick start](#quick-start) | Install, develop, check, build, and run commands. |
| [Routes](#routes) | Public, analyst, and administrator navigation map. |
| [Interaction model](#interaction-model) | Shortcuts, filters, imports, exports, feedback, and local telemetry. |
| [Design system](#design-system) | Palette and visual-system principles. |
| [Prototype boundaries](#prototype-boundaries) | What this frontend deliberately does not claim to provide. |

## Product scope

The application supports three intentionally distinct product contexts. The public landing experience communicates why high-frequency airfare signals matter. The analyst workspace turns connected mock observations into route, quality, compatibility, anomaly, and reference-index views. The System Admin workspace models operational integrity through ingestion, health, access, security, audit, and settings controls.

| Context | Primary responsibility | Representative capabilities |
|---|---|---|
| **Public product** | Explain the analytical proposition and direct visitors to access pathways. | Atmospheric landing page, separate sign-in and access-request pages, visual style guide. |
| **Analyst signal desk** | Explore structured airfare intelligence and its quality context. | National index, route analysis, booking windows, CPI compatibility, synthetic basket, heatmap, anomaly monitor, data explorer, and audit trail. |
| **System Admin** | Demonstrate governed operational controls separately from analyst views. | System health, processing monitor, ingestion jobs, CSV preview, permissions, security, audit logs, filterable quick statistics, and settings. |

## Capabilities

### Analytical and administrative demonstrations

The analytical views share deterministic mock routes, quality scores, anomalies, basket inclusion state, and route selection. Actions such as selecting a route, updating the synthetic basket, reviewing a signal, changing an access state, and triggering local ingestion change UI state visibly so the prototype feels connected rather than composed of isolated screens.

The System Admin dashboard includes a compact statistics overview that filters demonstration figures by date window and monitored route. The chosen filter state is remembered locally, and the exact active view can be exported as a clearly labelled CSV. Administrators can also preview a local CSV file, review its parsed headers and a sample of its values, and finalize it only as a **local demonstration job** in the ingestion ledger.

| Capability | Implementation detail |
|---|---|
| **CPI compatibility** | Presents an interpretable mock compatibility score and quality-gate context. |
| **Airfare intelligence** | Supports national, route-level, booking-window, reference, heatmap, and anomaly views. |
| **Governed data operations** | Models pipeline status, job schedules, validation checks, service health, and audit evidence. |
| **CSV tools** | Client-side CSV preview, validation summary, local finalization, and filtered CSV export. |
| **Feedback** | Uses clear visual toast notifications for saved settings, reset events, mappings, and local actions. |

### Accessibility and interaction design

The interface includes a persistent **Dark / Executive Light** theme option and a saved ambient-motion preference. Atmospheric aircraft, cloud, and route-path motion can be disabled through Settings or with a configurable keyboard mapping. The system also respects operating-system reduced-motion preferences.

Keyboard shortcuts are discoverable in the analyst workspace and from the System Admin Settings help modal. Users can customize the command-palette, ambient-motion, signal-desk, and shortcut-reference mappings in Settings. These mappings are validated for uniqueness and saved on the current device.

| Control | Default mapping | Behavior |
|---|---:|---|
| Global command palette | `Ctrl+K` / `Cmd+K` | Searches public, analyst, and System Admin routes. |
| Ambient flight motion | `M` | Toggles atmospheric animation outside text fields and selectors. |
| National Signal Desk | `G` | Returns an analyst user to the main dashboard. |
| Shortcut reference | `?` | Opens or closes the analyst on-screen shortcut panel. |
| Reset to Defaults | Settings control | Requires confirmation before clearing theme, motion, shortcut, and filter preferences. |

## Architecture

The project is a static React application. The client is built with Vite and Tailwind CSS and uses Wouter for client-side routes. Shared typed mock data and local React state enable the interactive demonstration without an external database or back-end API.

```text
client/
├── src/
│   ├── components/       Reusable brand, analytics, layout, command, and UI primitives
│   ├── contexts/         Theme, ambient motion, and configurable shortcut providers
│   ├── data/             Typed deterministic analytical mock data
│   ├── lib/              Engagement telemetry and utility helpers
│   ├── pages/            Public, authentication, analyst, administrator, and style-guide routes
│   ├── App.tsx           Application composition and route groups
│   └── index.css         Institutional design tokens, responsive layout, motion, and component styles
├── public/               Small browser configuration files only
└── index.html            Application document shell

server/                   Static-production compatibility server
shared/                   Shared compatibility constants
skills/                   Reusable AeroIndex frontend refinement skill package
```

### Key application modules

| Module | Responsibility |
|---|---|
| `client/src/App.tsx` | Defines public, analyst, and administrator route boundaries and application providers. |
| `client/src/pages/LandingPage.tsx` | Public product narrative with low-amplitude aviation visuals. |
| `client/src/pages/WorkspacePages.tsx` | Connected analyst dashboards and analytical workspaces. |
| `client/src/pages/AdminPages.tsx` | Separate System Admin controls, CSV tooling, statistics, and settings. |
| `client/src/components/CommandPalette.tsx` | Global keyboard-first navigation between product contexts. |
| `client/src/contexts/ShortcutsContext.tsx` | Persists, validates, and applies customizable keyboard mappings. |
| `client/src/contexts/MotionContext.tsx` | Persists the ambient-motion preference and safely handles shortcut events. |
| `client/src/lib/engagement.ts` | Records capped, non-sensitive demonstration interaction events and forwards them to the available analytics runtime. |

## Quick start

### Requirements

Use a current Node.js runtime and the `pnpm` package manager. The project lockfile is committed, so `pnpm install` restores the expected dependency tree.

```bash
git clone https://github.com/aditya25-25/AeroIndexIndia-frontend.git
cd AeroIndexIndia-frontend
pnpm install
```

### Development

Start the Vite development server and open the displayed local address.

```bash
pnpm dev
```

### Quality checks and production build

Run these commands before opening a pull request or publishing a new frontend revision.

```bash
# Type-check the application
pnpm check

# Build the browser bundle and production compatibility server
pnpm build

# Serve the production bundle locally after building
pnpm start
```

## Routes

| Product context | Route | Description |
|---|---|---|
| Public | `/` | Aviation-led product landing page. |
| Public | `/login` | Separate sign-in threshold. |
| Public | `/signup` | Separate access-request threshold. |
| Public | `/style-guide` | Presentation-ready palette, typography, component, and accessibility guide. |
| Analyst | `/app/dashboard` | National Signal Desk overview. |
| Analyst | `/app/national-index` | National Airfare Index view. |
| Analyst | `/app/route-analysis` | Route-specific fare movement analysis. |
| Analyst | `/app/booking-window` | Booking-window fare behavior. |
| Analyst | `/app/reference-index` | Real-time versus reference comparison. |
| Analyst | `/app/cpi-compatibility` | CPI compatibility and quality context. |
| Analyst | `/app/synthetic-basket` | Synthetic airfare basket management. |
| Analyst | `/app/route-selection` | Smart route-selection workflow. |
| Analyst | `/app/heatmap` | Airfare-inflation heatmap. |
| Analyst | `/app/anomaly-monitor` | Anomaly detection and review. |
| Analyst | `/app/price-explanations` | Explainable price-change view. |
| Analyst | `/app/data-quality` | Data-quality context. |
| Analyst | `/app/data-explorer` | Observation explorer. |
| Analyst | `/app/audit-trail` | Evidence and audit review. |
| System Admin | `/admin/dashboard` | System Control dashboard. |
| System Admin | `/admin/pipeline` | Processing orchestration monitor. |
| System Admin | `/admin/ingestion` | Scheduled collection and local CSV preview. |
| System Admin | `/admin/health` | Service observability. |
| System Admin | `/admin/users` | Local access-governance demonstration. |
| System Admin | `/admin/audit-logs` | Administrative event ledger. |
| System Admin | `/admin/security` | Operational protection controls. |
| System Admin | `/admin/settings` | Theme, motion, shortcuts, resets, timestamps, and keyboard help. |

## Interaction model

### Local preferences

Theme selection, ambient-motion preference, custom shortcut mappings, Settings timestamps, and quick-statistics filters use browser-local storage. Preferences are limited to the current device and browser profile. **Reset to Defaults** removes those stored choices only after the confirmation dialog is accepted.

### Demonstration telemetry

The client records non-sensitive engagement events for actual user interactions, including command navigation, keyboard shortcuts, statistics filters, and CSV import/export actions. When an analytics runtime is available, the same event name and limited context are forwarded to it. Imported CSV values, credentials, and personal data are never placed in the local interaction log.

### CSV import and export

CSV import uses browser-side parsing. A preview modal shows the file name, parsed row count, headers, validation result, and a short sample before local finalization. CSV export reflects the currently selected quick-statistics filters, includes a `demonstration data` designation, and is generated locally through a browser `Blob` download.

## Design system

The visual system is available in the in-app style guide at `/style-guide`. Its primary semantic tokens are described below.

| Token | Value | Intended role |
|---|---:|---|
| Graphite navy | `#111923` | Command canvas and primary dark field. |
| Steel signal | `#536F8C` | Navigation and standard primary controls. |
| Verification teal | `#6A9893` | Brand identity, live state, selected routes, and active series. |
| Sage success | `#6F8A75` | Healthy, eligible, and passed conditions. |
| Antique bronze | `#A48662` | Reference values, caution, and reset context. |
| Brick exception | `#A86360` | Anomalies, errors, and review flags. |

The type hierarchy combines **Sora** for decisive display text and key metrics with **Space Grotesk** for telemetry labels, control copy, and readable analytical detail. Low-amplitude animation uses only opacity and transform and is disabled under reduced-motion conditions.

## Prototype boundaries

> **Important:** This repository demonstrates a frontend product experience. It does not collect airfare data from live providers, calculate or publish an official CPI, authenticate users, store production data, or execute operational actions against external systems.

All numbers, route records, quality scores, service status, user records, imports, exports, AI-style insights, and audit actions are deterministic local demonstration state. The app is structured so its visual and interaction contracts can later connect to governed back-end services, but no such integration is included here.

## Reusable skill

The repository contains the reusable `aeroindex-frontend-refinement` skill at [`skills/aeroindex-frontend-refinement/SKILL.md`](skills/aeroindex-frontend-refinement/SKILL.md). It captures the development approach used for this project, including the product-context model, institutional visual system, accessible ambient motion, custom shortcuts, local CSV preview/export, interaction telemetry, and validation gates.

## Contributing

Keep the public, analyst, and System Admin contexts distinct. Preserve the professional institutional palette and avoid presenting local demonstration values as production or official statistics. Before submitting a change, run `pnpm check` and `pnpm build`; verify representative public, analyst, and administrator routes; and keep any new interactive control accessible by keyboard.

## License

This project is distributed under the [MIT License](LICENSE). If a `LICENSE` file is not yet present in the repository, add one before distributing the code outside the intended team.
