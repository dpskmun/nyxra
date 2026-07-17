import { prisma } from "../lib/prisma";
import { scheduleQueue } from "../lib/queue";

const POLL_INTERVAL_MS = 30 * 1000;
export async function pollForConfigChanges() {
    try {
        const pending = await prisma.configuration.findMany({
            where: {
                status: "SCHEDULED",
                scheduledAt: { not: null }
            },
            select: { id: true, scheduledAt: true }
        })
        for (const config of pending)  {
            const jobId = config.id;

            const exitingJob = await scheduleQueue.getJob(jobId);
            if (exitingJob) continue;

            const delay = Math.max(
                new Date(config.scheduledAt || "").getTime() - Date.now(),
                0
            );

            await scheduleQueue.add(
                "runCampaign", 
                { configId: config.id },
                {
                    delay,
                    jobId,
                    removeOnComplete: true,
                    removeOnFail: true
                }
            )

            console.log(`[poller] Scheduled job for config ${config.id} with delay ${delay}ms`);
        }
    } catch (error) {
        console.error("[poller] Error occurred while polling for config changes", error);
    }
}

export function startPoller() {
    
}