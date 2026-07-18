import { Elysia, t } from "elysia";
import { authMiddleware } from "../../middlewares/auth.validation";
import { sendResponses } from "../../utils/common/response/AppResponse";
import { prisma } from "../../lib/prisma";
import { getRedis } from "../../lib/redis";
import redisConf from "../../../redis.config.json";
import { mailerRateLimiter } from "../../middlewares/rate-limit/mailer-rate-limit.middleware";

export const mailRouter = new Elysia({
    prefix: "/mailer",
})
.use(authMiddleware)
.use(mailerRateLimiter)
.post("/send", async ({ configurationId, body, set }) => {
    if (!configurationId) return sendResponses(set, 401, "Unauthorized")
    if (!body.emailId) return sendResponses(set, 400, "Email ID is required");
    const configurationGet = await prisma.configuration.findUnique({
        where: {
            id: configurationId,
            status: "API"
        }
    })
    if (!configurationGet) return sendResponses(set, 400, "Configuration ID Invalid");
    const emailcreat = await prisma.toList.create({
        data: {
            email: body.emailId,
            status: "PENDING",
            configuration: {
                connect: {
                    id: configurationId
                }
            }
        }
    })
    const redis = await getRedis();
    await redis.lpush(redisConf.API_QUEUE, JSON.stringify({
        jobId: configurationId,
        emailId: emailcreat.id,
        ...(body.apiAttachments && { apiAttachments: body.apiAttachments }),
        ...(body.apiIcalEvent && { apiIcalEvent: body.apiIcalEvent }),
        ...(body.apiMailHeaders && { apiMailHeaders: body.apiMailHeaders }),
        ...(body.apiValueReplace && { apiValueReplace: body.apiValueReplace }),
    }))
    return sendResponses(set, 200, "SENT");
}, {
    body: t.Object({
        emailId: t.String(),
        apiAttachments: t.Optional(t.Array(t.Object({
            filename: t.String(),
            filelink: t.String(),
        }))),
        apiIcalEvent: t.Optional(t.Object({
            name: t.String(),
            method: t.String(),
            url: t.String(),
        })),
        apiMailHeaders: t.Optional(t.Array(t.Object({
            key: t.String(),
            value: t.String(),
        }))),
        apiValueReplace: t.Optional(t.Array(t.Object({
            key: t.String(),
            value: t.String(),
        }))),
    }),
})