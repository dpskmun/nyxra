import Redis from "ioredis";

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
  });
  const client = worker;
  connecting = new Promise<Redis>((resolve, reject) => {
    client.once("ready", () => {
      connecting = null;
      resolve(client);
    })
    client.once("error", (err) => {
      connecting = null;
      worker = null;
      reject(err);
    });
  });
  return connecting;
}
