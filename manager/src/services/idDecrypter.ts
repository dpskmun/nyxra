import path from "path";
import { existsSync, readFileSync } from "fs";
import { privateDecrypt, constants } from "crypto"

export function idDecrypter(encryptedId: string): { success: true, data: { emailId: string, email: string } } | { success: false } {
    try {
        if (!encryptedId) return { success: false };
        const filePath = path.join(__dirname, "../../private_key.pem");
        if (!existsSync(filePath)) return { success: false };
        const privateKey = readFileSync(filePath)
        const decryptedId = privateDecrypt({
            key: privateKey,
            padding: constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        }, Buffer.from(encryptedId, "base64"));

        const data = JSON.parse(decryptedId.toString())
        if (!data.emailId || !data.email) return { success: false };
        return { success: true, data: { emailId: data.emailId, email: data.email } }
    } catch {
        return { success: false }
    }
}