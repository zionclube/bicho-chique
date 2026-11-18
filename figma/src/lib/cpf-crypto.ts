import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto'
import { cpfEncryptionKey, cpfHmacKey } from './secrets'

export function encryptCpf(digits: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', cpfEncryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(digits, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.')
}

export function decryptCpf(stored: string) {
  const [version, iv, tag, ciphertext] = stored.split('.')
  if (version !== 'v1' || !iv || !tag || !ciphertext) {
    throw new Error('CPF ciphertext is not readable')
  }
  const decipher = createDecipheriv('aes-256-gcm', cpfEncryptionKey(), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  const plain = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ])
  return plain.toString('utf8')
}

export function hmacCpf(digits: string) {
  return createHmac('sha256', cpfHmacKey()).update(digits).digest('hex')
}
