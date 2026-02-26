import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)")
  }
  return Buffer.from(key, "hex")
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`
}

export function decrypt(encryptedString: string): string {
  const [ivB64, tagB64, ciphertextB64] = encryptedString.split(":")
  const iv = Buffer.from(ivB64, "base64")
  const tag = Buffer.from(tagB64, "base64")
  const ciphertext = Buffer.from(ciphertextB64, "base64")
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(tag)
  return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8")
}
