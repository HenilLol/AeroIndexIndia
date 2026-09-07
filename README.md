# AeroIndex India

AeroIndex India is an evidence-led airfare intelligence workspace for exploring route-level fare observations, national index signals, booking-window behavior, data quality, CPI compatibility, anomaly review, and governed operational workflows.

The repository keeps the two application surfaces deliberately separated. The browser experience lives in `Frontend/`, while the typed API, provider adapters, persistence layer, database schema, and server-side operational controls live in `Backend/`.

> **Prototype boundary:** The project is designed as a governed demonstration and development foundation. Provider credentials, live airfare collection, official CPI publication, production authentication, and external operational actions must be configured and approved separately before deployment.

> 📘 **SIH 2026 Technical & Pitch Guide:** For an exhaustive 39-point deep-dive into the web scraping pipeline, validation quality gates (V-1 to V-5), CPI compatibility scoring, Jevons & Törnqvist statistical index formulas, Isolation Forest anomaly detection, database schema, end-to-end trace, and 30-second presentation pitch, see [**TECHNICAL_ARCHITECTURE_AND_PITCH_GUIDE.md**](TECHNICAL_ARCHITECTURE_AND_PITCH_GUIDE.md).


## Repository layout

| Directory | Responsibility |
|---|---|
| [`Frontend/`](Frontend/) | React/Vite client application, public product pages, analyst workspaces, administrator UI, shared UI primitives, and frontend compatibility server. |
| [`Backend/`](Backend/) | Full-stack server application, tRPC routers, Aero Index domain services, provider adapters, database schema and migrations, operational UI, and automated tests. |

The repository root intentionally contains only project documentation and the two application directories. Frontend files must remain under `Frontend/`; backend files must remain under `Backend/`.

## Product areas

The frontend presents three connected but distinct contexts:

| Context | Purpose | Representative areas |
|---|---|---|
| **Public product** | Explain the Aero Index proposition and provide access pathways. | Landing page, login, signup, and style guide. |
| **Analyst signal desk** | Explore fare intelligence and evidence quality. | National index, route analysis, booking windows, synthetic basket, heatmap, anomaly monitor, data explorer, and audit trail. |
| **System Admin** | Demonstrate governed operational control. | Pipeline, ingestion, health, permissions, security, audit logs, provider settings, and administrative review. |

The backend exposes typed procedures for public market-intelligence views, authenticated administration, ingestion workflows, provider status, route and timetable enrichment, anomaly review, and audit-oriented operations. Refer to [`Backend/docs/API_REFERENCE.md`](Backend/docs/API_REFERENCE.md) for the detailed procedure map.

## Technology overview

The project uses TypeScript across both application surfaces. The frontend is a React application built with Vite and Tailwind CSS, with Wouter for client-side navigation and reusable UI primitives under `Frontend/client/src/components/ui/`. The backend uses a Vite-compatible server bundle, tRPC for typed procedures, Drizzle ORM for database access and migrations, and Vitest for automated tests.

The frontend can run independently with deterministic local demonstration data. The backend provides the server-side domain and integration boundary required for a governed deployment. Live provider adapters are intentionally inactive by default and must never expose credentials in the browser bundle.

## System Architecture & Technical Pipeline (SIH 2026)

AeroIndex India is architected for the **Smart India Hackathon 2026** ([PS-SIH26056: Automated Airfare Data Collection, Validation, and Index Calculation](https://sih2026.vuce.in/ps/SIH26056?utm_source=chatgpt.com)).

```text
Airline & OTA Portals (IndiGo, Air India, etc.)
       │
       ▼  Playwright Browser Automation
Raw Fare Data (DEL-BOM, ₹6,250, T-13 days, Cabin, Carrier)
       │
       ▼  Pydantic + Quality Gates (V-1 to V-5)
Validation & Normalization (DEL, BOM, Positive Fares, Non-duplicates)
       │
       ▼  Algorithm (Route, Window, Passenger & Source Quality)
CPI Compatibility Scoring (e.g. 96/100 Usable vs 61/100 Quarantine)
       │
       ▼  Range Partitioning
PostgreSQL Data Warehouse (fact_flight_fares_YYYY_MM)
       │
       ├──────────────────────────────────┐
       ▼                                  ▼
Route-Level Jevons Index            Isolation Forest ML
(Matched Geometric Mean)            (Anomaly Detection Engine)
       │                                  │
       ▼                                  ▼
National Törnqvist Index            Analyst Anomaly Feed
(Passenger Weighted Aggregation)    (Quarantine / Evidence Review)
       │                                  │
       └──────────────────┬───────────────┘
                          ▼
            FastAPI / tRPC Backend Gateway
                          ▼
            Next.js / React Analyst Signal Desk
```

### Core Architecture Highlights
- **Collection**: Playwright programmatically executes search sequences across booking windows (30d, 15d, 7d, 1d).
- **Validation Quality Gates (V-1 to V-5)**: Required fields, boundary checks, chronological date consistency, and cryptographic deduplication.
- **CPI Compatibility Score (⭐)**: Measures observation purity for official statistical index compliance.
- **Statistical Mathematics**:
  - **Jevons Index**: Unweighted geometric mean of price relatives at the elementary route level.
  - **Törnqvist Index**: Superlative weighted geometric index incorporating corridor passenger shares for national aggregation.
- **Isolation Forest**: Unsupervised ML isolating price spikes and scraping anomalies without distorting statistical baselines.
- **Traceability & Lineage**: Full backwards audit trail from national index values down to raw scraping timestamps.

👉 *See [**TECHNICAL_ARCHITECTURE_AND_PITCH_GUIDE.md**](TECHNICAL_ARCHITECTURE_AND_PITCH_GUIDE.md) for the complete 39-point deep dive, mathematical formulas, and presentation pitch.*


## Prerequisites

Install a current Node.js runtime and `pnpm`. Each application has its own lockfile and package manifest, so dependencies are installed independently from the corresponding directory.

```bash
node --version
pnpm --version
```

## Frontend development

```bash
cd Frontend
pnpm install
pnpm dev
```

The Vite development server prints the local URL when it starts. Useful frontend quality commands are:

```bash
cd Frontend

# Type-check without emitting files
pnpm check

# Build the browser bundle and compatibility server
pnpm build

# Run the built compatibility server
pnpm start

# Format frontend files with Prettier
pnpm format
```

The main frontend routes include `/`, `/login`, `/signup`, `/style-guide`, analyst routes under `/app/*`, and administrator routes under `/admin/*`. The frontend README at [`Frontend/README.md`](Frontend/README.md) contains the complete route catalogue and interaction model.

## Backend development

```bash
cd Backend
pnpm install
pnpm dev
```

The backend development process watches `server/_core/index.ts`. Its principal commands are:

```bash
cd Backend

# Type-check the backend
pnpm check

# Build the production server bundle
pnpm build

# Run the production bundle after building
pnpm start

# Execute the backend test suite
pnpm test

# Generate and apply database migrations
pnpm db:push

# Generate migration files only
pnpm db:generate

# Apply existing migrations
pnpm db:migrate

# Seed local development data
pnpm db:seed

# Format backend files with Prettier
pnpm format
```

Database commands require a correctly configured development database. Do not commit credentials, session cookies, provider keys, or generated local secret files.

## Configuration and provider safety

Use the environment templates and integration notes in the application directories as the source of truth for local configuration. Provider credentials belong exclusively in server-side configuration. They must not be placed in `Frontend/.env`, committed to Git, or returned through browser-facing procedures.

The repository includes documented adapters for fare and aviation operational data. Fare ingestion and flight-status/timetable enrichment are separate concerns. Live integrations should remain disabled until the provider account, credential validation, data contract, rate limits, and approval process have been completed. See:

- [`Backend/docs/PROVIDER_ACTIVATION.md`](Backend/docs/PROVIDER_ACTIVATION.md) for the activation sequence.
- [`Backend/docs/API_REFERENCE.md`](Backend/docs/API_REFERENCE.md) for typed API procedures.
- [`Frontend/docs/INTEGRATION.md`](Frontend/docs/INTEGRATION.md) for the frontend/backend integration contract.

## Testing and validation

Before submitting a change, run the checks for the area you modified:

```bash
cd Frontend && pnpm check && pnpm build
cd ../Backend && pnpm check && pnpm test && pnpm build
```

When changes cross the application boundary, verify that public, analyst, and administrator routes still render, typed procedures remain aligned, provider failures fall back safely, and no secret or backend-only module is imported into the frontend bundle.

## Design and interaction principles

Aero Index India uses an Aviation Operations Room visual language: graphite-navy command surfaces, restrained verification teal, instrument-style labels, accessible contrast, and low-amplitude aircraft and route motion. Users can switch between Dark and Executive Light themes, disable ambient motion, configure keyboard shortcuts, and respect operating-system reduced-motion preferences.

The frontend’s local CSV preview/export, audit displays, status indicators, and analytical values are demonstration-oriented. They should be presented as evidence-led product workflows rather than as official government statistics or guaranteed live market measurements.

## Security and data handling

Never commit `.env` files, API keys, OAuth session values, database credentials, or personal data. Use short-lived local credentials only for local testing, keep provider calls server-side, validate imported data on the backend before persistence, and return safe status information instead of secret values.

If a live provider is unavailable or rejected, the application should preserve a transparent historical or fallback state rather than silently presenting synthetic data as live. Administrative operations should remain protected by the project’s authentication and authorization boundaries.

## Contributing

Keep `Frontend/` and `Backend/` strictly separated. Preserve the distinction between public, analyst, and administrator workflows; maintain keyboard accessibility and reduced-motion behavior; document changes to API procedures and database schema; and add tests for new backend domain logic or provider behavior.

A pull request should explain the affected application area, configuration changes, migration requirements, validation commands, and any prototype-versus-production boundary. The root commit should contain only intentional project files, and generated dependencies or secrets must never be committed.

## License

The frontend includes the project license at [`Frontend/LICENSE`](Frontend/LICENSE). Review the applicable license terms before redistributing the combined repository or deploying its components outside the intended development context.
