import { beforeAll, describe, expect, it } from "vitest";
import { normalizedFareObservationInput } from "./contracts";
import { listFareHistory, listRoutes, importNormalizedFareObservation } from "./services";
import { seedDevelopmentData } from "./seed";

const systemActor = { id: 0, openId: "test-system", name: "Test system", email: null, loginMethod: "system", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe.skipIf(!process.env.DATABASE_URL)("AeroIndex database integration", () => {
  beforeAll(async () => {
    await seedDevelopmentData();
  }, 60_000);

  it("returns searchable public route data from the migrated schema", async () => {
    const result = await listRoutes({ query: "AMD", limit: 10 });
    expect(result.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ origin: expect.objectContaining({ iataCode: "AMD" }), destination: expect.objectContaining({ iataCode: "BOM" }) }),
    ]));
  });

  it("uses stable cursors for route and fare history pagination", async () => {
    const firstRoutePage = await listRoutes({ limit: 1 });
    expect(firstRoutePage.items).toHaveLength(1);
    expect(firstRoutePage.nextCursor).toBeTypeOf("number");
    const secondRoutePage = await listRoutes({ limit: 1, cursor: firstRoutePage.nextCursor! });
    expect(secondRoutePage.items).toHaveLength(1);
    expect(secondRoutePage.items[0]!.id).toBeLessThan(firstRoutePage.items[0]!.id);

    const firstFarePage = await listFareHistory({ limit: 1 });
    expect(firstFarePage.items).toHaveLength(1);
    expect(firstFarePage.nextCursor).toBeTypeOf("number");
    const secondFarePage = await listFareHistory({ limit: 1, cursor: firstFarePage.nextCursor! });
    expect(secondFarePage.items).toHaveLength(1);
    expect(secondFarePage.items[0]!.id).toBeLessThan(firstFarePage.items[0]!.id);
  });

  it("imports a normalized observation exactly once for an idempotency key", async () => {
    const input = normalizedFareObservationInput.parse({
      idempotencyKey: "test-idempotency-amd-bom-001",
      sourceId: 1,
      routeId: 1,
      carrierId: 1,
      flightNumber: "6E990",
      observationAt: new Date("2026-08-29T09:00:00.000Z"),
      bookingDate: new Date("2026-08-29T00:00:00.000Z"),
      travelDate: new Date("2026-09-20T00:00:00.000Z"),
      passengerCount: 1,
      cabinClass: "economy",
      currency: "INR",
      baseFare: 5100,
      taxes: 700,
      fees: 200,
      totalFare: 6000,
      normalizedFareInr: 6000,
    });
    const first = await importNormalizedFareObservation(input, systemActor);
    const retry = await importNormalizedFareObservation(input, systemActor);
    expect(first.created || first.idempotent).toBe(true);
    expect(retry).toMatchObject({ created: false, idempotent: true });
    const history = await listFareHistory({ routeId: 1, limit: 100 });
    expect(history.items.filter(fare => fare.id === first.observation.id)).toHaveLength(1);
  });

  it("rejects chronologically invalid normalized observations at the input boundary", () => {
    expect(() => normalizedFareObservationInput.parse({
      sourceId: 1,
      routeId: 1,
      carrierId: 1,
      observationAt: new Date("2026-08-29T09:00:00.000Z"),
      bookingDate: new Date("2026-09-20T00:00:00.000Z"),
      travelDate: new Date("2026-09-19T00:00:00.000Z"),
      baseFare: 5000,
      totalFare: 5000,
      normalizedFareInr: 5000,
    })).toThrow(/travelDate/);
  });
});
