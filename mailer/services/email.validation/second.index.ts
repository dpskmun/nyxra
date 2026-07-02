import { emailCheckSmtp } from "./email.smtp.check";
import { checkMXRecord } from "./mx.check";

export async function validateEmailSecond(email: string): Promise<boolean> {
    const emailFormated = email.trim().toLowerCase();
    const mxRecord = await checkMXRecord(emailFormated)
    if (!mxRecord) return false;
    const smtpCheck = await emailCheckSmtp(emailFormated)
    if (!smtpCheck) return false;
    return true;
}