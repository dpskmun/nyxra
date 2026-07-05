import { prisma } from "../lib/prisma";

export async function updateAllToList(configurationId: string) {
    return await prisma.toList.updateMany({
        data: {
            status: "VALIDATING"
        },
        where: {
            status: "PENDING",
            configurationId: configurationId
        }
    })
}