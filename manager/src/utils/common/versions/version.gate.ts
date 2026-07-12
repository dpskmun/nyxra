import Elysia from "elysia";
import { VersionGateOptions } from "../../../types/version/version.gate.options";

export function versionGate({ prefix, plugin, enabled, type }: VersionGateOptions) {
    if (enabled) return new Elysia({ prefix}).use(plugin).decorate("versionType", { type });

    return new Elysia({ prefix }).all("/*", ({ set}) => {
        set.status = 403;
        return {
            event: "VERSION_GATE_DISABLED",
            success: false,
            message: "This version is currently disabled"
        }
    })
}