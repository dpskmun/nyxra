import { ResultMap } from "./resultMap";

export type csvMapResult = {
    success: false;
} | {
    success: true;
    data: ResultMap;
}