import { prisma } from "../lib/prisma";
import { getRedis } from "../lib/redis";
import redisConfig from "../redis.config.json";

export async function getMailingDetails(jobId: string): Promise<{ success: true; mailingDetails: {
    isSes: boolean;
    inUse: boolean;
    rateLimitMS: number;
    region?: string | null;
    accessKey?: string | null;
    secretKey?: string | null;
    host?: string | null;
    port?: number | null;
    secure?: boolean | null;
    username?: string | null;
    password?: string | null;
} } | { success: false; error: string }> {
    const redis = await getRedis();
    const mailingDetails = await redis.get(redisConfig.JOB_MAILER_DETAILS + ":" + jobId);
    if (mailingDetails) return { success: true, mailingDetails: JSON.parse(mailingDetails) };
    const dbmailer = await prisma.configuration.findUnique({
        where: {
            id: jobId
        },
        select: {
            isSes: true,
            sesConfiguration: true,
            smtp: true
        }
    })
    if (!dbmailer) return { success: false, error: "Not found" }
    if (dbmailer.isSes === true && !dbmailer.sesConfiguration) return { success: false, error: "Not found" }
    if (dbmailer.isSes === false && !dbmailer.smtp) return { success: false, error: "Not found" }
    const dataFormatted = {
        isSes: dbmailer.isSes,
        inUse: dbmailer.isSes === true ? dbmailer.sesConfiguration?.inUse ?? true : dbmailer.smtp?.inUse ?? true,
        rateLimitMS: dbmailer.isSes === true ? dbmailer.sesConfiguration?.rateLimitMS ?? 200 : dbmailer.smtp?.rateLimitMS ?? 200,
        region: dbmailer.sesConfiguration?.region,
        accessKey: dbmailer.sesConfiguration?.accessKey,
        secretKey: dbmailer.sesConfiguration?.secretKey,
        host: dbmailer.smtp?.host,
        port: Number(dbmailer.smtp?.port) ?? null,
        secure: Boolean(dbmailer.smtp?.secure) ?? null,
        username: dbmailer.smtp?.username,
        password: dbmailer.smtp?.password
    }
    await redis.set(redisConfig.JOB_MAILER_DETAILS + ":" + jobId, JSON.stringify(dataFormatted));
    return { success: true, mailingDetails: dataFormatted };
}