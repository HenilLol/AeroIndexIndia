# AeroIndex India

**AeroIndex India** is a full-stack market-intelligence application for storing historical domestic airfare observations, producing reproducible route indices, and presenting transparent market signals through a public dashboard and an OAuth-protected operations workspace.

> The deployed implementation uses the existing project's Express, tRPC, Drizzle, MySQL-compatible database, and Manus OAuth foundations. This preserves the typed contract expected by the existing frontend rather than introducing a second, competing API stack.

## Architecture and security model

The public surface is deliberately read-only. Frontend consumers call `aeroIndex.public.*` procedures for dashboard figures, route discovery, historical fares, index history, carrier comparisons, and anomaly alerts. Operational procedures live under `aeroIndex.admin.*`; each applies the server-side OAuth role check and therefore does not rely on frontend claims or UI state.

| Layer | Responsibility | Access |
| --- | --- | --- |
| `drizzle/schema.ts` | Relational entities, foreign keys, uniqueness, and analytic indexes | Server only |
| `server/aeroindex/services.ts` | Validation, idempotent import, Jevons/Törnqvist calculations, robust anomaly flags, and audit records | Server only |
| `server/routers/aeroindex/public.ts` | Typed market intelligence procedures | Public |
| `server/routers/aeroindex/admin.ts` | Source management, data import, recomputation, and anomaly review | OAuth administrator |
| `server/aeroindex/seed.ts` | Reproducible India-focused development reference set | OAuth administrator or local CLI |

Historical fare observations are append-only in practice. An idempotency key is unique, and a retry returns the existing observation instead of changing a stored price. A secondary fingerprint identifies materially repeated observations and flags them without discarding their provenance. Source imports are normalized only; they never execute a supplied URL or code.

## Dashboard data modes and simulation

The dashboard is intentionally explicit about the provenance of every market view. The server returns a safe `dataMode` object for public dashboard responses, while the UI pairs the active mode with a visually distinct badge.

| Mode | Meaning | Dashboard badge |
| --- | --- | --- |
| `live` | A licensed provider has been successfully validated and explicitly enabled through the server-side activation path. | **Live data** |
| `historical` | Validated stored fare observations are displayed. | **Historical data** |
| `fallback` | A live source is unavailable or rejected, so the historical archive remains available. | **Historical fallback** |
| `simulation` | A browser-local visual preview is active. It is never returned by an API response. | **Simulation** |

Use **Preview live UI** to review future live-price and route-status presentation before provider access exists. The preview supports **On time**, **Delayed**, and **Cancelled** route-status illustrations. It does not call a provider, accept or disclose a credential, write to the database, recalculate an index, create an anomaly, or change the server-derived historical mode.

## Secure provider activation

Provider credentials deliberately stay outside the browser. The administrator-only **Secure integration settings** screen contains no secret input or stored key value. Instead, it directs operators to **Management UI → Settings → Secrets**, followed by protected server-side validation and explicit connector activation.

New administrators can use the optional three-step **Start guided activation** tour:

1. Save a provider-issued server variable through managed secrets.
2. Return to Operations and validate the gateway access server-side.
3. Enable the bounded live connector only after validation and authorised provider coverage are confirmed.

| Provider | Intended use | Required server variable | Explicit activation variable |
| --- | --- | --- | --- |
| Skyscanner Flights Live Prices | Licensed fare offers for normalised price observations. | `SKYSCANNER_API_KEY` | `SKYSCANNER_LIVE_INGEST_ENABLED=true` |
| Aviation Edge | Licensed route, timetable, and flight-status enrichment; it does not supply fare-index prices. | `AVIATION_EDGE_API_KEY` | `AVIATION_EDGE_LIVE_ENABLED=true` |

> A missing, failed, or rate-limited provider must never be bypassed by scraping or unapproved sources. AeroIndex continues with clearly labelled historical data until approved access is available again.

## Domain model

The schema models cities, airports, carriers, routes, individual flights, data sources, historical fare observations, route and national index snapshots, anomaly records, and audit logs. The fare table is indexed for the principal dashboard and analytical dimensions, including observation time, travel and booking dates, route, carrier, source, validation state, and anomaly state.

| Entity | Purpose |
| --- | --- |
| `cities`, `airports`, `carriers`, `routes`, `flights` | Stable aviation reference data with relational integrity |
| `dataSources` | Source identity, type, activity state, reliability score, and last-import timestamp |
| `fareObservations` | Immutable fare history, booking/travel/observation dates, normalised INR price, validation, compatibility score, duplicate state, and anomaly score |
| `indexSnapshots` | Versioned route-level Jevons and national weighted index outputs |
| `anomalyRecords` | Transparent severity, rule and statistical scores, review disposition, reviewer, and explanation |
| `auditLogs` | Operational trace for source changes, imports, recalculation, and review actions |

## Local setup and database workflow

The managed project injects `DATABASE_URL` and OAuth settings in the hosted environment. For a local clone, set a MySQL-compatible `DATABASE_URL` and the authentication variables documented in the scaffold. Do not commit `.env` files or embed credentials in source code.

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm test
pnpm check
pnpm build
pnpm dev
```

`pnpm db:seed` creates a small deterministic reference dataset for Ahmedabad, Mumbai, Delhi, Bengaluru, selected Indian carriers, and representative normalized observations. It is safe to re-run because seed imports use stable idempotency keys.

## Typed procedure contract

The existing frontend should import the generated `AppRouter` types through its existing tRPC client and call the following procedures. Dates are transported with SuperJSON; UI code should render them in the user's local time zone.

| Procedure | Visibility | Primary use |
| --- | --- | --- |
| `aeroIndex.public.status` | Public | Service metadata and access policy |
| `aeroIndex.public.dashboard` | Public | Market snapshot, latest national index, and recent alerts |
| `aeroIndex.public.routes.search` | Public | Cursor-paginated route search and IATA filtering |
| `aeroIndex.public.routes.detail` / `analytics` / `indexHistory` | Public | Route detail, trends, volatility, carrier comparison, and index series |
| `aeroIndex.public.fares.history` | Public | Cursor-paginated historical observation results with safe filters |
| `aeroIndex.public.carriers.compare` | Public | Route-scoped or all-market carrier comparison |
| `aeroIndex.public.alerts.list` | Public | Current anomaly alert feed |
| `aeroIndex.admin.sources.*` | Administrator | Source metadata management |
| `aeroIndex.admin.ingestion.importOne` / `importBatch` | Administrator | Validated and idempotent normalized fare imports; batches are capped at 500 |
| `aeroIndex.admin.indices.*` | Administrator | Reproducible route and national index recalculation |
| `aeroIndex.admin.anomalies.review` | Administrator | Review status and audit update |
| `aeroIndex.admin.providers.*` | Administrator | Safe provider readiness, server-side credential validation, and bounded route or fare previews after activation |

### Example normalized import

```ts
await trpc.aeroIndex.admin.ingestion.importOne.mutate({
  idempotencyKey: "ota-2026-08-27-amd-bom-6e-001",
  sourceId: 1,
  routeId: 1,
  carrierId: 1,
  flightNumber: "6E123",
  observationAt: new Date("2026-08-27T09:00:00.000Z"),
  bookingDate: new Date("2026-08-27T00:00:00.000Z"),
  travelDate: new Date("2026-09-15T00:00:00.000Z"),
  passengerCount: 1,
  cabinClass: "economy",
  currency: "INR",
  baseFare: 4950,
  taxes: 700,
  fees: 200,
  totalFare: 5850,
  normalizedFareInr: 5850,
});
```

The import validates date order, fare arithmetic, monetary bounds, cabin class, IATA-like flight numbers, source/route/carrier activity, and origin-destination integrity. It then derives booking window, a weighted and versioned CPI-compatibility breakdown, duplicate status, and a transparent anomaly assessment before persisting the observation.

## Calculation methodology and operational expectations

The route index is a matched-carrier **Jevons geometric mean**. The national index is an observation-count-weighted **Törnqvist-style aggregation** of route snapshots. Confidence combines the number of matched price relatives and observed route stability. Anomaly detection is deterministic and explainable: it combines a configurable percentage-deviation rule with IQR and median-absolute-deviation checks; sparse history produces an explicit non-anomalous fallback rather than an invented ML result.

The current managed deployment is designed for API requests and short, bounded batch imports. Automated web scraping, browser automation, and long-running queue workers must be deployed separately only after source permission, legal/terms review, operational frequency, and hosting requirements have been agreed. The API intentionally does not accept arbitrary scraper URLs or remote code.

Run `pnpm test` for calculation, authorization, data-mode, simulation, and activation-tour checks. Then run `pnpm check` for TypeScript validation before publishing a deployment checkpoint.

## Further documentation

| Document | Purpose |
| --- | --- |
| [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) | Full public and administrator tRPC procedure catalogue, typed examples, and local endpoint smoke tests. |
| [`docs/PROVIDER_ACTIVATION.md`](docs/PROVIDER_ACTIVATION.md) | Secure activation sequence, dashboard data-mode semantics, simulation safeguards, and provider controls. |
| [`docs/live-provider-alternatives.md`](docs/live-provider-alternatives.md) | Reviewed licensed fare and route-status data-provider alternatives. |
| [`docs/no-key-live-data-assessment.md`](docs/no-key-live-data-assessment.md) | Assessment of why no-key sources are not used as production fare or operational feeds. |
| [`docs/source-adapter-assessment.md`](docs/source-adapter-assessment.md) | Adapter selection and source-integration assessment. |

## Contributing

Preserve the truthfulness of the public data-mode contract, the OAuth administrator boundary, and the server-only secret boundary. Add or update Vitest coverage for behavioural changes, then run `pnpm check` and `pnpm test` before committing.

## License

This project is distributed under the [MIT License](https://opensource.org/license/mit/), as declared in `package.json`.
