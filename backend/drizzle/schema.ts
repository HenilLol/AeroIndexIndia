import {
  boolean,
  date,
  datetime,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** OAuth users are synchronized by the managed authentication layer. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "data_analyst", "ingestion_worker", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const cities = mysqlTable("cities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  state: varchar("state", { length: 120 }).notNull(),
  country: varchar("country", { length: 80 }).notNull().default("India"),
  countryCode: varchar("countryCode", { length: 2 }).notNull().default("IN"),
  latitude: decimal("latitude", { precision: 10, scale: 7, mode: "number" }),
  longitude: decimal("longitude", { precision: 10, scale: 7, mode: "number" }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("cities_name_state_uq").on(table.name, table.state)]);

export const airports = mysqlTable("airports", {
  id: int("id").autoincrement().primaryKey(),
  iataCode: varchar("iataCode", { length: 3 }).notNull(),
  icaoCode: varchar("icaoCode", { length: 4 }),
  name: varchar("name", { length: 180 }).notNull(),
  cityId: int("cityId").notNull().references(() => cities.id, { onDelete: "restrict" }),
  state: varchar("state", { length: 120 }).notNull(),
  country: varchar("country", { length: 80 }).notNull().default("India"),
  latitude: decimal("latitude", { precision: 10, scale: 7, mode: "number" }),
  longitude: decimal("longitude", { precision: 10, scale: 7, mode: "number" }),
  timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Kolkata"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("airports_iata_uq").on(table.iataCode),
  index("airports_city_idx").on(table.cityId),
]);

export const carriers = mysqlTable("carriers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  iataCode: varchar("iataCode", { length: 2 }).notNull(),
  icaoCode: varchar("icaoCode", { length: 3 }),
  country: varchar("country", { length: 80 }).notNull().default("India"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("carriers_iata_uq").on(table.iataCode),
  uniqueIndex("carriers_name_uq").on(table.name),
]);

export const routes = mysqlTable("routes", {
  id: int("id").autoincrement().primaryKey(),
  originAirportId: int("originAirportId").notNull().references(() => airports.id, { onDelete: "restrict" }),
  destinationAirportId: int("destinationAirportId").notNull().references(() => airports.id, { onDelete: "restrict" }),
  distanceKm: decimal("distanceKm", { precision: 9, scale: 2, mode: "number" }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("routes_airport_pair_uq").on(table.originAirportId, table.destinationAirportId),
  index("routes_origin_destination_idx").on(table.originAirportId, table.destinationAirportId),
]);

export const flights = mysqlTable("flights", {
  id: int("id").autoincrement().primaryKey(),
  carrierId: int("carrierId").notNull().references(() => carriers.id, { onDelete: "restrict" }),
  routeId: int("routeId").notNull().references(() => routes.id, { onDelete: "restrict" }),
  flightNumber: varchar("flightNumber", { length: 12 }).notNull(),
  scheduledDepartureTime: varchar("scheduledDepartureTime", { length: 5 }),
  scheduledArrivalTime: varchar("scheduledArrivalTime", { length: 5 }),
  estimatedDurationMinutes: int("estimatedDurationMinutes"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("flights_carrier_number_route_uq").on(table.carrierId, table.flightNumber, table.routeId),
  index("flights_route_idx").on(table.routeId),
]);

export const dataSources = mysqlTable("dataSources", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull(),
  displayName: varchar("displayName", { length: 140 }).notNull(),
  kind: mysqlEnum("kind", ["airline", "ota", "api", "manual"]).notNull(),
  reliabilityScore: decimal("reliabilityScore", { precision: 5, scale: 2, mode: "number" }).notNull().default(70),
  isActive: boolean("isActive").notNull().default(true),
  lastIngestedAt: datetime("lastIngestedAt", { mode: "date" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("data_sources_slug_uq").on(table.slug)]);

export const fareObservations = mysqlTable("fareObservations", {
  id: int("id").autoincrement().primaryKey(),
  idempotencyKey: varchar("idempotencyKey", { length: 128 }).notNull(),
  observationFingerprint: varchar("observationFingerprint", { length: 128 }).notNull(),
  routeId: int("routeId").notNull().references(() => routes.id, { onDelete: "restrict" }),
  originCityId: int("originCityId").notNull().references(() => cities.id, { onDelete: "restrict" }),
  destinationCityId: int("destinationCityId").notNull().references(() => cities.id, { onDelete: "restrict" }),
  originAirportId: int("originAirportId").notNull().references(() => airports.id, { onDelete: "restrict" }),
  destinationAirportId: int("destinationAirportId").notNull().references(() => airports.id, { onDelete: "restrict" }),
  carrierId: int("carrierId").notNull().references(() => carriers.id, { onDelete: "restrict" }),
  flightId: int("flightId").references(() => flights.id, { onDelete: "set null" }),
  flightNumber: varchar("flightNumber", { length: 12 }),
  sourceId: int("sourceId").notNull().references(() => dataSources.id, { onDelete: "restrict" }),
  observationAt: datetime("observationAt", { mode: "date" }).notNull(),
  bookingDate: date("bookingDate", { mode: "date" }).notNull(),
  travelDate: date("travelDate", { mode: "date" }).notNull(),
  departureAt: datetime("departureAt", { mode: "date" }),
  arrivalAt: datetime("arrivalAt", { mode: "date" }),
  flightDurationMinutes: int("flightDurationMinutes"),
  passengerCount: int("passengerCount").notNull().default(1),
  cabinClass: mysqlEnum("cabinClass", ["economy", "premium_economy", "business", "first"]).notNull().default("economy"),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  baseFare: decimal("baseFare", { precision: 12, scale: 2, mode: "number" }).notNull(),
  taxes: decimal("taxes", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),
  fees: decimal("fees", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),
  totalFare: decimal("totalFare", { precision: 12, scale: 2, mode: "number" }).notNull(),
  normalizedFareInr: decimal("normalizedFareInr", { precision: 12, scale: 2, mode: "number" }).notNull(),
  bookingWindowDays: int("bookingWindowDays").notNull(),
  cpiCompatibilityScore: decimal("cpiCompatibilityScore", { precision: 5, scale: 2, mode: "number" }).notNull(),
  cpiScoreVersion: varchar("cpiScoreVersion", { length: 24 }).notNull().default("v1"),
  cpiScoreBreakdown: json("cpiScoreBreakdown").$type<Record<string, number>>().notNull(),
  validationStatus: mysqlEnum("validationStatus", ["valid", "flagged", "rejected"]).notNull().default("valid"),
  isDuplicate: boolean("isDuplicate").notNull().default(false),
  duplicateOfId: int("duplicateOfId"),
  isAnomaly: boolean("isAnomaly").notNull().default(false),
  anomalyScore: decimal("anomalyScore", { precision: 5, scale: 4, mode: "number" }).notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("fares_idempotency_key_uq").on(table.idempotencyKey),
  index("fares_fingerprint_idx").on(table.observationFingerprint),
  index("fares_observation_idx").on(table.observationAt),
  index("fares_travel_date_idx").on(table.travelDate),
  index("fares_booking_date_idx").on(table.bookingDate),
  index("fares_route_travel_idx").on(table.routeId, table.travelDate),
  index("fares_route_carrier_travel_idx").on(table.routeId, table.carrierId, table.travelDate),
  index("fares_carrier_observed_idx").on(table.carrierId, table.observationAt),
  index("fares_source_idx").on(table.sourceId),
  index("fares_validation_idx").on(table.validationStatus),
  index("fares_anomaly_idx").on(table.isAnomaly),
]);

export const indexSnapshots = mysqlTable("indexSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  calculationKey: varchar("calculationKey", { length: 160 }).notNull(),
  scope: mysqlEnum("scope", ["route", "national"]).notNull(),
  routeId: int("routeId").references(() => routes.id, { onDelete: "cascade" }),
  baselineDate: date("baselineDate", { mode: "date" }).notNull(),
  asOfDate: date("asOfDate", { mode: "date" }).notNull(),
  indexValue: decimal("indexValue", { precision: 12, scale: 4, mode: "number" }).notNull(),
  priorIndexValue: decimal("priorIndexValue", { precision: 12, scale: 4, mode: "number" }),
  percentChange: decimal("percentChange", { precision: 10, scale: 4, mode: "number" }),
  observationCount: int("observationCount").notNull(),
  confidenceScore: decimal("confidenceScore", { precision: 5, scale: 2, mode: "number" }).notNull(),
  calculationVersion: varchar("calculationVersion", { length: 24 }).notNull().default("jevons-v1"),
  methodology: varchar("methodology", { length: 48 }).notNull(),
  weights: json("weights").$type<Record<string, number>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("indices_calculation_key_uq").on(table.calculationKey),
  index("indices_scope_date_idx").on(table.scope, table.asOfDate),
  index("indices_route_date_idx").on(table.routeId, table.asOfDate),
]);

export const anomalyRecords = mysqlTable("anomalyRecords", {
  id: int("id").autoincrement().primaryKey(),
  fareObservationId: int("fareObservationId").notNull().references(() => fareObservations.id, { onDelete: "cascade" }),
  severity: mysqlEnum("severity", ["normal", "low", "medium", "high", "critical"]).notNull(),
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "confirmed", "false_positive", "resolved"]).notNull().default("pending"),
  anomalyScore: decimal("anomalyScore", { precision: 5, scale: 4, mode: "number" }).notNull(),
  ruleScore: decimal("ruleScore", { precision: 5, scale: 4, mode: "number" }).notNull(),
  statisticalScore: decimal("statisticalScore", { precision: 5, scale: 4, mode: "number" }).notNull(),
  baselineMedian: decimal("baselineMedian", { precision: 12, scale: 2, mode: "number" }),
  percentDifference: decimal("percentDifference", { precision: 10, scale: 2, mode: "number" }),
  detectionMethods: json("detectionMethods").$type<string[]>().notNull(),
  explanation: text("explanation").notNull(),
  reviewedByUserId: int("reviewedByUserId").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: datetime("reviewedAt", { mode: "date" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("anomalies_fare_observation_uq").on(table.fareObservationId),
  index("anomalies_status_severity_idx").on(table.reviewStatus, table.severity),
]);

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: varchar("entityId", { length: 80 }),
  requestId: varchar("requestId", { length: 80 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("audit_actor_created_idx").on(table.actorUserId, table.createdAt),
  index("audit_entity_idx").on(table.entityType, table.entityId),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type FareObservation = typeof fareObservations.$inferSelect;
export type DataSource = typeof dataSources.$inferSelect;
