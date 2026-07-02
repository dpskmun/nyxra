import { resolveMx } from "dns/promises";
import { checkMxEmail } from "./email.mx.check";

export async function emailCheckSmtp(email: string): Promise<boolean> {
  const emailFormated = email.trim().toLowerCase();
  const domain = emailFormated.split("@")[1];
  let error = false;
  const records = await resolveMx(domain);
  if (!records || !records.length) return false;
  const sortedMx = records.sort(
    (aRecord, bRecord) => aRecord.priority - bRecord.priority,
  );
  for (const mx of sortedMx) {
    try {
      const result = await checkMxEmail(emailFormated, mx.exchange);
      if (result) return true;
    } catch {
      continue;
    }
  }
  return false;
}
