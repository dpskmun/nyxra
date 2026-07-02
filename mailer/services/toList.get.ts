import { getRedis } from "../lib/redis";
import redisConfig from "../redis.config.json";
import { prisma } from "../lib/prisma";
import { type GetToListResult } from "../types/jobs/toList";

export async function getToList(configurationId: string): Promise<GetToListResult> {
    if (!configurationId) return { success: false, error: "Configuration Id Required" }
    const redis = await getRedis();
    const toList = await redis.get(redisConfig.JOB_LIST_EMAIL + ":" + configurationId);
    if (toList) return { success: true, toList: JSON.parse(toList) }
    const dbList = await prisma.toList.findMany({
        where: {
            configurationId: configurationId,
            status: "PENDING"
        }
    })
    if (!dbList) return { success: false, error: "List not found" };
    await redis.set(redisConfig.JOB_LIST_EMAIL + ":" + configurationId, JSON.stringify(dbList));
    return { success: true, toList: dbList };
}
