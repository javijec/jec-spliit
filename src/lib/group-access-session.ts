import { env } from '@/lib/env'
import { createHmac } from 'crypto'

const TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export function getGroupAccessCookieName(groupId: string) {
  return `gacc_${groupId}`
}

function sign(groupId: string, accessPasswordHash: string, expiresAt: number) {
  return createHmac('sha256', env.GROUP_ACCESS_SECRET)
    .update(`${groupId}:${accessPasswordHash}:${expiresAt}`)
    .digest('hex')
}

export function createGroupAccessCookieValue(
  groupId: string,
  accessPasswordHash: string,
) {
  const expiresAt = Date.now() + TTL_MS
  const signature = sign(groupId, accessPasswordHash, expiresAt)
  return `${expiresAt}.${signature}`
}

export function isValidGroupAccessCookieValue(
  groupId: string,
  accessPasswordHash: string,
  rawValue?: string,
) {
  if (!rawValue) return false
  const [expiresAtRaw, signature] = rawValue.split('.')
  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(expiresAt) || !signature) return false
  if (Date.now() > expiresAt) return false
  return sign(groupId, accessPasswordHash, expiresAt) === signature
}
