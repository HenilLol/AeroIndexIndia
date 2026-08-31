import { z } from "zod";

const dateInput = z.coerce.date();

export const paginationInput = z.object({
  limit: z.number().int().min(1).max(100).default(25),
  cursor: z.number().int().positive().optional(),
});

export const routeSearchInput = paginationInput.extend({
  query: z.string().trim().min(1).max(80).optional(),
  originIata: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).optional(),
  destinationIata: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).optional(),
});

export const fareHistoryInput = paginationInput.extend({
  routeId: z.number().int().positive().optional(),
  carrierId: z.number().int().positive().optional(),
  travelDate: dateInput.optional(),
  minimumFare: z.number().positive().max(1_000_000).optional(),
  maximumFare: z.number().positive().max(1_000_000).optional(),
  anomaliesOnly: z.boolean().optional(),
});

export const indexHistoryInput = z.object({
  routeId: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(365).default(90),
});

export const normalizedFareObservationInput = z.object({
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
  sourceId: z.number().int().positive(),
  routeId: z.number().int().positive(),
  carrierId: z.number().int().positive(),
  flightId: z.number().int().positive().optional(),
  flightNumber: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,12}$/).optional(),
  observationAt: dateInput,
  bookingDate: dateInput,
  travelDate: dateInput,
  departureAt: dateInput.optional(),
  arrivalAt: dateInput.optional(),
  flightDurationMinutes: z.number().int().min(15).max(1_440).optional(),
  passengerCount: z.number().int().min(1).max(9).default(1),
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).default("INR"),
  baseFare: z.number().positive().max(1_000_000),
  taxes: z.number().min(0).max(1_000_000).default(0),
  fees: z.number().min(0).max(1_000_000).default(0),
  totalFare: z.number().positive().max(1_000_000),
  normalizedFareInr: z.number().positive().max(1_000_000),
}).superRefine((value, ctx) => {
  if (value.travelDate < value.bookingDate) {
    ctx.addIssue({ code: "custom", message: "travelDate must be on or after bookingDate", path: ["travelDate"] });
  }
  if (value.totalFare + 0.01 < value.baseFare + value.taxes + value.fees) {
    ctx.addIssue({ code: "custom", message: "totalFare cannot be less than baseFare + taxes + fees", path: ["totalFare"] });
  }
  if (value.arrivalAt && value.departureAt && value.arrivalAt <= value.departureAt) {
    ctx.addIssue({ code: "custom", message: "arrivalAt must be later than departureAt", path: ["arrivalAt"] });
  }
});

export const sourceUpsertInput = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,80}$/),
  displayName: z.string().trim().min(3).max(140),
  kind: z.enum(["airline", "ota", "api", "manual"]),
  reliabilityScore: z.number().min(0).max(100).default(70),
  isActive: z.boolean().default(true),
});

export const indexRecomputeInput = z.object({
  routeId: z.number().int().positive(),
  baselineDate: dateInput,
  asOfDate: dateInput,
}).refine(value => value.asOfDate >= value.baselineDate, {
  message: "asOfDate must be on or after baselineDate",
  path: ["asOfDate"],
});

export const anomalyReviewInput = z.object({
  anomalyId: z.number().int().positive(),
  reviewStatus: z.enum(["pending", "confirmed", "false_positive", "resolved"]),
});

export const skyscannerLiveSearchInput = z.object({
  sourceId: z.number().int().positive(),
  routeId: z.number().int().positive(),
  carrierId: z.number().int().positive(),
  bookingDate: dateInput,
  travelDate: dateInput,
  adults: z.number().int().min(1).max(8).default(1),
  mode: z.enum(["preview", "ingest"]).default("preview"),
}).refine(value => value.travelDate >= value.bookingDate, {
  message: "travelDate must be on or after bookingDate",
  path: ["travelDate"],
});

const iataCodeInput = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/);
const airlineIataInput = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,3}$/);

export const aviationEdgeTimetableInput = z.object({
  airportIata: iataCodeInput,
  direction: z.enum(["arrival", "departure"]),
  airlineIata: airlineIataInput.optional(),
  status: z.enum(["active", "scheduled", "landed", "cancelled", "incident", "diverted", "redirected"]).optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export const aviationEdgeRoutesInput = z.object({
  airlineIata: airlineIataInput.optional(),
  departureIata: iataCodeInput.optional(),
  arrivalIata: iataCodeInput.optional(),
  flightNumber: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{1,12}$/).optional(),
  limit: z.number().int().min(1).max(100).default(25),
}).refine(value => value.airlineIata || value.departureIata || value.arrivalIata || value.flightNumber, {
  message: "At least one route filter is required.",
});

export type NormalizedFareObservationInput = z.infer<typeof normalizedFareObservationInput>;
export type SkyscannerLiveSearchInput = z.infer<typeof skyscannerLiveSearchInput>;
export type AviationEdgeTimetableInput = z.infer<typeof aviationEdgeTimetableInput>;
export type AviationEdgeRoutesInput = z.infer<typeof aviationEdgeRoutesInput>;
