import Redis from "ioredis";
import { logger } from "../config/logger";

let pubSub: Redis | null = null;
let connecting: Promise<Redis> | null = null;

export async function getpubSub(): Promise<Redis> {
  if (pubSub?.status === "ready") return pubSub;
  if (connecting) return connecting;
  pubSub?.disconnect();
  pubSub = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || "0", 10),
    maxRetriesPerRequest: null,
  });
  const client = pubSub;
  connecting = new Promise<Redis>((resolve, reject) => {
    client.once("ready", () => {
      connecting = null;
      logger.info("Redis PubSub is Ready");
      resolve(client);
    })
    client.once("connect", () => {
      logger.info("Redis PubSub connected successfully");
    })
    client.once("error", (err) => {
      connecting = null;
      pubSub = null;
      logger.error("Failed to connect to Redis PubSub");
      reject(err);
    });
  });
  return connecting;
}
