import Elysia from "elysia";
import { idDecrypter } from "../../services/idDecrypter";
import { sendResponses } from "../../utils/common/response/AppResponse";
import { prisma } from "../../lib/prisma";

export const unsubscribeRouter = new Elysia({
    prefix: "/unsubscribe",
})
.get("/:encryptedId", async ({ params: { encryptedId }, set }) => {
    const decrypt = idDecrypter(encryptedId)
    if (!decrypt.success) return sendResponses(
        set,
        500,
        'Failed to decrypt the id'
    )
    const data = await prisma.toList.findUnique({
        where: {
            id: decrypt.data.emailId,
            email: decrypt.data.email
        }
    })
    if (!data) return sendResponses(
        set,
        404,
        'Not Found'
    )
    const udpated = await prisma.toList.update({
        where: {
            id: decrypt.data.emailId,
            email: decrypt.data.email
        },
        data: {
            unsubscribe: !data.unsubscribe
        }
    })
    return sendResponses(
        set,
        200,
        udpated.unsubscribe ? 'Successfully unsubscribed' : 'Successfully subscribed'
    )
})
.post("/:encryptedId", async ({ params: { encryptedId }, set }) => {
    const decrypt = idDecrypter(encryptedId)
    if (!decrypt.success) return sendResponses(
        set,
        500,
        'Failed to decrypt the id'
    )
    const data = await prisma.toList.findUnique({
        where: {
            id: decrypt.data.emailId,
            email: decrypt.data.email
        }
    })
    if (!data) return sendResponses(
        set,
        404,
        'Not Found'
    )
    const udpated = await prisma.toList.update({
        where: {
            id: decrypt.data.emailId,
            email: decrypt.data.email
        },
        data: {
            unsubscribe: !data.unsubscribe
        }
    })
    return sendResponses(
        set,
        200,
        udpated.unsubscribe ? 'Successfully unsubscribed' : 'Successfully subscribed'
    )
})