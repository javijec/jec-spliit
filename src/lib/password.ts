import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const KEY_LENGTH = 64

export function hashPassword(password: string) {
  const normalized = password.trim()
  if (!normalized.length) throw new Error('Password is required')
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(normalized, salt, KEY_LENGTH).toString('hex')
  return `s2$${salt}$${hash}`
}

export function verifyPassword(password: string, storedHash: string) {
  const normalized = password.trim()
  const [algo, salt, hash] = storedHash.split('$')
  if (algo !== 's2' || !salt || !hash) return false
  const computedHashBuffer = scryptSync(normalized, salt, KEY_LENGTH)
  const storedHashBuffer = Buffer.from(hash, 'hex')
  if (computedHashBuffer.length !== storedHashBuffer.length) return false
  return timingSafeEqual(
    new Uint8Array(computedHashBuffer),
    new Uint8Array(storedHashBuffer),
  )
}
