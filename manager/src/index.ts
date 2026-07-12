import { app } from "./app";
import { env } from "./config/env.config";
import { logger } from "./config/logger";
import { getpubSub } from "./lib/pubSub.redis";
import { getRedis } from "./lib/redis";
import { getWorker } from "./lib/worker.redis";

const port = Number(env.PORT);

const server = app.listen(port, () => {
    logger.info(`Server is running on http://localhost:3000`);
});

const gracefulShutdown = (async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);

    await server.stop();

    const redis = await getRedis()
    redis.disconnect();
    logger.info("Redis disconnected")

    const pubSubRedis = await getpubSub()
    pubSubRedis.disconnect();
    logger.info("PubSub Redis disconnected")

    const worker = await getWorker()
    worker.disconnect();
    logger.info("Worker Redis disconnected")

    process.exit(0);

})

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
    logger.error(err);
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    logger.error(reason);
    process.exit(1);
});