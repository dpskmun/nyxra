import { getRedis } from "../lib/redis";
import redisConfig from "../redis.config.json";
import { prisma } from "../lib/prisma";
import { GetToListResult } from "../types/jobs/toList";

export async function getValidatedEmails(configurationId: string): Promise<GetToListResult> {
    if (!configurationId) return { success: false, error: "Configuration Id Required" }
    const redis = await getRedis();
    const validatedEmails = await redis.get(redisConfig.JOB_LIST_EMAIL_VALIDATED + ":" + configurationId);
    if (validatedEmails) return { success: true, toList: JSON.parse(validatedEmails) }
    const dbList = await prisma.toList.findMany({
        where: {
            configurationId: configurationId,
            status: "VALIDATED"
        },
    })
    if (!dbList) return { success: false, error: "List not found" };
    await redis.set(redisConfig.JOB_LIST_EMAIL_VALIDATED + ":" + configurationId, JSON.stringify(dbList), );
    return { success: true, toList: dbList };
}