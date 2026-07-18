import Redis from "ioredis";
import { logger } from "../config/logger";

let worker: Redis | null = null;
let connecting: Promise<Redis> | null = null;

export async function getWorker(): Promise<Redis> {
  if (worker?.status === "ready") return worker;
  if (connecting) return connecting;
  worker?.disconnect();
  worker = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || "0", 10),
    maxRetriesPerRequest: null,
  });
  const client = worker;
  connecting = new Promise<Redis>((resolve, reject) => {
    client.once("ready", () => {
      connecting = null;
      logger.info("Redis Worker is Ready");
      resolve(client);
    })
    client.once("connect", () => {
      logger.info("Redis Worker connected successfully");
    })
    client.once("error", (err) => {
      connecting = null;
      worker = null;
      logger.error("Failed to connect to Redis Worker");
      reject(err);
    });
  });
  return connecting;
}
