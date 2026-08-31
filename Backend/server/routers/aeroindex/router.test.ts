import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../routers";
import type { TrpcContext } from "../../_core/context";

const baseRequest = { protocol: "https", headers: {} } as TrpcContext["req"];
const baseResponse = {} as TrpcContext["res"];

describe("AeroIndex API access controls", () => {
  it("keeps market status publicly readable", async () => {
    const caller = appRouter.createCaller({ user: null, req: baseRequest, res: baseResponse });
    await expect(caller.aeroIndex.public.status()).resolves.toMatchObject({ publicReads: true, operationsRequireAdmin: true });
  });

  it("rejects anonymous ingestion before any operational work occurs", async () => {
    const caller = appRouter.createCaller({ user: null, req: baseRequest, res: baseResponse });
    await expect(caller.aeroIndex.admin.development.seed()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });

  it("rejects a non-admin OAuth user from operational controls", async () => {
    const caller = appRouter.createCaller({
      user: { id: 2, openId: "viewer", name: "Viewer", email: null, loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: baseRequest,
      res: baseResponse,
    });
    await expect(caller.aeroIndex.admin.development.seed()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});
