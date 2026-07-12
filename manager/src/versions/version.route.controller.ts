import { Elysia } from "elysia";
import { authRouter } from "../modules/auth/auth.route";

export const versionRouteController = new Elysia()
.use(authRouter)