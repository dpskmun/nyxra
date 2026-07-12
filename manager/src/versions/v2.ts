import { Elysia } from "elysia";
import { authRouter } from "../modules/auth/auth.route";

export const v2Route = new Elysia()
.use(authRouter)