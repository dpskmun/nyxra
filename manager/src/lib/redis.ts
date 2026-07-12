import Redis from "ioredis";
import { logger } from "../config/logger";

let redis: Redis | null = null;
let connecting: Promise<Redis> | null = null;

export async function getRedis(): Promise<Redis> {
  if (redis?.status === "ready") return redis;
  if (connecting) return connecting;
  redis?.disconnect();
  redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || "0", 10),
  });
  const client = redis;
  connecting = new Promise<Redis>((resolve, reject) => {
    client.once("ready", () => {
      connecting = null;
      logger.info("Redis is Ready");
      resolve(client);
    })
    client.once("connect", () => {
      logger.info("Redis connected successfully");
    })
    client.once("error", (err) => {
      connecting = null;
      redis = null;
      logger.error("Failed to connect to Redis");
      reject(err);
    });
  });
  return connecting;
}
