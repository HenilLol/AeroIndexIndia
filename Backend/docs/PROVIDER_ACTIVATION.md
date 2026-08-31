# Provider Activation Guide

## Current approved state

The current AeroIndex environment is deliberately configured for **historical fare data**. Both live adapters are inactive unless an approved key is stored and its explicit server-side live flag is enabled. The dashboard visibly reports this state and never presents historical observations as live prices.

## Previewing live-data user interface safely

The public dashboard includes a **Preview live UI** control for design review before any provider key exists. It is a browser-local presentation setting, not a data-source switch. The market banner pairs a mode title with a clear badge: **Live data** identifies verified live provider output, **Historical data** identifies the validated archive, **Historical fallback** identifies a safe failover, and **Simulation** identifies a local illustrative preview. When simulation is enabled, every affected screen displays **“Simulation—no live data”** and a notice that the visual preview still uses validated historical values.

The simulation includes an explicitly labelled **Preview route-status scenario** control with **On time**, **Delayed**, and **Cancelled** illustrations. These controls help review expected UI treatment; they do not call a provider, submit a credential, persist an observation, change the server-derived data mode, recalculate an index, create an anomaly, or appear in an API response. Exit the preview to return immediately to the server-reported historical or fallback state.

| Provider | Data purpose | Required secure key | Explicit activation flag | Public impact when unavailable |
| --- | --- | --- | --- | --- |
| Skyscanner Flights Live Prices | Licensed ticket-price offers used to form fare observations. | `SKYSCANNER_API_KEY` | `SKYSCANNER_LIVE_INGEST_ENABLED=true` | Dashboard remains in historical or fallback fare mode. |
| Aviation Edge | Licensed route, airport timetable, and flight-status enrichment. It never supplies fare-index prices. | `AVIATION_EDGE_API_KEY` | `AVIATION_EDGE_LIVE_ENABLED=true` | Fare dashboard remains unchanged and historical. Route/status previews remain unavailable to administrators. |

## Secure activation sequence

First, open the project’s **Management UI → Settings → Secrets**. Enter the provider-issued key in the named server environment variable. Do not put keys in the web application form, browser storage, source code, chat, or a committed `.env` file.

The AeroIndex **Operations** screen provides status and validation controls, together with **Update key securely** guidance, but deliberately has no secret input field. The **Secure integration settings** page also includes an optional, dismissible **Start guided activation** tour. Its three steps direct administrators to managed secrets, then server-side validation, and finally explicit activation after validation. This preserves the security boundary while making the activation process easier to follow.

Second, sign in as an AeroIndex administrator and open **Operations**. Use **Validate gateway access** for the relevant provider. The app sends a bounded server-side validation request and returns only an outcome, HTTP status, timestamp, and a safe message; it never returns a key.

Third, after a successful validation and confirmation that the permitted product covers the intended India routes or price offers, set the provider’s live-activation flag through the same secure project settings. Reopen Operations and confirm that the status changes from **Inactive** to **Enabled**.

Finally, use the protected preview procedure before persisting anything. Aviation Edge provides operational data through its documented Flight Tracker, Airline Routes, and Flight Schedule endpoints.[1] Skyscanner’s live-pricing adapter should be used only with the partner product’s confirmed authentication method and permissions.[2]

> **Safety rule:** a failed validation, upstream outage, rate limit, or missing key must not be bypassed. AeroIndex continues to serve its clearly labelled historical fare archive until the provider is available again.

## Administrator procedures

| Procedure | Purpose |
| --- | --- |
| `aeroIndex.admin.providers.validateSkyscannerCredential` | Validates the configured fare-provider access without exposing the credential. |
| `aeroIndex.admin.providers.validateAviationEdgeCredential` | Validates the configured route/status provider access without exposing the credential. |
| `aeroIndex.admin.providers.skyscannerSearch` | Previews or ingests a permitted live fare search after activation. |
| `aeroIndex.admin.providers.aviationEdgeTimetable` | Previews normalized airport arrival or departure status after activation. |
| `aeroIndex.admin.providers.aviationEdgeRoutes` | Previews normalized airline route records after activation. |

## References

[1] [Aviation Edge Flight Tracker API](https://aviation-edge.com/flight-radar-and-tracker-api/), [Airline Routes API](https://aviation-edge.com/airline-routes-database-and-api/), and [Flight Schedule API](https://aviation-edge.com/flight-schedule-and-timetable-of-airlines-and-airports/).

[2] [Skyscanner Flights Live Prices overview](https://developers.skyscanner.net/docs/flights-live-prices/overview) and [live-pricing API reference](https://developers.skyscanner.net/api/flights-live-pricing).
