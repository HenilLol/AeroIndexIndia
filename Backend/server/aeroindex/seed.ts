import { eq, inArray } from "drizzle-orm";
import { airports, carriers, cities, dataSources, routes } from "../../drizzle/schema";
import { requireDb } from "./repository";
import { importNormalizedFareObservation, recomputeNationalIndex, recomputeRouteIndex } from "./services";

const seedActor = { id: 0, openId: "seed-system", name: "AeroIndex seed", email: null, loginMethod: "system", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const citySeed = [
  { name: "Ahmedabad", state: "Gujarat", latitude: 23.0732, longitude: 72.6347 },
  { name: "Mumbai", state: "Maharashtra", latitude: 19.0896, longitude: 72.8656 },
  { name: "Delhi", state: "Delhi", latitude: 28.5562, longitude: 77.1 },
  { name: "Bengaluru", state: "Karnataka", latitude: 13.1986, longitude: 77.7066 },
];
const airportSeed = [
  { iataCode: "AMD", name: "Sardar Vallabhbhai Patel International Airport", city: "Ahmedabad", state: "Gujarat", latitude: 23.0732, longitude: 72.6347 },
  { iataCode: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", state: "Maharashtra", latitude: 19.0896, longitude: 72.8656 },
  { iataCode: "DEL", name: "Indira Gandhi International Airport", city: "Delhi", state: "Delhi", latitude: 28.5562, longitude: 77.1 },
  { iataCode: "BLR", name: "Kempegowda International Airport", city: "Bengaluru", state: "Karnataka", latitude: 13.1986, longitude: 77.7066 },
];
const carrierSeed = [
  { name: "IndiGo", iataCode: "6E", icaoCode: "IGO" },
  { name: "Air India", iataCode: "AI", icaoCode: "AIC" },
  { name: "Akasa Air", iataCode: "QP", icaoCode: "AKJ" },
];

export async function seedDevelopmentData() {
  const db = await requireDb();
  for (const city of citySeed) {
    await db.insert(cities).values({
      name: city.name,
      state: city.state,
      latitude: city.latitude,
      longitude: city.longitude
    }).onConflictDoUpdate({
      target: [cities.name, cities.state],
      set: { latitude: city.latitude, longitude: city.longitude }
    });
  }

  const cityRows = await db.select().from(cities).where(inArray(cities.name, citySeed.map(city => city.name)));
  const cityMap = new Map(cityRows.map(city => [city.name, city]));
  for (const airport of airportSeed) {
    const city = cityMap.get(airport.city)!;
    await db.insert(airports).values({
      iataCode: airport.iataCode,
      name: airport.name,
      cityId: city.id,
      state: airport.state,
      latitude: airport.latitude,
      longitude: airport.longitude
    }).onConflictDoUpdate({
      target: airports.iataCode,
      set: { name: airport.name, cityId: city.id, state: airport.state, latitude: airport.latitude, longitude: airport.longitude }
    });
  }

  for (const carrier of carrierSeed) {
    await db.insert(carriers).values({
      name: carrier.name,
      iataCode: carrier.iataCode,
      icaoCode: carrier.icaoCode
    }).onConflictDoUpdate({
      target: carriers.iataCode,
      set: { name: carrier.name, icaoCode: carrier.icaoCode }
    });
  }

  await db.insert(dataSources).values({
    slug: "aeroindex-verified-import",
    displayName: "AeroIndex Verified Import",
    kind: "manual",
    reliabilityScore: 92,
    isActive: true
  }).onConflictDoUpdate({
    target: dataSources.slug,
    set: { displayName: "AeroIndex Verified Import", reliabilityScore: 92, isActive: true }
  });

  const airportRows = await db.select().from(airports).where(inArray(airports.iataCode, airportSeed.map(airport => airport.iataCode)));
  const airportMap = new Map(airportRows.map(airport => [airport.iataCode, airport]));
  const routeSeed = [["AMD", "BOM", 441], ["DEL", "BLR", 1740], ["BOM", "DEL", 1148]] as const;
  for (const [origin, destination, distanceKm] of routeSeed) {
    await db.insert(routes).values({
      originAirportId: airportMap.get(origin)!.id,
      destinationAirportId: airportMap.get(destination)!.id,
      distanceKm
    }).onConflictDoUpdate({
      target: [routes.originAirportId, routes.destinationAirportId],
      set: { distanceKm, isActive: true }
    });
  }

  const routeRows = await db.select().from(routes);
  const routeMap = new Map(routeRows.map(route => [`${airportRows.find(airport => airport.id === route.originAirportId)?.iataCode}-${airportRows.find(airport => airport.id === route.destinationAirportId)?.iataCode}`, route]));
  const carrierRows = await db.select().from(carriers).where(inArray(carriers.iataCode, carrierSeed.map(carrier => carrier.iataCode)));
  const carrierMap = new Map(carrierRows.map(carrier => [carrier.iataCode, carrier]));
  const source = (await db.select().from(dataSources).where(eq(dataSources.slug, "aeroindex-verified-import")).limit(1))[0]!;
  const fareSeed = [
    { key: "amd-bom-1", route: "AMD-BOM", carrier: "6E", date: "2026-09-15", observed: "2026-08-27T09:00:00.000Z", total: 5850 },
    { key: "amd-bom-2", route: "AMD-BOM", carrier: "6E", date: "2026-09-15", observed: "2026-08-28T09:00:00.000Z", total: 6100 },
    { key: "amd-bom-3", route: "AMD-BOM", carrier: "AI", date: "2026-09-15", observed: "2026-08-27T11:00:00.000Z", total: 6350 },
    { key: "amd-bom-4", route: "AMD-BOM", carrier: "AI", date: "2026-09-16", observed: "2026-08-28T11:00:00.000Z", total: 6500 },
    { key: "del-blr-1", route: "DEL-BLR", carrier: "6E", date: "2026-09-15", observed: "2026-08-27T08:00:00.000Z", total: 7200 },
    { key: "del-blr-2", route: "DEL-BLR", carrier: "AI", date: "2026-09-15", observed: "2026-08-27T10:00:00.000Z", total: 7800 },
  ];
  for (const fare of fareSeed) {
    const total = fare.total;
    await importNormalizedFareObservation({ idempotencyKey: `seed-${fare.key}`, sourceId: source.id, routeId: routeMap.get(fare.route)!.id, carrierId: carrierMap.get(fare.carrier)!.id, flightNumber: `${fare.carrier}${100 + fare.total % 700}`, observationAt: new Date(fare.observed), bookingDate: new Date("2026-08-27T00:00:00.000Z"), travelDate: new Date(`${fare.date}T00:00:00.000Z`), passengerCount: 1, cabinClass: "economy", currency: "INR", baseFare: total - 900, taxes: 700, fees: 200, totalFare: total, normalizedFareInr: total }, seedActor);
  }
  const amdBom = routeMap.get("AMD-BOM")!;
  const baselineDate = new Date("2026-09-15T00:00:00.000Z");
  const asOfDate = new Date("2026-09-16T00:00:00.000Z");
  await recomputeRouteIndex({ routeId: amdBom.id, baselineDate, asOfDate }, seedActor);
  await recomputeNationalIndex(asOfDate, baselineDate, seedActor);
  return { cities: citySeed.length, airports: airportSeed.length, carriers: carrierSeed.length, routes: routeSeed.length, observations: fareSeed.length };
}
