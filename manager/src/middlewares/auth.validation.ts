import { Elysia } from "elysia";
import { sendResponses } from "../utils/common/response/AppResponse";
import { prisma } from "../lib/prisma";

export const authMiddleware = new Elysia({
    name: "authMiddleware"
}).derive(
    { as: "scoped"},
    async ({ headers, set }) => {
        const authHeader = headers["x-nyxra-key"];
        if (!authHeader) {
            set.status = 401;
            throw new Error("Unauthorized")
        }
        const result = await prisma.accessKey.findUnique({
            where: {
                key: authHeader,
                accessKeyStatus: "ACTIVE"
            }
        })
        if (!result) {
            set.status = 401;
            throw new Error("Unauthorized")
        }
        return {
            configurationId: result.configurationId
        }
    }
)