function required(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

export function sessionSecret() {
  const value = required('SESSION_SECRET')
  if (value.length < 32) {
    throw new Error('SESSION_SECRET must have at least 32 characters')
  }
  return value
}

function key(name: string) {
  const bytes = Buffer.from(required(name), 'base64')
  if (bytes.length !== 32) {
    throw new Error(`${name} must be 32 bytes in base64`)
  }
  return bytes
}

export function cpfEncryptionKey() {
  return key('CPF_ENCRYPTION_KEY')
}

export function cpfHmacKey() {
  return key('CPF_HMAC_KEY')
}
