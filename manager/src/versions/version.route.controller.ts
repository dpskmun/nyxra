import { Elysia } from "elysia";
import { mailRouter } from "../modules/mailer/mailer.route";

export const versionRouteController = new Elysia()
.use(mailRouter)