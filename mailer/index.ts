import { getWorker } from "./lib/worker";
import redisConfig from "./redis.config.json";
import { validateEmailFirst } from "./services/email.validation/first.index";
import { getJob } from "./services/jobs.get";
import { getToList } from "./services/toList.get";
import { workers } from "./stores/workers";
import { toList } from "./.prisma/client";
import { validateEmailSecond } from "./services/email.validation/second.index";
import { updateAllToList } from "./services/toList.update.all";
import { prisma } from "./lib/prisma";
import { getinUse } from "./services/inUse.get";
import { getApiWorker } from "./lib/apiWorker";
import { apiWorker } from "./stores/apiWorker";
import { getEmail } from "./services/getEmail";

const workerRedis = await getWorker();
const apiWorkerRedis = await getApiWorker();

(async function processQueue() {
  try {
    const job = await workerRedis.brpop(redisConfig.JOB_QUEUE, 0);
    if (!job) return;
    const [jobType, jobId] = job;
    const getJobResult = await getJob(jobId);
    if (!getJobResult.success) return;
    const jobData = getJobResult.job;
    if (jobData.accessEndPoint) return;
    if (jobData.status !== "DRAFT") return;
    const workerModule = new Worker(
      new URL("./workers/index.ts", import.meta.url).href,
      {
        type: "module",
        name: jobId,
      },
    );
    workers.set(jobId, workerModule);
    const toListget = await getToList(jobId);
    const toListFinal: toList[] = toListget.success ? toListget.toList : [];
    await prisma.configuration.update({
      data: {
        status: "VALIDATING",
      },
      where: {
        id: jobId,
      },
    });
    await updateAllToList(jobId);
    const checkfirst_valid = new Map<string, string>();
    const invalid_email = new Map<string, string>();
    for (const emailList of toListFinal) {
      const firstValidationResult = await validateEmailFirst(emailList.email);
      if (!firstValidationResult.isValid)
        invalid_email.set(emailList.id, emailList.email);
      if (firstValidationResult.isValid) {
        if (
          [...checkfirst_valid.values()].includes(firstValidationResult.email)
        ) {
          invalid_email.set(emailList.id, firstValidationResult.email);
        } else {
          checkfirst_valid.set(emailList.id, firstValidationResult.email);
        }
      }
    }
    const checksecond_valid = new Map<string, string>();
    for (const emailList of checkfirst_valid) {
      const secondValidationResult = await validateEmailSecond(emailList[1]);
      if (!secondValidationResult)
        invalid_email.set(emailList[0], emailList[1]);
      if (secondValidationResult)
        checksecond_valid.set(emailList[0], emailList[1]);
    }
    await Promise.all(
      [...invalid_email.entries()].map(
        async ([id]) =>
          await prisma.toList.update({
            where: { id: id },
            data: {
              status: "FAILED",
            },
          }),
      ),
    );
    const unsubscribeFailed = await prisma.toList.updateManyAndReturn({
      where: {
        configurationId: jobId,
        unsubscribe: true,
      },
      data: {
        status: "FAILED",
      },
    });
    await Promise.all(
      unsubscribeFailed.map(async ({ id }) => {
        checksecond_valid.delete(id);
      }),
    );
    const isUseResult = await getinUse(
      jobData.sesConfigurationId,
      jobData.smtpId,
    );
    if (!isUseResult.success) {
      await prisma.configuration.update({
        data: {
          status: "SCHEDULED",
          scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
        where: {
          id: jobId,
        },
      });
      return;
    } else {
      await Promise.all(
        [...checksecond_valid.entries()].map(([id, email]) =>
          prisma.toList.update({
            where: { id: id },
            data: {
              status: "VALIDATED",
              email: email,
            },
          }),
        ),
      );
      workerModule.postMessage({ type: "start", jobId: jobId });
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("Connection closed"))
      return;
    console.error("Error processing job:", err);
    await new Promise((res) => setTimeout(res, 1000));
  } finally {
    setImmediate(processQueue);
  }
})();

(async function apiQueue() {
  try {
    const job = await apiWorkerRedis.brpop(redisConfig.API_QUEUE, 0);
    if (!job) return;
    const [jobType, data] = job;
    if (!data) return;
    const parsedData = JSON.parse(data);
    if (typeof parsedData !== "object" || parsedData === null) return;
    if (!("jobId" in parsedData) || !("emailId" in parsedData)) return;
    const { jobId, emailId } = parsedData as { jobId: string; emailId: string };
    const getJobResult = await getJob(jobId);
    if (!getJobResult.success) return;
    const jobData = getJobResult.job;
    if (!jobData.accessEndPoint) return;
    if (jobData.status !== "API") return;
    const workerModule = new Worker(
      new URL("./workers/api.ts", import.meta.url).href,
      {
        type: "module",
        name: jobId,
      },
    );
    apiWorker.set(jobId, workerModule);
    const emailGet = await getEmail(jobId, emailId);
    if (!emailGet.success) return;
    const emailData = emailGet.data;
    await prisma.toList.update({
      data: {
        status: "VALIDATING",
      },
      where: {
        id: emailId,
        configurationId: jobId,
        status: "PENDING",
      },
    });
    const firstValidationResult = await validateEmailFirst(emailData.email);
    if (!firstValidationResult.isValid) {
      await prisma.toList.update({
        data: {
          status: "FAILED",
        },
        where: {
          id: emailId,
          configurationId: jobId,
          status: "VALIDATING",
        },
      });
      return;
    }
    const secondValidationResult = await validateEmailSecond(emailData.email);
    if (!secondValidationResult) {
      await prisma.toList.update({
        data: {
          status: "FAILED",
        },
        where: {
          id: emailId,
          configurationId: jobId,
          status: "VALIDATING",
        },
      });
      return;
    }
    const unsubscribeCheck = await prisma.toList.findUnique({
      where: {
        id: emailId,
        configurationId: jobId,
        unsubscribe: true,
        status: "VALIDATING",
      },
    });
    if (unsubscribeCheck) {
      await prisma.toList.update({
        data: {
          status: "FAILED",
        },
        where: {
          id: emailId,
          configurationId: jobId,
          status: "VALIDATING",
          unsubscribe: true,
        },
      });
      return;
    }
    await prisma.toList.update({
      data: {
        status: "VALIDATED"
      },
      where: {
        id: emailId,
        configurationId: jobId,
        status: "VALIDATING",
      },
    });
    workerModule.postMessage({ type: "start", data: { jobId, emailId } });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Connection closed"))
      return;
    console.error("Error processing job:", err);
    await new Promise((res) => setTimeout(res, 1000));
  } finally {
    setImmediate(apiQueue);
  }
})();
