import { mailer } from "../lib/mailer";
import { prisma } from "../lib/prisma";
import { csvEmailsMap } from "../services/email.values/csv.emails.map";
import { getEmail } from "../services/getEmail";
import { getJob } from "../services/jobs.get";
import { getMailingDetails } from "../services/mailingdetails";
import { unsubscribeUrl } from "../services/unsubscribeUrl";

self.onmessage = async (event) => {
  if (
    event.data.type === "start" &&
    event.data.data.jobId &&
    event.data.data.emailId
  ) {
    const data = event.data.data;
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
    const emailData = await getEmail(data.jobId, data.emailId);
    if (!emailData.success) {
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
    await prisma.toList.update({
      data: {
        status: "SENDING",
      },
      where: {
        configurationId: data.jobId,
        id: data.emailId,
        status: "VALIDATED",
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
    let apijobIcal = "";
    if (data.apiIcalEvent)
      apijobIcal = await (await fetch(data.apiIcalEvent.url)).text();
    const valueReplacerData = await csvEmailsMap(job.job.valuesCsv);
    try {
      const unsubscribeLink = await unsubscribeUrl(
        emailData.data.id,
        emailData.data.email,
        job.job.fromEmail.split("@")[1],
      );
      let htmlContent = jobHtml;
      let textContent = jobText;
      if (job.job.valueReplacer) {
        if (valueReplacerData.success) {
          const userData = valueReplacerData.data[emailData.data.email][0];
          Object.entries(userData).forEach(([key, value]) => {
            const placeholder = new RegExp(`\\{\\^\\(${key}\\)\\^\\}`, "gi");
            if (jobHtml) htmlContent = htmlContent.replaceAll(placeholder, value);
            if (jobText) textContent = textContent.replaceAll(placeholder, value);
          });
        }
        if (data.apiValueReplace) {
          data.apiValueReplace.forEach(
            ({ key, value }: { key: string; value: string }) => {
              const placeholder = new RegExp(`\\{\\^\\(${key}\\)\\^\\}`, "gi");
              if (jobHtml) htmlContent = htmlContent.replaceAll(placeholder, value);
              if (jobText) textContent = textContent.replaceAll(placeholder, value);
            },
          );
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
      const attachementsAppend = [
        ...(job.job.attachments ?? []).map((attachement) => ({
          filename: attachement.filename,
          path: attachement.filelink,
        })),
        ...(data.apiAttachments ?? []).map(
          (attachement: { filename: string; filelink: string }) => ({
            filename: attachement.filename,
            path: attachement.filelink,
          }),
        ),
      ];
      const dbIcalEvent = job.job.icalEvent
        ? {
            filename: job.job.icalEvent?.name,
            method: job.job.icalEvent?.method,
            content: jobIcal,
          }
        : null;
      const apiIcalEvent = data.apiIcalEvent
        ? {
            filename: data.apiIcalEvent.name,
            method: data.apiIcalEvent.method,
            content: apijobIcal,
          }
        : null;
      const icalEvent = dbIcalEvent || apiIcalEvent;
      const apiHeader = Object.fromEntries(
        (data.apiMailHeaders as { key: string; value: string }[] ?? []).map(
          ({ key, value }) => [key, value],
        ),
      );
      const id = await mailTransporter.sendMail({
        priority:
          job.job.priority === "HIGH"
            ? "high"
            : job.job.priority === "LOW"
              ? "low"
              : "normal",
        headers: {
          ...jobHeaders,
          ...apiHeader,
          ...(job.job.emailType === "BULK" && { Precedence: "bulk" }),
          ...(job.job.emailType === "LIST" && { Precedence: "list" }),
          ...(job.job.emailType === "SPAM" && { Precedence: "junk" }),
          ...(job.job.emailType === "BULK" && {
            "X-Campaign-ID": job.job.campaignId ?? "bulk-email",
            "X-Campaign-Name": job.job.name ?? "bulk-email",
            "X-Entity-ID": `${job.job.campaignId}_${emailData.data.id}`,
            "X-Customer-ID": `cust_${emailData.data.id}_1`,
            "X-Message-ID": `msg_${emailData.data.id}`,
          }),
          ...(job.job.emailType === "LIST" && {
            "X-List-ID": job.job.campaignId ?? "list-email",
            "X-List-Name": job.job.name ?? "list-email",
            "X-Subscriber-ID": `sub_${job.job.campaignId}_${emailData.data.id}`,
            "X-Member-ID": `mem_${emailData.data.id}_1`,
            "X-Message-ID": `msg_${emailData.data.id}`,
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
        to: emailData.data.email,
        subject: job.job.subject,
        ...(job.job.cc && { cc: job.job.cc }),
        ...(job.job.bcc && { bcc: job.job.bcc }),
        ...(job.job.replyTo && { replyTo: job.job.replyTo }),
        ...(job.job.textTemplate && { text: textContent }),
        ...(job.job.htmlTemplate && { html: htmlContent }),
        ...(attachementsAppend.length > 0 && {
          attachments: attachementsAppend,
        }),
        ...(icalEvent && {
          icalEvent: {
            filename: icalEvent.filename,
            method: icalEvent.method,
            content: icalEvent.content,
          },
        }),
      });
      await prisma.toList.update({
        where: {
          id: emailData.data.id,
        },
        data: {
          status: "SENT",
        },
      });
      await prisma.analytics.create({
        data: {
          messageId: id.response,
          toList: {
            connect: {
              id: emailData.data.id,
            },
          },
        },
      });
    } catch (err) {
      await prisma.toList.update({
        where: {
          id: emailData.data.id,
        },
        data: {
          status: "FAILED",
        },
      });
    } finally {
      await new Promise((resolve) =>
        setTimeout(resolve, mailingCreds.rateLimitMS),
      );
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
      totalMails: 1,
      sentMails: 1,
    });
    return process.exit(0);
  }
};
