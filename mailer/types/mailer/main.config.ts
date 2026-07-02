import { SesConfig } from "./ses.config";
import { SmtpConfig } from "./smtp.config";

interface SMTP extends SmtpConfig {
    isSeS: false;
}

interface SeS extends SesConfig {
    isSeS: true;
}

export type MailerConfig = SMTP | SeS 