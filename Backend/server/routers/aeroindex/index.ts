import { router } from "../../_core/trpc";
import { aeroIndexAdminRouter } from "./admin";
import { aeroIndexPublicRouter } from "./public";

export const aeroIndexRouter = router({
  public: aeroIndexPublicRouter,
  admin: aeroIndexAdminRouter,
});
