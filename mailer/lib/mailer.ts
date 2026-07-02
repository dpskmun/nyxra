import { createTransport, type Transporter  } from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { MailerConfig } from "../types/mailer/main.config";

export class mailer {
    private config: MailerConfig;
    private transporter: Transporter;
    
    constructor(config: MailerConfig) {
        this.config = config;
        if (config.isSeS && (!config.region || !config.accessKeyId || !config.secretAccessKey)) throw new Error("Invalid SES configuration");
        if (!config.isSeS && (!config.host || !config.port || config.secure === undefined || config.secure === null || !config.user || !config.pass)) throw new Error("Invalid SMTP configuration");
        this.transporter = this.create();
    }

    private create(): Transporter {
        if (this.config.isSeS) {
            const sesClient = new SESv2Client({
                region: this.config.region,
                credentials: {
                    accessKeyId: this.config.accessKeyId,
                    secretAccessKey: this.config.secretAccessKey,
                }
            })
            return createTransport({
                SES: {
                    sesClient,
                    SendEmailCommand,
                }
            })
        } else return createTransport({
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure,
            auth: {
                user: this.config.user,
                pass: this.config.pass,
            }
        })
    }

    public getTransporterInstance(): Transporter {
        return this.transporter;
    }
}