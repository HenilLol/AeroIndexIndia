# AeroIndex India Integration

The existing AeroIndex India dashboard now reads market data from the separate backend through the backend's public tRPC API. The visual layout, navigation, charts, and component structure remain unchanged; the analyst workspace replaces its route and core KPI source with backend-derived data.

## Final API map

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/health` | Backend liveness check | Public |
| GET | `/api/trpc/aeroIndex.public.status` | Service and data-mode metadata | Public |
| GET | `/api/trpc/aeroIndex.public.dashboard` | National index, recent fare snapshot, volatility, and open alerts | Public |
| GET | `/api/trpc/aeroIndex.public.routes.search` | Cursor-paginated route search | Public |
| GET | `/api/trpc/aeroIndex.public.routes.detail` | Route details by `routeId` | Public |
| GET | `/api/trpc/aeroIndex.public.routes.analytics` | Route fare range, trend, volatility, and carrier comparison | Public |
| GET | `/api/trpc/aeroIndex.public.routes.indexHistory` | Route or national index history | Public |
| GET | `/api/trpc/aeroIndex.public.fares.history` | Normalized fare observations and CPI/anomaly fields | Public |
| GET | `/api/trpc/aeroIndex.public.carriers.compare` | Carrier fare comparison | Public |
| GET | `/api/trpc/aeroIndex.public.alerts.list` | Anomaly review queue | Public |

The backend's administrative procedures remain protected by its existing OAuth-admin policy and are not called by the analyst dashboard.

## Frontend environment

```dotenv
VITE_API_BASE_URL=http://localhost:3000
VITE_API_REFRESH_MS=60000
```

The refresh interval is clamped to a minimum of 15 seconds in the client. No database, provider, or JWT secret is exposed to the browser.

## Backend environment

```dotenv
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=...
JWT_SECRET=...
```

Provider variables remain server-side only. Use `.env.example` in each repository as the complete template.

## Local startup

Terminal 1:

```bash
cd AeroindexIndia-backend
pnpm install
pnpm dev
```

Terminal 2:

```bash
cd AeroIndexIndia-frontend
pnpm install
pnpm dev
```

Open the frontend URL printed by Vite. The backend health check is available at `http://localhost:3000/api/health`, subject to the configured port.

## Integration behavior

The client centralizes all backend calls in `client/src/services/api.ts`. `client/src/hooks/useAeroIndexData.ts` loads the dashboard, routes, fares, index history, and alerts in parallel and refreshes them periodically. The existing `App.tsx` passes the resulting route model into the unchanged workspace components. Loading, connection-error, retry, empty, and successful-data paths are handled without allowing a failed API call to crash the dashboard.

## Verification

The frontend TypeScript check passes. The backend TypeScript check passes and 30 backend/frontend tests pass; the existing database integration suite remains blocked when `DATABASE_URL` is not configured and migrations are not applied. This is an environment prerequisite, not an unverified claim of end-to-end database success.
