import { Queue } from "bullmq/dist/esm/classes/queue"
import { getRedis } from "./redis"

const redis = await getRedis()
export const scheduleQueue = new Queue("configScheduler", {
    connection: redis
})