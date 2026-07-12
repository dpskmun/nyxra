import Elysia from "elysia";
import { env } from "../config/env.config";
import { versionGate } from "../utils/common/versions/version.gate";
import { versionRouteController } from "./version.route.controller";

const isDev = env.NODE_ENV === "development"
const isTesting = env.TESTING;
const isProd = env.NODE_ENV === "production"

export const versionControl = new Elysia()
.use(versionGate({ prefix: "/v0", plugin: versionRouteController, enabled: isDev, type: "DEVELOPMENT" }))
.use(versionGate({ prefix: "/v1", plugin: versionRouteController, enabled: isTesting, type: "TESTING" }))
.use(versionGate({ prefix: "/v2", plugin: versionRouteController, enabled: isProd, type: "PRODUCTION" }));