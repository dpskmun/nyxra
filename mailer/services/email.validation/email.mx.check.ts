import config from "../../config.json";
import { createConnection } from "net";
import { validateRateLimit } from "../rate.limit/validator.limit";
import { getRedis } from "../../lib/redis";
import redisConfig from "../../redis.config.json"

export async function checkMxEmail(email: string, mx: string): Promise<boolean> {
  const redis = await getRedis();
  const redisCheck = await redis.get(redisConfig.MX_HANDSHAKE + ":" + email)
  if (redisCheck) return true;
  await validateRateLimit()
  const emailFormated = email.trim().toLowerCase();
  return new Promise((resolve) => {
    const socket = createConnection(25, mx);
    let step = 0;
    let finished = false;

    const commands = [
      `HELO dpskmun.com\r\n`,
      `MAIL FROM:<admin@dpskmun.com>\r\n`,
      `RCPT TO:<${emailFormated}>\r\n`,
      `QUIT\r\n`,
    ];
    const finish = (result: boolean) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket.end();
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish(false);
    }, config.PORT_TIMEOUT);

    socket.on("connect", () => {});
    socket.on("data", (data) => {
      const code = parseInt(data.toString().substring(0, 3), 10);
      if (step === 0 && code === 220) {
        socket.write(commands[0]);
        step++;
      } else if (step === 1 && code === 250) {
        socket.write(commands[1]);
        step++;
      } else if (step === 2 && code === 250) {
        socket.write(commands[2]);
        step++;
      } else if (step === 3) {
        if (code === 250) {
          finish(true);
        } else if (code === 550 || code === 551 || code === 553) {
          finish(false);
        } else {
          finish(false);
        }
        socket.write(commands[3]);
      } else if (code >= 400) {
        finish(false);
      }
    });

    socket.on("error", (err) => {
      finish(false);
    });

    socket.on("timeout", () => {
      finish(false);
    });
  });
}
