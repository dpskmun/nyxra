import Elysia from "elysia";
import { env } from "../config/env.config";
import { versionGate } from "../utils/common/versions/version.gate";
import { v0Route } from "./v0";
import { v1Route } from "./v1";
import { v2Route } from "./v2";

const isDev = env.NODE_ENV === "development"
const isTesting = env.TESTING;
const isProd = env.NODE_ENV === "production"

export const versionControl = new Elysia()
.use(versionGate({ prefix: "/v0", plugin: v0Route, enabled: isDev }))
.use(versionGate({ prefix: "/v1", plugin: v1Route, enabled: isTesting }))
.use(versionGate({ prefix: "/v2", plugin: v2Route, enabled: isProd }));