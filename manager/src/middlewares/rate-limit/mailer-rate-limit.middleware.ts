import { rateLimit, firstOf, user, ip } from "elysia-nazli";
import { env } from "../../config/env.config";
import { redisStore } from "elysia-nazli/redis";
import { getRedis } from "../../lib/redis";
import { logger } from "../../config/logger";

const redis = await getRedis();
export const mailerRateLimiter = rateLimit({
  algorithm: "gcra",

  window: `${env.MAILER_RATE_LIMIT_WINDOW}m`,
  limit: Number(env.MAILER_RATE_LIMIT_SIZE),

  headers: {
    legacy: false,
    standard: true,
  },

  key: firstOf(user("id"), ip({ trustedProxyDepth: 1 })),
  store: redisStore({
    sendCommand: async (args: string[]) => {
      return redis.call(args[0], ...args.slice(1)) as Promise<
        string | number | null
      >;
    },
    prefix: "rate-limit:mailer",
  }),

  onLimit: ({ context }) => {
    logger.warn({
      event: "MAILER_RATE_LIMIT_EXCEEDED",
      path: context.path,
    });

    return Response.json(
      {
        event: "MAILER_RATE_LIMIT_EXCEEDED",
        success: false,
        message: "Too many requests. Please try again later",
      },
      {
        status: 429,
      },
    );
  },
});
