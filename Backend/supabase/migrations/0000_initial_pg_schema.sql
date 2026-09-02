-- AeroIndex India PostgreSQL Database Migration Schema for Supabase

CREATE TYPE "role" AS ENUM ('user', 'data_analyst', 'ingestion_worker', 'admin');
CREATE TYPE "data_source_kind" AS ENUM ('airline', 'ota', 'api', 'manual');
CREATE TYPE "cabin_class" AS ENUM ('economy', 'premium_economy', 'business', 'first');
CREATE TYPE "validation_status" AS ENUM ('valid', 'flagged', 'rejected');
CREATE TYPE "index_scope" AS ENUM ('route', 'national');
CREATE TYPE "anomaly_severity" AS ENUM ('normal', 'low', 'medium', 'high', 'critical');
CREATE TYPE "review_status" AS ENUM ('pending', 'confirmed', 'false_positive', 'resolved');

CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  "name" TEXT,
  "email" VARCHAR(320),
  "loginMethod" VARCHAR(64),
  "role" "role" NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "cities" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(120) NOT NULL,
  "state" VARCHAR(120) NOT NULL,
  "country" VARCHAR(80) NOT NULL DEFAULT 'India',
  "countryCode" VARCHAR(2) NOT NULL DEFAULT 'IN',
  "latitude" NUMERIC(10, 7),
  "longitude" NUMERIC(10, 7),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "cities_name_state_uq" UNIQUE ("name", "state")
);

CREATE TABLE IF NOT EXISTS "airports" (
  "id" SERIAL PRIMARY KEY,
  "iataCode" VARCHAR(3) NOT NULL UNIQUE,
  "icaoCode" VARCHAR(4),
  "name" VARCHAR(180) NOT NULL,
  "cityId" INTEGER NOT NULL REFERENCES "cities"("id") ON DELETE RESTRICT,
  "state" VARCHAR(120) NOT NULL,
  "country" VARCHAR(80) NOT NULL DEFAULT 'India',
  "latitude" NUMERIC(10, 7),
  "longitude" NUMERIC(10, 7),
  "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "airports_city_idx" ON "airports" ("cityId");

CREATE TABLE IF NOT EXISTS "carriers" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(120) NOT NULL UNIQUE,
  "iataCode" VARCHAR(2) NOT NULL UNIQUE,
  "icaoCode" VARCHAR(3),
  "country" VARCHAR(80) NOT NULL DEFAULT 'India',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "routes" (
  "id" SERIAL PRIMARY KEY,
  "originAirportId" INTEGER NOT NULL REFERENCES "airports"("id") ON DELETE RESTRICT,
  "destinationAirportId" INTEGER NOT NULL REFERENCES "airports"("id") ON DELETE RESTRICT,
  "distanceKm" NUMERIC(9, 2),
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "routes_airport_pair_uq" UNIQUE ("originAirportId", "destinationAirportId")
);

CREATE INDEX IF NOT EXISTS "routes_origin_destination_idx" ON "routes" ("originAirportId", "destinationAirportId");

CREATE TABLE IF NOT EXISTS "flights" (
  "id" SERIAL PRIMARY KEY,
  "carrierId" INTEGER NOT NULL REFERENCES "carriers"("id") ON DELETE RESTRICT,
  "routeId" INTEGER NOT NULL REFERENCES "routes"("id") ON DELETE RESTRICT,
  "flightNumber" VARCHAR(12) NOT NULL,
  "scheduledDepartureTime" VARCHAR(5),
  "scheduledArrivalTime" VARCHAR(5),
  "estimatedDurationMinutes" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "flights_carrier_number_route_uq" UNIQUE ("carrierId", "flightNumber", "routeId")
);

CREATE INDEX IF NOT EXISTS "flights_route_idx" ON "flights" ("routeId");

CREATE TABLE IF NOT EXISTS "dataSources" (
  "id" SERIAL PRIMARY KEY,
  "slug" VARCHAR(80) NOT NULL UNIQUE,
  "displayName" VARCHAR(140) NOT NULL,
  "kind" "data_source_kind" NOT NULL,
  "reliabilityScore" NUMERIC(5, 2) NOT NULL DEFAULT 70,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "lastIngestedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "fareObservations" (
  "id" SERIAL PRIMARY KEY,
  "idempotencyKey" VARCHAR(128) NOT NULL UNIQUE,
  "observationFingerprint" VARCHAR(128) NOT NULL,
  "routeId" INTEGER NOT NULL REFERENCES "routes"("id") ON DELETE RESTRICT,
  "originCityId" INTEGER NOT NULL REFERENCES "cities"("id") ON DELETE RESTRICT,
  "destinationCityId" INTEGER NOT NULL REFERENCES "cities"("id") ON DELETE RESTRICT,
  "originAirportId" INTEGER NOT NULL REFERENCES "airports"("id") ON DELETE RESTRICT,
  "destinationAirportId" INTEGER NOT NULL REFERENCES "airports"("id") ON DELETE RESTRICT,
  "carrierId" INTEGER NOT NULL REFERENCES "carriers"("id") ON DELETE RESTRICT,
  "flightId" INTEGER REFERENCES "flights"("id") ON DELETE SET NULL,
  "flightNumber" VARCHAR(12),
  "sourceId" INTEGER NOT NULL REFERENCES "dataSources"("id") ON DELETE RESTRICT,
  "observationAt" TIMESTAMP NOT NULL,
  "bookingDate" DATE NOT NULL,
  "travelDate" DATE NOT NULL,
  "departureAt" TIMESTAMP,
  "arrivalAt" TIMESTAMP,
  "flightDurationMinutes" INTEGER,
  "passengerCount" INTEGER NOT NULL DEFAULT 1,
  "cabinClass" "cabin_class" NOT NULL DEFAULT 'economy',
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "baseFare" NUMERIC(12, 2) NOT NULL,
  "taxes" NUMERIC(12, 2) NOT NULL DEFAULT 0,
  "fees" NUMERIC(12, 2) NOT NULL DEFAULT 0,
  "totalFare" NUMERIC(12, 2) NOT NULL,
  "normalizedFareInr" NUMERIC(12, 2) NOT NULL,
  "bookingWindowDays" INTEGER NOT NULL,
  "cpiCompatibilityScore" NUMERIC(5, 2) NOT NULL,
  "cpiScoreVersion" VARCHAR(24) NOT NULL DEFAULT 'v1',
  "cpiScoreBreakdown" JSONB NOT NULL,
  "validationStatus" "validation_status" NOT NULL DEFAULT 'valid',
  "isDuplicate" BOOLEAN NOT NULL DEFAULT FALSE,
  "duplicateOfId" INTEGER,
  "isAnomaly" BOOLEAN NOT NULL DEFAULT FALSE,
  "anomalyScore" NUMERIC(5, 4) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "fares_fingerprint_idx" ON "fareObservations" ("observationFingerprint");
CREATE INDEX IF NOT EXISTS "fares_observation_idx" ON "fareObservations" ("observationAt");
CREATE INDEX IF NOT EXISTS "fares_travel_date_idx" ON "fareObservations" ("travelDate");
CREATE INDEX IF NOT EXISTS "fares_booking_date_idx" ON "fareObservations" ("bookingDate");
CREATE INDEX IF NOT EXISTS "fares_route_travel_idx" ON "fareObservations" ("routeId", "travelDate");
CREATE INDEX IF NOT EXISTS "fares_route_carrier_travel_idx" ON "fareObservations" ("routeId", "carrierId", "travelDate");
CREATE INDEX IF NOT EXISTS "fares_carrier_observed_idx" ON "fareObservations" ("carrierId", "observationAt");
CREATE INDEX IF NOT EXISTS "fares_source_idx" ON "fareObservations" ("sourceId");
CREATE INDEX IF NOT EXISTS "fares_validation_idx" ON "fareObservations" ("validationStatus");
CREATE INDEX IF NOT EXISTS "fares_anomaly_idx" ON "fareObservations" ("isAnomaly");

CREATE TABLE IF NOT EXISTS "indexSnapshots" (
  "id" SERIAL PRIMARY KEY,
  "calculationKey" VARCHAR(160) NOT NULL UNIQUE,
  "scope" "index_scope" NOT NULL,
  "routeId" INTEGER REFERENCES "routes"("id") ON DELETE CASCADE,
  "baselineDate" DATE NOT NULL,
  "asOfDate" DATE NOT NULL,
  "indexValue" NUMERIC(12, 4) NOT NULL,
  "priorIndexValue" NUMERIC(12, 4),
  "percentChange" NUMERIC(10, 4),
  "observationCount" INTEGER NOT NULL,
  "confidenceScore" NUMERIC(5, 2) NOT NULL,
  "calculationVersion" VARCHAR(24) NOT NULL DEFAULT 'jevons-v1',
  "methodology" VARCHAR(48) NOT NULL,
  "weights" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "indices_scope_date_idx" ON "indexSnapshots" ("scope", "asOfDate");
CREATE INDEX IF NOT EXISTS "indices_route_date_idx" ON "indexSnapshots" ("routeId", "asOfDate");

CREATE TABLE IF NOT EXISTS "anomalyRecords" (
  "id" SERIAL PRIMARY KEY,
  "fareObservationId" INTEGER NOT NULL UNIQUE REFERENCES "fareObservations"("id") ON DELETE CASCADE,
  "severity" "anomaly_severity" NOT NULL,
  "reviewStatus" "review_status" NOT NULL DEFAULT 'pending',
  "anomalyScore" NUMERIC(5, 4) NOT NULL,
  "ruleScore" NUMERIC(5, 4) NOT NULL,
  "statisticalScore" NUMERIC(5, 4) NOT NULL,
  "baselineMedian" NUMERIC(12, 2),
  "percentDifference" NUMERIC(10, 2),
  "detectionMethods" JSONB NOT NULL,
  "explanation" TEXT NOT NULL,
  "reviewedByUserId" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "anomalies_status_severity_idx" ON "anomalyRecords" ("reviewStatus", "severity");

CREATE TABLE IF NOT EXISTS "auditLogs" (
  "id" SERIAL PRIMARY KEY,
  "actorUserId" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "action" VARCHAR(100) NOT NULL,
  "entityType" VARCHAR(80) NOT NULL,
  "entityId" VARCHAR(80),
  "requestId" VARCHAR(80),
  "metadata" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "audit_actor_created_idx" ON "auditLogs" ("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_entity_idx" ON "auditLogs" ("entityType", "entityId");
