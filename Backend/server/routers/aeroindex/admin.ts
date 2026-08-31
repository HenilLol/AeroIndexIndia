import { z } from "zod";
import { adminProcedure, router } from "../../_core/trpc";
import { anomalyReviewInput, aviationEdgeRoutesInput, aviationEdgeTimetableInput, indexRecomputeInput, normalizedFareObservationInput, skyscannerLiveSearchInput, sourceUpsertInput } from "../../aeroindex/contracts";
import { getActiveSources } from "../../aeroindex/repository";
import { importNormalizedFareObservation, recomputeNationalIndex, recomputeRouteIndex, reviewAnomaly, upsertSource } from "../../aeroindex/services";
import { seedDevelopmentData } from "../../aeroindex/seed";
import { getSkyscannerAdapterStatus, runSkyscannerSearch, validateSkyscannerCredential } from "../../aeroindex/skyscanner";
import { getAviationEdgeAdapterStatus, previewAviationEdgeRoutes, previewAviationEdgeTimetable, validateAviationEdgeCredential } from "../../aeroindex/aviation-edge";

export const aeroIndexAdminRouter = router({
  sources: router({
    list: adminProcedure.query(() => getActiveSources()),
    upsert: adminProcedure.input(sourceUpsertInput).mutation(({ input, ctx }) => upsertSource(input, ctx.user)),
  }),
  ingestion: router({
    importOne: adminProcedure.input(normalizedFareObservationInput).mutation(({ input, ctx }) => importNormalizedFareObservation(input, ctx.user)),
    importBatch: adminProcedure.input(z.object({ observations: z.array(normalizedFareObservationInput).min(1).max(500) })).mutation(async ({ input, ctx }) => {
      const results = [];
      for (const observation of input.observations) results.push(await importNormalizedFareObservation(observation, ctx.user));
      return { accepted: results.length, created: results.filter(result => result.created).length, idempotent: results.filter(result => result.idempotent).length, results };
    }),
  }),
  indices: router({
    recomputeRoute: adminProcedure.input(indexRecomputeInput).mutation(({ input, ctx }) => recomputeRouteIndex(input, ctx.user)),
    recomputeNational: adminProcedure.input(z.object({ baselineDate: z.coerce.date(), asOfDate: z.coerce.date() })).mutation(({ input, ctx }) => recomputeNationalIndex(input.asOfDate, input.baselineDate, ctx.user)),
  }),
  anomalies: router({
    review: adminProcedure.input(anomalyReviewInput).mutation(({ input, ctx }) => reviewAnomaly(input, ctx.user)),
  }),
  providers: router({
    skyscannerStatus: adminProcedure.query(() => getSkyscannerAdapterStatus()),
    validateSkyscannerCredential: adminProcedure.mutation(() => validateSkyscannerCredential()),
    skyscannerSearch: adminProcedure.input(skyscannerLiveSearchInput).mutation(({ input, ctx }) => runSkyscannerSearch(input, ctx.user)),
    aviationEdgeStatus: adminProcedure.query(() => getAviationEdgeAdapterStatus()),
    validateAviationEdgeCredential: adminProcedure.mutation(() => validateAviationEdgeCredential()),
    aviationEdgeTimetable: adminProcedure.input(aviationEdgeTimetableInput).mutation(({ input }) => previewAviationEdgeTimetable(input)),
    aviationEdgeRoutes: adminProcedure.input(aviationEdgeRoutesInput).mutation(({ input }) => previewAviationEdgeRoutes(input)),
  }),
  development: router({
    seed: adminProcedure.mutation(() => seedDevelopmentData()),
  }),
});
