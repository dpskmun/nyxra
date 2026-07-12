import dotenv from "dotenv";
import fs from "fs"

let envFile = ".env";

if (
    process.env.NODE_ENV === "production" &&
    fs.existsSync(".env.production")
) {
    envFile = ".env.production";
} else if (
    process.env.NODE_ENV === "development" &&
    fs.existsSync(".env.development")
) {
    envFile = ".env.development";
}

dotenv.config({
    path: envFile
})
import { z } from "zod";

export const envSchema = z.object({
    NODE_ENV: z.string(),
    TESTING: z.boolean().default(false),
    PORT: z.coerce.number(),
    GLOBAL_RATE_LIMIT_WINDOW: z.string(),
    GLOBAL_RATE_LIMIT_SIZE: z.string()
})

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment variables:", z.treeifyError(parsedEnv.error));
    process.exit(1);
}

export const env = parsedEnv.data;