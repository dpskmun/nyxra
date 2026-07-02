import { getRedis } from "../../lib/redis";
import redisConfig from "../../redis.config.json";
import { resolveMx, resolve4, resolve6 } from "dns/promises";
import { portCheck } from "./port.check";
import config from "../../config.json";

export async function checkMXRecord(email: string): Promise<boolean> {
  const emailFormated = email.trim().toLowerCase();
  const domain = emailFormated.split("@")[1];
  const redis = await getRedis();
  const checkLock = await redis.get(redisConfig.MX_LOCK + ":" + domain);
  if (checkLock) {
    await new Promise((resolve) =>
      setTimeout(resolve, config.DOMAIN_LOCK_EXPIRY * 1000),
    );
    const lock1 = await redis.get(redisConfig.MX_LOCK + ":" + domain);
    if (lock1) {
      await new Promise((resolve) =>
        setTimeout(resolve, config.DOMAIN_LOCK_EXPIRY * 1000),
      );
    }
  }
  const checkRedis = await redis.get(redisConfig.MX_CHECK + ":" + domain);
  if (checkRedis === "1") return true;
  if (checkRedis === "0") return false;
  await redis.set(
    redisConfig.MX_LOCK + ":" + domain,
    "1",
    "EX",
    config.DOMAIN_LOCK_EXPIRY,
    "NX",
  );
  try {
    const records = await resolveMx(domain);
    if (!records || !records.length) return false;
    const sortedMx = records.sort(
      (aRecord, bRecord) => aRecord.priority - bRecord.priority,
    );
    for (const mx of sortedMx) {
      try {
        const ips = await resolve4(mx.exchange);
        for (const ip of ips) {
          const open = await portCheck(ip);
          if (open) {
            await redis.set(
              redisConfig.MX_CHECK + ":" + domain,
              "1",
              "EX",
              config.DOMAIN_EXPIRY,
              "NX",
            );
            await redis.del(redisConfig.MX_LOCK + ":" + domain);
            return true;
          }
        }
      } catch {
        try {
          const ips = await resolve6(mx.exchange);
          for (const ip of ips) {
            const open = await portCheck(ip);
            if (open) {
              await redis.set(
                redisConfig.MX_CHECK + ":" + domain,
                "1",
                "EX",
                config.DOMAIN_EXPIRY,
                "NX",
              );
              await redis.del(redisConfig.MX_LOCK + ":" + domain);
              return true;
            }
          }
        } catch {}
      }
    }
    await redis.set(
      redisConfig.MX_CHECK + ":" + domain,
      "0",
      "EX",
      config.DOMAIN_EXPIRY,
      "NX",
    );
    await redis.del(redisConfig.MX_LOCK + ":" + domain);
    return false;
  } catch (err) {
    try {
      const ips = await resolve4(domain);
      for (const ip of ips) {
        const open = await portCheck(ip);
        if (open) {
          await redis.set(
            redisConfig.MX_CHECK + ":" + domain,
            "1",
            "EX",
            config.DOMAIN_EXPIRY,
            "NX",
          );
          await redis.del(redisConfig.MX_LOCK + ":" + domain);
          return true;
        }
      }
      await redis.set(
        redisConfig.MX_CHECK + ":" + domain,
        "0",
        "EX",
        config.DOMAIN_EXPIRY,
        "NX",
      );
      await redis.del(redisConfig.MX_LOCK + ":" + domain);
      return false;
    } catch {
      try {
        const ips = await resolve6(domain);
        for (const ip of ips) {
          const open = await portCheck(ip);
          if (open) {
            await redis.set(
              redisConfig.MX_CHECK + ":" + domain,
              "1",
              "EX",
              config.DOMAIN_EXPIRY,
              "NX",
            );
            await redis.del(redisConfig.MX_LOCK + ":" + domain);
            return true;
          }
        }
        await redis.set(
          redisConfig.MX_CHECK + ":" + domain,
          "0",
          "EX",
          config.DOMAIN_EXPIRY,
          "NX",
        );
        await redis.del(redisConfig.MX_LOCK + ":" + domain);
        return false;
      } catch {
        await redis.set(
          redisConfig.MX_CHECK + ":" + domain,
          "0",
          "EX",
          config.DOMAIN_EXPIRY,
          "NX",
        );
        await redis.del(redisConfig.MX_LOCK + ":" + domain);
        return false;
      }
    }
  }
}
