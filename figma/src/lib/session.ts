import { createHmac, randomBytes } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import { getDb } from '../db/client'
import { sessions, users } from '../db/schema'
import { sessionSecret } from './secrets'

export const sessionCookieName = 'bicho_session'
const sessionMs = 7 * 24 * 60 * 60 * 1000

export function hashSessionToken(token: string) {
  return createHmac('sha256', sessionSecret()).update(token).digest('hex')
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + sessionMs)
  await getDb().insert(sessions).values({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
  })
  return { token, expiresAt }
}

export async function deleteSession(token: string) {
  await getDb().delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)))
}

export async function userFromToken(token: string) {
  const rows = await getDb()
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashSessionToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1)
  return rows[0]?.user ?? null
}
