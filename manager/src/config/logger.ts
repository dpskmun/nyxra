import { pino } from "pino";
import { env } from "./env.config"

export const logger = pino({
    transport: env?.NODE_ENV === "development" ? {
        target: "pino-pretty",
    } : undefined,
})