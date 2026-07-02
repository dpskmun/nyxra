import config from "../../config.json"

export function typoFix(email: string): string {
  const emailFormated = email.trim().toLowerCase();
  const [localPart, domain] = emailFormated.split("@");
  const fixedDomain = config.COMMON_DOMAIN_TYPOS[domain as keyof typeof config.COMMON_DOMAIN_TYPOS] || domain;
  return `${localPart}@${fixedDomain}`;
}
