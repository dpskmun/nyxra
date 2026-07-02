import { Socket } from "net";
import config from "../../config.json";

export async function portCheck(ip: string): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new Socket()
        socket.setTimeout(config.PORT_TIMEOUT);
        socket.on("connect", () => {
            socket.destroy()
            resolve(true)
        })
        socket.on("timeout", () => {
            socket.destroy()
            resolve(false)
        })
        socket.on("error", () => {
            socket.destroy();
            resolve(false)
        })

        socket.connect({
            host: ip,
            port: 25
        })
    })
}