import { prisma } from "../lib/prisma";
import { GetinUseResult } from "../types/jobs/inUseResult";

export async function getinUse(sesConfigurationId?: string | null, smtpId?: string | null): Promise<GetinUseResult> {
    if (!sesConfigurationId && !smtpId) return { success: false, error: "SES Configuration ID or SMTP ID is required" }
    if (sesConfigurationId) {
        const sesdb = await prisma.sesConfiguration.findUnique({
            where: {
                id: sesConfigurationId
            }
        })
        if (!sesdb) return { success: true, inUse: true }
        return { success: true, inUse: sesdb.inUse }
    } else if (smtpId) {
        const smtpid = await prisma.sMTP.findUnique({
            where: {
                id: smtpId
            }
        })
        if (!smtpid) return { success: true, inUse: true }
        return { success: true, inUse: smtpid.inUse }
    } else {
        return { success: true, inUse: true }
    }
}