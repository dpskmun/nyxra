import { isEmail } from "validator";

export function formatCheck(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    const emailFormated = email.trim().toLowerCase();
    if (emailFormated.length > 254) return false;
    if (!isEmail(emailFormated)) return false;
    const [localPart, domain] = emailFormated.split("@")
    if (localPart.length > 64) return false;
    if (domain.length > 255) return false;
    if (/^\.|\.$|\.\./.test(localPart)) return false;
    return true;
}