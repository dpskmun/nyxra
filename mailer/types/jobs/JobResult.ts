import { Prisma } from "../../.prisma/client";

type ConfigurationRelationsAdd = Prisma.configurationGetPayload<{
    include: {
        headers: true;
        attachments: true;
        icalEvent: true;
    }
}>
export type GetJobResult = {
    success: true;
    job: ConfigurationRelationsAdd;
} | {
    success: false;
    error: string;
}