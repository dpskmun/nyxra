import { Elysia } from "elysia";
import { authRouter } from "../modules/auth/auth.route";

export const v0Route = new Elysia()
.use(authRouter)