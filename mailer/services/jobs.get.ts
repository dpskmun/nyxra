import { getRedis } from "../lib/redis";
import redisConfig from "../redis.config.json";
import { prisma } from "../lib/prisma";
import { GetJobResult } from "../types/jobs/JobResult";

export async function getJob(jobId: string): Promise<GetJobResult> {
    if (!jobId) return { success: false, error: "Job ID is required" };
    const redis = await getRedis()
    const job = await redis.get(redisConfig.JOB_LIST + ":" + jobId);
    if (job) return { success: true, job: JSON.parse(job) };
    const dbjob = await prisma.configuration.findUnique({
        where: {
            id: jobId
        },
        include: {
            headers: true,
            attachments: true,
            icalEvent: true,
        }
    });
    if (!dbjob) return { success: false, error: "Job not found" };
    await redis.set(redisConfig.JOB_LIST + ":" + jobId, JSON.stringify(dbjob));
    return { success: true, job: dbjob };
}