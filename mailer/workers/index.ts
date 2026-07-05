import { prisma } from "../lib/prisma";
import { getJob } from "../services/jobs.get";
import { getValidatedEmails } from "../services/validated.emails.get";
import { mailer } from "../lib/mailer";
import { getMailingDetails } from "../services/mailingdetails";
import { unsubscribeUrl } from "../services/unsubscribeUrl";
import { csvEmailsMap } from "../services/email.values/csv.emails.map";

self.onmessage = async (event) => {
  const data = event.data;
  if (data.type === "start" && data.jobId) {
    const job = await getJob(data.jobId);
    if (!job.success) {
      self.postMessage({
        type: "SENT",
        jobId: data.jobId,
        totalMails: 0,
        sentMails: 0,
      });
      return process.exit(0);
    }
    const validatedEmails = await getValidatedEmails(data.jobId);
    if (!validatedEmails.success) {
      await prisma.configuration.update({
        where: {
          id: data.jobId,
        },
        data: {
          status: "SENT",
        },
      });
      self.postMessage({
        type: "SENT",
        jobId: data.jobId,
        totalMails: 0,
        sentMails: 0,
      });
      return process.exit(0);
    }
    await prisma.toList.updateMany({
      where: {
        configurationId: data.jobId,
        status: "VALIDATED",
      },
      data: {
        status: "SENDING",
      },
    });
    const mailingDetails = await getMailingDetails(data.jobId);
    if (
      !mailingDetails.success ||
      mailingDetails.mailingDetails.isSes === null ||
      mailingDetails.mailingDetails.isSes === undefined
    ) {
      await prisma.configuration.update({
        where: {
          id: data.jobId,
        },
        data: {
          status: "SENT",
        },
      });
      self.postMessage({
        type: "SENT",
        jobId: data.jobId,
        totalMails: 0,
        sentMails: 0,
      });
      return process.exit(0);
    }
    const mailingCreds = mailingDetails.mailingDetails;
    if (mailingCreds.inUse) {
      await prisma.configuration.update({
        data: {
          status: "SCHEDULED",
          scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
        where: {
          id: data.jobId,
        },
      });
      self.postMessage({
        type: "SCHEDULED",
        jobId: data.jobId,
      });
      return process.exit(0);
    } else {
      if (mailingCreds.isSes) {
        await prisma.sesConfiguration.update({
          where: {
            id: job.job.sesConfigurationId ?? undefined,
          },
          data: {
            inUse: true,
          },
        });
      } else {
        await prisma.sMTP.update({
          where: {
            id: job.job.smtpId ?? undefined,
          },
          data: {
            inUse: true,
          },
        });
      }
    }
    const mailerInstance = new mailer(
      mailingCreds.isSes
        ? {
            isSeS: true,
            region: mailingCreds.region!,
            accessKeyId: mailingCreds.accessKey!,
            secretAccessKey: mailingCreds.secretKey!,
          }
        : {
            isSeS: false,
            host: mailingCreds.host!,
            port: Number(mailingCreds.port),
            secure: !!mailingCreds.secure,
            user: mailingCreds.username!,
            pass: mailingCreds.password!,
          },
    );

    const mailTransporter = mailerInstance.getTransporterInstance();
    const jobHeaders = Object.fromEntries(
      job.job.headers.map(({ key, value }) => [key, value]),
    );
    let jobText = "";
    if (job.job.textTemplate)
      jobText = await (await fetch(job.job.textTemplate)).text();
    let jobHtml = "";
    if (job.job.htmlTemplate)
      jobHtml = await (await fetch(job.job.htmlTemplate)).text();
    let jobIcal = "";
    if (job.job.icalEvent)
      jobIcal = await (await fetch(job.job.icalEvent.url)).text();
    const sendedList = new Set<string>();
    const failedList = new Set<string>();
    const valueReplacerData = await csvEmailsMap(job.job.valuesCsv);
    for (const email of validatedEmails.toList) {
      try {
        const unsubscribeLink = await unsubscribeUrl(
          job.job.campaignId,
          email.email,
          job.job.fromEmail.split("@")[1],
        );
        let htmlContent = jobHtml;
        let textContent = jobText;
        if (job.job.valueReplacer) {
          if (valueReplacerData.success) {
            const userData = valueReplacerData.data[email.email][0];
            Object.entries(userData).forEach(([key, value]) => {
              const placeholder = new RegExp(`\\{\\^\\(${key}\\)\\^\\}`, "gi");
              if (jobHtml) htmlContent = htmlContent.replaceAll(placeholder, value);
              if (jobText) textContent = textContent.replaceAll(placeholder, value);
            });
          }
          if (unsubscribeLink.success && job.job.emailType !== "TRANSACTIONAL") {
            const unsubscribePlaceholder = new RegExp(
              `\\{\\^\\(UNSUBSCRIBE_URL\\)\\^\\}`,
              "gi",
            );
            if (jobHtml)
              htmlContent = htmlContent.replaceAll(
                unsubscribePlaceholder,
                unsubscribeLink.url,
              );
            if (jobText)
              textContent = textContent.replaceAll(
                unsubscribePlaceholder,
                unsubscribeLink.url,
              );
          }
        }
        const id = await mailTransporter.sendMail({
          priority:
            job.job.priority === "HIGH"
              ? "high"
              : job.job.priority === "LOW"
                ? "low"
                : "normal",
          headers: {
            ...jobHeaders,
            ...(job.job.emailType === "BULK" && { Precedence: "bulk" }),
            ...(job.job.emailType === "LIST" && { Precedence: "list" }),
            ...(job.job.emailType === "SPAM" && { Precedence: "junk" }),
            ...(job.job.emailType === "BULK" && {
              "X-Campaign-ID": job.job.campaignId ?? "bulk-email",
              "X-Campaign-Name": job.job.name ?? "bulk-email",
              "X-Entity-ID": `${job.job.campaignId}_${email.id}`,
              "X-Customer-ID": `cust_${email.id}_${sendedList.size}`,
              "X-Message-ID": `msg_${email.id}`,
            }),
            ...(job.job.emailType === "LIST" && {
              "X-List-ID": job.job.campaignId ?? "list-email",
              "X-List-Name": job.job.name ?? "list-email",
              "X-Subscriber-ID": `sub_${job.job.campaignId}_${email.id}`,
              "X-Member-ID": `mem_${email.id}_${sendedList.size}`,
              "X-Message-ID": `msg_${email.id}`,
            }),
            "X-Mailer": "Nyxra",
            "Auto-Submitted": "auto-generated",
            "X-Auto-Response-Suppress": "All",
            ...(["BULK", "LIST"].includes(job.job.emailType) &&
            unsubscribeLink.success
              ? {
                  "List-Unsubscribe": `<${unsubscribeLink.url}>`,
                  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                }
              : {}),
            "X-Auto-Reply": "no",
            "X-Auto-Response": "no",
            ...(job.job.emailType === "BULK" && {
              "X-Category": job.job.category,
              "X-Subcategory": job.job.subCategory,
            }),
          },
          from: `${job.job.fromName} <${job.job.fromEmail}>`,
          to: email.email,
          subject: job.job.subject,
          ...(job.job.cc && { cc: job.job.cc }),
          ...(job.job.bcc && { bcc: job.job.bcc }),
          ...(job.job.replyTo && { replyTo: job.job.replyTo }),
          ...(job.job.textTemplate && { text: textContent }),
          ...(job.job.htmlTemplate && { html: htmlContent }),
          ...(job.job.attachments.length > 0 && {
            attachments: job.job.attachments.map((attachement) => ({
              filename: attachement.filename,
              path: attachement.filelink,
            })),
          }),
          ...(job.job.icalEvent && {
            icalEvent: {
              filename: job.job.icalEvent?.name,
              method: job.job.icalEvent?.method,
              content: jobIcal,
            },
          }),
        });
        await prisma.toList.update({
          where: {
            id: email.id,
          },
          data: {
            status: "SENT",
          },
        });
        await prisma.analytics.create({
          data: {
            messageId: id.response,
            list: {
              connect: {
                id: email.id,
              },
            },
          },
        });
        sendedList.add(email.id);
      } catch (err) {
        await prisma.toList.update({
          where: {
            id: email.id,
          },
          data: {
            status: "FAILED",
          },
        });
        failedList.add(email.id);
      } finally {
        await new Promise((resolve) =>
          setTimeout(resolve, mailingCreds.rateLimitMS),
        );
      }
    }
    await prisma.configuration.update({
      where: {
        id: data.jobId,
      },
      data: {
        status: "SENT",
      },
    });
    self.postMessage({
      type: "SENT",
      jobId: data.jobId,
      totalMails: validatedEmails.toList.length,
      sentMails: sendedList.size,
    });
    return process.exit(0);
  }
};
