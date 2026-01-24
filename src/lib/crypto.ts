import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM
const TAG_LENGTH = 16;

function getKey() {
  const key = process.env.MESSAGE_SECRET || "";
  if (!key || key.length < 32) {
    console.warn("[crypto] MESSAGE_SECRET not set or too short; falling back to no-op encryption");
    return null;
  }
  return Buffer.from(key.slice(0, 32));
}

export function encryptText(plain: string) {
  const key = getKey();
  if (!key) return plain;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // store iv + tag + encrypted
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptText(ciphertext: string) {
  const key = getKey();
  if (!key) return ciphertext;
  try {
    // quick sanity checks: must be base64-like and long enough (iv + tag + >=1 byte)
    if (typeof ciphertext !== "string") return ciphertext;
    const base64Regex = /^[A-Za-z0-9+/=\s]+$/;
    if (!base64Regex.test(ciphertext)) return ciphertext;
    const buf = Buffer.from(ciphertext, "base64");
    if (buf.length < IV_LENGTH + TAG_LENGTH + 1) return ciphertext;
    const iv = buf.slice(0, IV_LENGTH);
    const tag = buf.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = buf.slice(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (e) {
    // Decryption failed (likely plaintext stored). Return original ciphertext silently.
    return ciphertext;
  }
}
