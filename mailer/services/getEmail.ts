import { type toList } from "../.prisma/client"
import { prisma } from "../lib/prisma";
import { getRedis } from "../lib/redis";
import redisConfig from "../redis.config.json";

export async function getEmail(jobId: string, emailId: string): Promise<{success: true, data: toList} | {success: false}> {
    const redis = await getRedis();
    const cachedEmail = await redis.get(redisConfig.TO_LIST + ":" + jobId + ":" + emailId);
    if (cachedEmail) return {success: true, data: JSON.parse(cachedEmail)};
    const email = await prisma.toList.findUnique({
        where: {
            id: emailId,
            configurationId: jobId,
        },
    });
    if (!email) return {success: false};
    await redis.set(redisConfig.TO_LIST + ":" + jobId + ":" + emailId, JSON.stringify(email))
    return {success: true, data: email};
}