# AeroIndex India — Production Deployment Guide

This document details the production architecture, environment configuration, migration procedure, and manual cloud deployment steps for **AeroIndex India**.

## Architecture Overview

```text
Vercel (Frontend SPA)
       │  (HTTPS / tRPC queries)
       ▼
Render (Express + tRPC Node.js Backend)
       │  (PostgreSQL Connection Pool)
       ▼
Supabase (Managed PostgreSQL Database)
```

| Layer | Host | Technology / Runtime | Responsibility |
| --- | --- | --- | --- |
| **Frontend** | Vercel | React 19, Vite 7, Wouter, Tailwind CSS v4 | Interactive analytical UI & executive views |
| **Backend API** | Render | Express 4, tRPC v11, Node.js (TypeScript) | Market index calculation, anomaly detection, API routing |
| **Database** | Supabase | PostgreSQL | Relational persistence, indices, append-only fare history |

---

## 1. Supabase PostgreSQL Setup Procedure

1. Log in to [https://supabase.com](https://supabase.com) and create a new project named **AeroIndex India**.
2. Navigate to **Project Settings -> Database** and copy the **Connection String** (`DATABASE_URL`).
   * *Recommended*: Use Connection Pooling URL on port `6543` or Direct Connection URL on port `5432` with `?sslmode=require`.
3. Open the **SQL Editor** in Supabase and execute the complete initial migration script from [`Backend/supabase/migrations/0000_initial_pg_schema.sql`](file:///C:/Users/Henil%20Patel/.gemini/antigravity-ide/scratch/AeroindexIndia/Backend/supabase/migrations/0000_initial_pg_schema.sql).
4. Verify that all 11 tables (`users`, `cities`, `airports`, `carriers`, `routes`, `flights`, `dataSources`, `fareObservations`, `indexSnapshots`, `anomalyRecords`, `auditLogs`) and their custom enum types are created.

---

## 2. Render Backend Deployment Procedure

1. Log in to [https://render.com](https://render.com) and select **New + -> Web Service**.
2. Connect your GitHub repository (`https://github.com/aditya25-25/AeroindexIndia`).
3. Configure the Web Service settings:
   * **Name**: `aeroindex-india-backend`
   * **Root Directory**: `Backend`
   * **Environment**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start`
   * **Health Check Path**: `/health`
4. Add the following Environment Variables under **Environment**:
   * `NODE_ENV`: `production`
   * `DATABASE_URL`: `<Your Supabase PostgreSQL Connection String>`
   * `JWT_SECRET`: `<Generate a random 64-character secret string>`
   * `CORS_ORIGINS`: `https://<your-vercel-app-name>.vercel.app`
   * `FRONTEND_URL`: `https://<your-vercel-app-name>.vercel.app`
5. Click **Create Web Service**. Render will build and deploy the backend. Note the assigned Web Service URL (e.g., `https://aeroindex-backend.onrender.com`).

---

## 3. Vercel Frontend Deployment Procedure

1. Log in to [https://vercel.com](https://vercel.com) and click **Add New... -> Project**.
2. Import the GitHub repository (`https://github.com/aditya25-25/AeroindexIndia`).
3. Configure project settings:
   * **Root Directory**: `Frontend`
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist/public`
4. Add Environment Variable:
   * `VITE_API_BASE_URL`: `https://<your-render-backend-name>.onrender.com`
5. Click **Deploy**. Vercel will bundle the Vite single-page application.
6. Note the production Vercel URL (e.g., `https://aeroindex-india.vercel.app`).
7. Return to **Render Dashboard** and verify `CORS_ORIGINS` matches the production Vercel domain.

---

## 4. Environment Variable Reference

### Backend (`Backend/.env.example`)
| Variable | Required? | Secret? | Configured In | Description |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | Yes | No | Render Dashboard | Environment mode (`production`) |
| `PORT` | Yes | No | Render (Auto) | Port provided by Render (default `10000`) |
| `DATABASE_URL` | Yes | Yes | Render Dashboard | Supabase PostgreSQL Connection String |
| `JWT_SECRET` | Yes | Yes | Render Dashboard | Secret token signing key |
| `CORS_ORIGINS` | Yes | No | Render Dashboard | Allowed Vercel Frontend domain(s) |
| `FRONTEND_URL` | Yes | No | Render Dashboard | Primary Vercel Frontend origin |
| `SKYSCANNER_API_KEY` | Optional | Yes | Render Dashboard | Licensed Skyscanner Flight Pricing API Key |
| `SKYSCANNER_LIVE_ENABLED` | Optional | No | Render Dashboard | Set `true` to enable live Skyscanner ingestion |
| `AVIATION_EDGE_API_KEY` | Optional | Yes | Render Dashboard | Licensed Aviation Edge Flight Timetable API Key |
| `AVIATION_EDGE_LIVE_ENABLED` | Optional | No | Render Dashboard | Set `true` to enable live Aviation Edge ingestion |

### Frontend (`Frontend/.env.example`)
| Variable | Required? | Secret? | Configured In | Description |
| --- | --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | No | Vercel Dashboard | Deployed Render Backend base URL |
| `VITE_API_REFRESH_MS` | Optional | No | Vercel Dashboard | Dashboard refresh interval in ms (default `60000`) |

---

## 5. Deployment Verification Checklist

1. **Backend Health Check**:
   * Open `https://<your-render-app>.onrender.com/health` in a browser.
   * Expect response: `{"status": "ok"}`.
2. **tRPC Public API Check**:
   * Open `https://<your-render-app>.onrender.com/api/trpc/aeroIndex.public.status`.
   * Expect 200 OK JSON response containing service metadata.
3. **Frontend Application Flow**:
   * Open `https://<your-vercel-app>.vercel.app`.
   * Verify that public route searching, index charts, and market snapshots load without CORS or 404 errors.
