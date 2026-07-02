import { publicEncrypt, constants } from "crypto"
import { readFileSync, existsSync } from "fs"
import path from "path"

export function unsubscribeUrl(campaignId: string, email: string, domain: string): { success: true; url: string } | { success: false; error: string } {
    if (!campaignId || !email || !domain) return { success: false, error: "Campaign Id, Email and Domain Required" };
    const data = {
        campaignId: `${campaignId}`,
        email: `${email}`,
        domain: `${domain}`
    }
    const filePath = path.join(__filename, "../../public_key.pem");
    if (!existsSync(filePath)) return { success: false, error: "key not found" };
    const publicKey = readFileSync(filePath);
    const encrypted = publicEncrypt({
        key: publicKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256"
    }, Buffer.from(JSON.stringify(data))).toString("base64")
    const isProd = process.env.NODE_ENV === "production";
    const hypertext = isProd ? "https://" : "http://";
    const domainMain = isProd ? domain : "localhost:3000";
    return { success: true, url: `${hypertext}${domainMain}/unsubscribe/${encrypted}` }
}