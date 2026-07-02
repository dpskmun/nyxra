import { disposableEmail } from "./disposable.check";
import { formatCheck } from "./format.check";
import { typoFix } from "./typo.fix";

export async function validateEmailFirst(email: string): Promise<{ isValid: boolean; email: string }> {
    const emailFormated = email.trim().toLowerCase();
    const emailValid = formatCheck(emailFormated);
    if (!emailValid) return { isValid: false, email: "" };
    const disposable = disposableEmail(emailFormated);
    if (!disposable) return { isValid: false, email: "" };
    const typoFixedEmail = typoFix(emailFormated);
    return { isValid: true, email: typoFixedEmail };
}