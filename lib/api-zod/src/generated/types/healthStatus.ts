import * as zod from "zod";
export const HealthStatus = zod.object({ status: zod.string() });
