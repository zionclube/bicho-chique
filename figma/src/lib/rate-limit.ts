const windowMs = 15 * 60 * 1000
const maxFailures = 5

type Bucket = {
  failures: number
  windowStart: number
  lockedUntil: number
}

const buckets = new Map<string, Bucket>()

export function isRateLimited(key: string) {
  const bucket = buckets.get(key)
  return Boolean(bucket && bucket.lockedUntil > Date.now())
}

export function recordFailure(key: string) {
  const now = Date.now()
  const current = buckets.get(key)
  const expiredLock = current && current.lockedUntil > 0 && current.lockedUntil <= now
  const expiredWindow = current && now - current.windowStart > windowMs
  if (!current || expiredLock || expiredWindow) {
    buckets.set(key, { failures: 1, windowStart: now, lockedUntil: 0 })
    return
  }
  current.failures += 1
  if (current.failures >= maxFailures) {
    current.lockedUntil = now + windowMs
  }
}

export function clearFailures(key: string) {
  buckets.delete(key)
}
