import { Elysia } from "elysia";
import { mailRouter } from "../modules/mailer/mailer.route";
import { configurationRouter } from "../modules/mail/mail.routel";

export const versionRouteController = new Elysia()
.use(mailRouter)
.use(configurationRouter)