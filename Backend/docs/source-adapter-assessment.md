# Source Adapter Assessment

The current task has no configured external flight-data connector or provider credential. The implementation will therefore preserve a provider-neutral adapter boundary and will not use browser automation or unauthorised scraping against airline or OTA consumer websites.

| Candidate | Assessment | Implementation decision |
| --- | --- | --- |
| Amadeus Self-Service Flights | Official developer platform, but the documentation page could not be inspected beyond the cookie layer in the current session. | Keep as a possible credential-backed provider only after the user supplies an approved account and credentials. |
| Skyscanner Flights Live Prices | Official documentation describes a `create` then `poll` live-search lifecycle, lists an API-key authorization requirement, documents 401/403 outcomes, and identifies partner onboarding as the approved access path. | Select as the provider target. Keep the adapter disabled until a valid partner-issued server key has passed the provider gateway check. |
| Airline or OTA consumer websites | No permission or partner credential has been supplied. | Explicitly out of scope; no scraping or arbitrary remote URL execution will be built. |

The immediate product work can integrate the frontend and operational dashboard against existing public and protected typed APIs. The real-time adapter will be completed as a secret-backed, source-specific configuration once a licensed provider and its credentials are confirmed.

## Aviation Edge route and status connector

The Aviation Edge implementation uses only provider-documented REST endpoints: `/v2/public/flights` for live flight-tracker validation, `/v2/public/timetable` for airport arrivals and departures, and `/v2/public/routes` for airline network lookup. It supplies no ticket fares and cannot affect the AeroIndex public fare index. Every request remains server-side, has a bounded timeout and result size, requires OAuth administrator access, and remains inactive until `AVIATION_EDGE_LIVE_ENABLED=true` and a secure `AVIATION_EDGE_API_KEY` have been validated.

The official provider material for this adapter is the [Flight Tracker API](https://aviation-edge.com/flight-radar-and-tracker-api/), [Airline Routes API](https://aviation-edge.com/airline-routes-database-and-api/), and [Flight Schedule API](https://aviation-edge.com/flight-schedule-and-timetable-of-airlines-and-airports/).

## Source material

The provider assessment used Skyscanner’s official [Flights Live Prices overview](https://developers.skyscanner.net/docs/flights-live-prices/overview), [live-pricing API reference](https://developers.skyscanner.net/api/flights-live-pricing), [developer introduction](https://developers.skyscanner.net/docs/intro), and [partner API application page](https://www.partners.skyscanner.net/product/travel-api). The live-pricing reference identifies API-key authorization and 401/403 access outcomes; the partner page describes the approved onboarding route.

The official reference confirms the documented search endpoint is `POST /apiservices/v3/flights/live/search/create` and labels its authorization scheme `UserAuth`. The public reference displays 401 as “Please provide a valid API key” and 403 as “You don't have access to the requested resource.” The account currently returns 401 using the widely documented `x-api-key` header, which indicates that live access cannot be safely enabled without account-specific authentication confirmation from the provider.
