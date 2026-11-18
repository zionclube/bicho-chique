import { toPublicUser } from '@/lib/conta'
import { jsonError, readCookie } from '@/lib/http'
import { sessionCookieName, userFromToken } from '@/lib/session'

export async function GET(request: Request) {
  const token = readCookie(request, sessionCookieName)
  if (!token) return jsonError(401, 'faça login para continuar')

  try {
    const user = await userFromToken(token)
    if (!user) return jsonError(401, 'faça login para continuar')
    return Response.json({ user: toPublicUser(user) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    console.error('sessão falhou')
    return jsonError(500, 'não foi possível concluir. tente de novo.')
  }
}
