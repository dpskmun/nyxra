import { Elysia } from "elysia"
import { helmet } from 'elysia-helmet';
import { requestLogger } from "./middlewares/request-logger.middleware";
import { cors } from "@elysia/cors"
import { sendResponses } from "./utils/common/response/AppResponse";
import { globalRateLimiter } from "./middlewares/rate-limit/global-rate-limit.middleware";
import { globalErrorHandler } from "./middlewares/error.middleware";

export const app = new Elysia();

app.use(helmet());
app.use(requestLogger);
app.use(cors({
    origin: true,
}));

app.get("/health", ({ request, set }) => {
    return sendResponses(set, 200, {
        success: true,
        message: "Server is healthy",
        data: {
            status: "HEALTHY"
        }
    })
});

app.use(globalRateLimiter)

app.use(globalErrorHandler)