import { toList } from "../../.prisma/client";

export type GetToListResult = {
    success: true;
    toList: toList[];
} | {
    success: false;
    error: string;
}