import { Elysia } from "elysia";
import { logger } from "../config/logger"

export const requestLogger = (app: Elysia) => app
.state("start", 0n)
.onRequest(({ store }) => {
    store.start = process.hrtime.bigint()
})
.onAfterResponse(({ request, set, store }) => {
    const duration = Number(process.hrtime.bigint() - store.start) / 1_000_000;
    
    logger.info({
        event: "HTTP_REQUEST",
        method: request.method,
        path: new URL(request.url).pathname,
        statusCode: set.status,
        ip: 
            request.headers.get("cf-connecting-ip") ?? 
            request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? 
            request.headers.get("x-real-ip") ?? 
            request.headers.get("x-client-ip") ?? 
            request.headers.get("fastly-client-ip") ?? 
            request.headers.get("true-client-ip") ?? 
            request.headers.get("x-cluster-client-ip") ?? 
            "unknown",
        protocol: request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", ""),
        durationMs: Number(duration.toFixed(2))
    })
})