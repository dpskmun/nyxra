import { Elysia, t } from "elysia";
import { prisma } from "../../lib/prisma";
import { toSatus } from "../../../.prisma/client";
import crypto from "crypto"
import { sendResponses } from "../../utils/common/response/AppResponse";

const smtpsechema = t.Object({
  host: t.String(),
  port: t.Number(),
  secure: t.Boolean(),
  user: t.String(),
  pass: t.String(),
  rateLimitMS: t.Number(),
});

const sesSchema = t.Object({
  region: t.String(),
  accessKeyId: t.String(),
  secretAccessKey: t.String(),
  rateLimitMS: t.Number(),
});

const bodytype = t.Object({
  name: t.String(),
  slug: t.String(),
  campaign_id: t.String(),
  emailType: t.Union([
    t.Literal("BULK"),
    t.Literal("TRANSACTIONAL"),
    t.Literal("LIST"),
    t.Literal("SPAM"),
  ]),
  category: t.Optional(t.String()),
  sub_category: t.Optional(t.String()),
  scheduleAt: t.Optional(t.String()),
  transporter: t.Object({
    smtp: t.Optional(smtpsechema),
    ses: t.Optional(sesSchema),
  }),
  priority: t.Union([t.Literal("HIGH"), t.Literal("MEDIUM"), t.Literal("LOW")]),
  headers: t.Optional(t.Record(t.String(), t.String())),
  from: t.Object({
    name: t.String(),
    email: t.String(),
  }),
  cc: t.Optional(t.Array(t.String())),
  bcc: t.Optional(t.Array(t.String())),
  replyTo: t.Optional(t.String()),
  subject: t.String(),
  html: t.String(),
  txt: t.Optional(t.String()),
  valueReplacer: t.Optional(t.Boolean()),
  vlauesCsv: t.Optional(t.String()),
  attachments: t.Optional(
    t.Array(
      t.Object({
        filename: t.String(),
        filelink: t.String(),
      }),
    ),
  ),
  icalEvent: t.Optional(
    t.Object({
      method: t.Union([
        t.Literal("PUBLISH"),
        t.Literal("REQUEST"),
        t.Literal("CANCEL"),
      ]),
      url: t.String(),
      name: t.String(),
    }),
  ),
});

export const configurationRouter = new Elysia({
  prefix: "/mail",
}).post(
  "/create",
  async ({ body, set }) => {
    const data = await prisma.configuration.findUnique({
      where: {
        slug: body.slug,
      },
    });
    if (data) return sendResponses(set, 200, {
      success: false,
      message: "Configuration already exists",
    });
    let smtpId: string | undefined;
    let sesConfigurationId: string | undefined;
    const isSes = !!body.transporter.ses;
    if (body.transporter.smtp) {
      const smtp = await prisma.sMTP.create({
        data: {
          host: body.transporter.smtp.host,
          port: body.transporter.smtp.port,
          secure: body.transporter.smtp.secure,
          username: body.transporter.smtp.user,
          password: body.transporter.smtp.pass,
          rateLimitMS: body.transporter.smtp.rateLimitMS,
        }
      })
      smtpId = smtp.id;
    } else if (body.transporter.ses) {
      const ses  = await prisma.sesConfiguration.create({
        data: {
          region: body.transporter.ses.region,
          accessKey: body.transporter.ses.accessKeyId,
          secretKey: body.transporter.ses.secretAccessKey,
          rateLimitMS: body.transporter.ses.rateLimitMS,
        }
      })
      sesConfigurationId = ses.id;
    }
    const headersEntries = body.headers ? Object.entries(body.headers as Record<string, string>).map(([key, value]) => ({ key, value })) : [];
    const name = crypto.randomBytes(8).toString("hex")
    const key = crypto.randomBytes(36).toString("hex")
    await prisma.configuration.create({
      data: {
        name: body.name,
        slug: body.slug,
        campaignId: body.campaign_id,
        emailType: body.emailType,
        status: "API",
        category: body.category ?? "",
        subCategory: body.sub_category ?? "",
        scheduledAt: body.scheduleAt ? new Date(body.scheduleAt) : null,
        isSes,
        ...(smtpId ? { smtp: { connect: { id: smtpId } } } : {}),
        ...(sesConfigurationId ? { sesConfiguration: { connect: { id: sesConfigurationId } } } : {}),
        priority: body.priority,
        headers: headersEntries.length ? {
          create: headersEntries
        } : undefined,
        fromName: body.from.name,
        fromEmail: body.from.email,
        cc: body.cc,
        bcc: body.bcc,
        replyTo: body.replyTo,
        subject: body.subject,
        htmlTemplate: body.html,
        textTemplate: body.txt,
        valueReplacer: body.valueReplacer || false,
        valuesCsv: body.vlauesCsv || null,
        attachments: body.attachments
          ? {
              create: body.attachments.map((a) => ({
                filename: a.filename,
                filelink: a.filelink,
              })),
            }
          : undefined,
        icalEvent: body.icalEvent
          ? {
              create: {
                method: body.icalEvent.method,
                url: body.icalEvent.url,
                name: body.icalEvent.name,
              },
            }
          : undefined,
        accessEndPoint: true,
        accessKeys: {
          create: {
            name: name,
            key: key,
            accessKeyStatus: "ACTIVE"
          }
        }
      },
    });
    sendResponses(set, 200, {
      success: true,
      message: "Configuration created successfully",
      data: {
        keyName: name,
        accessKey: key,
      }
    });
  },
  {
    body: bodytype,
  },
);
