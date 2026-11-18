import { sessionCookieName } from './session'

export function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function originAllowed(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  const host = request.headers.get('host')
  if (!host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export function isHttps(request: Request) {
  const forwarded = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  if (forwarded) return forwarded === 'https'
  return new URL(request.url).protocol === 'https:'
}

export function readCookie(request: Request, name: string) {
  const header = request.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

export function sessionCookie(token: string, expiresAt: Date, request: Request) {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
  const parts = [
    `${sessionCookieName}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ]
  if (isHttps(request)) parts.push('Secure')
  return parts.join('; ')
}

export function clearSessionCookie() {
  return `${sessionCookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
}

export async function runJson(run: () => Promise<{ status?: number; body: unknown }>, label: string) {
  try {
    const result = await run()
    return Response.json(result.body, {
      status: result.status ?? 200,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof Error && 'status' in error && typeof error.status === 'number') {
      return jsonError(error.status, error.message)
    }
    console.error(label)
    return jsonError(500, 'não foi possível concluir. tente de novo.')
  }
}
