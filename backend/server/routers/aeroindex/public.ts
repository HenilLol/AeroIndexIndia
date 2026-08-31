import { z } from "zod";
import { publicProcedure, router } from "../../_core/trpc";
import { fareHistoryInput, indexHistoryInput, paginationInput, routeSearchInput } from "../../aeroindex/contracts";
import { getAlertData, getCarrierComparison, getDashboardOverview, getIndexHistory, getMarketStatus, getRouteAnalytics, getRouteDetail, listFareHistory, listRoutes } from "../../aeroindex/services";

export const aeroIndexPublicRouter = router({
  status: publicProcedure.query(() => getMarketStatus()),
  dashboard: publicProcedure.query(() => getDashboardOverview()),
  routes: router({
    search: publicProcedure.input(routeSearchInput).query(({ input }) => listRoutes(input)),
    detail: publicProcedure.input(z.object({ routeId: z.number().int().positive() })).query(({ input }) => getRouteDetail(input.routeId)),
    analytics: publicProcedure.input(z.object({ routeId: z.number().int().positive() })).query(({ input }) => getRouteAnalytics(input.routeId)),
    indexHistory: publicProcedure.input(indexHistoryInput).query(({ input }) => getIndexHistory(input.routeId, input.limit)),
  }),
  fares: router({
    history: publicProcedure.input(fareHistoryInput).query(({ input }) => listFareHistory(input)),
  }),
  carriers: router({
    compare: publicProcedure.input(z.object({ routeId: z.number().int().positive().optional() })).query(({ input }) => getCarrierComparison(input.routeId)),
  }),
  alerts: router({
    list: publicProcedure.input(paginationInput).query(({ input }) => getAlertData(input.limit)),
  }),
});
