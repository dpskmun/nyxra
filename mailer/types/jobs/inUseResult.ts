export type GetinUseResult = {
    success: true;
    inUse: boolean;
} | {
    success: false;
    error: string;
}