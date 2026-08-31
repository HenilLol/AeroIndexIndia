# AeroIndex India API Reference

The AeroIndex API is exposed through the typed tRPC endpoint at `/api/trpc`. Browser clients should use the supplied `trpc` client rather than maintaining hand-written HTTP response types. All public prices, indices, trends, and flags are server-derived; the frontend must not reimplement the calculation rules.

> **Access model.** `aeroIndex.public.*` procedures are publicly readable. `aeroIndex.admin.*` procedures require a valid managed OAuth session for a user whose persisted role is `admin`. No client-provided role flag is accepted as authorization.

## Public market intelligence

| Procedure | Input | Returns |
| --- | --- | --- |
| `aeroIndex.public.status` | None | Service metadata and public/operational access policy. |
| `aeroIndex.public.dashboard` | None | Latest national index, market observation count, recent average fare, volatility, and alerts. |
| `aeroIndex.public.routes.search` | `{ query?, originIata?, destinationIata?, limit, cursor? }` | Cursor-paginated airport-to-airport routes. |
| `aeroIndex.public.routes.detail` | `{ routeId }` | One fully resolved route. |
| `aeroIndex.public.routes.analytics` | `{ routeId }` | Trend, fare range, volatility, and carrier comparison for the route. |
| `aeroIndex.public.routes.indexHistory` | `{ routeId?, limit }` | Persisted route or national index time series. |
| `aeroIndex.public.fares.history` | Route, carrier, date, fare, anomaly, limit, and cursor filters | Cursor-paginated normalized observations. |
| `aeroIndex.public.carriers.compare` | `{ routeId? }` | Carrier fare position, range, volatility, and trend. |
| `aeroIndex.public.alerts.list` | `{ limit }` | Anomaly flag feed with review state and explanation. |

Every public `dashboard` response also includes a safe `dataMode` object. Its `mode` is `live`, `historical`, or `fallback`; its `warning` provides a user-readable explanation when live provider data is not being used. This object never discloses provider credentials or account details.

### Browser client examples

```tsx
const dashboard = trpc.aeroIndex.public.dashboard.useQuery();

const routes = trpc.aeroIndex.public.routes.search.useQuery({
  query: "AMD",
  limit: 20,
});

const routeAnalytics = trpc.aeroIndex.public.routes.analytics.useQuery(
  { routeId: 1 },
  { enabled: Boolean(1) },
);
```

Always render pending, empty, and error states. The `Home` screen in this project contains a reference implementation for dashboard, route search, index history, carrier comparison, and anomaly feed queries.

### Public endpoint smoke tests

Run these commands from the project root while the development server is running. The default local endpoint is `http://127.0.0.1:3000`.

```bash
# Safe service metadata
curl -sS "http://127.0.0.1:3000/api/trpc/aeroIndex.public.status"

# Dashboard payload
curl -sS "http://127.0.0.1:3000/api/trpc/aeroIndex.public.dashboard"

# Routes matching Ahmedabad
curl -sSG "http://127.0.0.1:3000/api/trpc/aeroIndex.public.routes.search" \
  --data-urlencode 'input={"json":{"query":"AMD","limit":10}}'

# Route analytics for route 1
curl -sSG "http://127.0.0.1:3000/api/trpc/aeroIndex.public.routes.analytics" \
  --data-urlencode 'input={"json":{"routeId":1}}'
```

## Restricted operations

| Procedure | Input | Operational effect |
| --- | --- | --- |
| `aeroIndex.admin.sources.list` | None | Read source reliability, activation state, and last-successful import timestamp. |
| `aeroIndex.admin.sources.upsert` | Source slug, name, kind, reliability, activation state | Create or update approved source metadata; audit logged. |
| `aeroIndex.admin.ingestion.importOne` | One normalized fare observation | Validate, deduplicate, score, detect, append, update source health, and audit log atomically. |
| `aeroIndex.admin.ingestion.importBatch` | `{ observations: [...] }`, maximum 500 | Sequentially import a bounded batch with per-observation outcomes. |
| `aeroIndex.admin.indices.recomputeRoute` | Route, baseline date, as-of date | Persist reproducible Jevons route index. |
| `aeroIndex.admin.indices.recomputeNational` | Baseline and as-of dates | Persist weighted national index from persisted route snapshots. |
| `aeroIndex.admin.anomalies.review` | Anomaly identifier and review state | Persist reviewer, timestamp, review disposition, and audit event. |
| `aeroIndex.admin.providers.skyscannerStatus` | None | Report only whether the server-side provider adapter is configured and explicitly enabled; does not reveal the key. |
| `aeroIndex.admin.providers.validateSkyscannerCredential` | None | Make a bounded server-side validation request and return only safe validity, HTTP-status, timestamp, and message fields. A rejected or unreachable provider moves public status to historical fallback. |
| `aeroIndex.admin.providers.aviationEdgeStatus` | None | Safe server-side connector status for Aviation Edge. Reports configuration and activation state, supported operational datasets, and confirms that it does not supply fare data. |
| `aeroIndex.admin.providers.validateAviationEdgeCredential` | None | Bounded server-side gateway validation. Returns safe validity, HTTP-status, timestamp, and message fields without returning the API key. |
| `aeroIndex.admin.providers.aviationEdgeTimetable` | `{ airportIata, direction, airlineIata?, status?, limit? }` | OAuth-admin-only normalized airport arrival or departure timetable preview. Requires active licensed provider access. |
| `aeroIndex.admin.providers.aviationEdgeRoutes` | `{ airlineIata?, departureIata?, arrivalIata?, flightNumber?, limit? }` | OAuth-admin-only normalized airline-route preview. Requires at least one filter and active licensed provider access. |

### Aviation Edge operational data

The Aviation Edge adapter is intentionally separate from the fare-index pipeline. It is designed only for licensed **flight status**, **airport timetable**, and **airline route** enrichment. Set `AVIATION_EDGE_API_KEY` through the secure project secrets interface and set `AVIATION_EDGE_LIVE_ENABLED=true` only after the administrative credential-validation procedure succeeds. When inactive or unavailable, no public fare response is changed: the dashboard remains transparently historical or follows its existing historical-fallback policy.

Example administrator operation using the typed client:

```ts
await trpc.aeroIndex.admin.providers.aviationEdgeTimetable.mutate({
  airportIata: "BOM",
  direction: "departure",
  airlineIata: "6E",
  limit: 20,
});
```
| `aeroIndex.admin.providers.skyscannerSearch` | Source, route, carrier, booking/travel dates, adults, and `preview` or `ingest` mode | Run a bounded Skyscanner live search. `preview` returns normalized candidates without database writes; `ingest` persists the lowest valid INR candidate through the existing audited ingestion service. |

Administrators should use typed browser mutations from the protected operations screen. For a local protocol test, first sign in through OAuth, then use the resulting session only on your own machine; do not share it or commit it.

```bash
# Example only: replace the placeholder with your own short-lived local session token.
curl -sS -X POST "http://127.0.0.1:3000/api/trpc/aeroIndex.admin.anomalies.review" \
  -H "content-type: application/json" \
  -H "cookie: app_session_id=<YOUR_OAUTH_SESSION>" \
  --data '{"json":{"anomalyId":1,"reviewStatus":"confirmed"}}'
```

## Normalized fare import requirements

An import must identify an existing source, route, and carrier. It must include an observation timestamp, booking date, travel date, positive prices, and a positive INR-normalized fare. The server checks that travel date is not before booking date and that total fare is not less than base fare plus taxes and fees. It calculates booking window, CPI compatibility, duplicate state, anomaly assessment, and data-source freshness itself.

```ts
await trpc.aeroIndex.admin.ingestion.importOne.mutate({
  idempotencyKey: "skyscanner-amd-bom-2026-09-15-6e-123",
  sourceId: 1,
  routeId: 1,
  carrierId: 1,
  flightNumber: "6E123",
  observationAt: new Date(),
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

## Skyscanner live-pricing adapter prerequisite

The selected provider target is **Skyscanner Flights Live Prices**, which provides a documented create-and-poll search lifecycle. The backend must store its partner-issued API key server-side and should only create searches for approved source configurations. The live contract test is intentionally disabled until the account owner enters a working provider key and sets `AEROINDEX_LIVE_PROVIDER_CONTRACT_TEST=true` in secure project configuration; it verifies that the provider gateway does not reject the key before live ingestion is enabled.

The adapter will not scrape consumer websites, execute caller-supplied URLs, or expose a provider key in the browser bundle. It is deliberately **inactive by default**, even when a key is present. A deployment owner must set the server-only `SKYSCANNER_LIVE_INGEST_ENABLED=true` flag after the provider accepts the credential in the live contract test. The provider’s documented API access must be approved for the intended market-intelligence usage before the live source is activated.
