import { Worker, Job } from "bullmq";
import { prisma } from "../lib/prisma";
import { getRedis } from "../lib/redis";
import redisconf from "../redis.config.json";

interface JobData {
    configId: string
}

const redis = await getRedis()
export function startWorker() {
    const worker = new Worker<JobData>(
        "configScheduler",
        async (job: Job<JobData>) => {
            const { configId } = job.data;
            const config = await prisma.configuration.findUnique({
                where: {id: configId}
            })
            if (!config || config.status !== "SCHEDULED") return;
            await redis.lpush(redisconf.JOB_QUEUE, configId);
        },
        {
            connection: redis
        }
    );
    worker.on("failed", (job, err) => {
        console.log(`[worker] job ${job?.id} failed:`, err)
    })
    return worker
}