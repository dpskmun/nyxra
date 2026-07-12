import type Elysia from "elysia";

export interface VersionGateOptions {
    prefix: string;
    plugin: Elysia<any>;
    enabled: boolean;
    type: "DEVELOPMENT" | "TESTING" | "PRODUCTION";
}