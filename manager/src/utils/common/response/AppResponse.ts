import type { Context } from "elysia";
import type { ApiResponse } from "../../../types/response/ApiResponses";

export const sendResponses = <T>(
    set: Context["set"],
    statusCode: number,
    payload?: ApiResponse<T> | string
) => {
    set.status = statusCode;
    return payload
}