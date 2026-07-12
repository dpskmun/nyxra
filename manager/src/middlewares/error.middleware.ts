import Elysia from "elysia";
import { env } from "../config/env.config"
import { logger } from "../config/logger"

export const globalErrorHandler = (app: Elysia) => app
.onError(({ code, error, set }) => {
    const err = error as Error & {
        statusCode?: number;
        status?: string;
        isOperational?: boolean;
    }

    const statusCode = err.statusCode || 500;
    const status = err.status ?? "error";

    set.status = statusCode;

    if (env?.NODE_ENV === "development" || env?.NODE_ENV === "dev") {
        logger.error({
            message: err.message,
            stack: err.stack,
            error: err,
            event: "GLOBAL_ERROR_HANDLER",
        })

        return {
            status,
            message: err.message,
            stack: err.stack,
            error: err,
            event: "GLOBAL_ERROR_HANDLER",
        }
    }

    if (err.isOperational) {
        logger.error({
            status,
            message: err.message,
            event: "GLOBAL_ERROR_HANDLER",
        })

        return {
            status,
            message: err.message,
            event: "GLOBAL_ERROR_HANDLER",
        }
    }

    logger.error({
        success: false,
        message: "Something went wrong",
        event: "GLOBAL_ERROR_HANDLER",
    })

    set.status = 500;

    return {
        success: false,
        message: "Something went wrong",
        event: "GLOBAL_ERROR_HANDLER",
    }
})