import { disposable } from "../../stores/disposable";

export function disposableEmail(email: string): boolean {
  const emailFormated = email.trim().toLowerCase();
  const domain = emailFormated.split("@")[1];
  if (disposable.has(domain)) return false;
  return true;
}
