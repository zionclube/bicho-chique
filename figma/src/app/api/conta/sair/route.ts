import { clearSessionCookie, jsonError, originAllowed, readCookie } from '@/lib/http'
import { deleteSession, sessionCookieName } from '@/lib/session'

export async function POST(request: Request) {
  if (!originAllowed(request)) return jsonError(403, 'origem não permitida')

  const token = readCookie(request, sessionCookieName)
  if (token) {
    try {
      await deleteSession(token)
    } catch {
      console.error('logout falhou')
    }
  }

  return Response.json(
    { ok: true },
    { headers: { 'Cache-Control': 'no-store', 'Set-Cookie': clearSessionCookie() } },
  )
}
