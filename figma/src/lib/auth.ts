import { jsonError, readCookie } from './http'
import { sessionCookieName, userFromToken } from './session'

export async function requireUser(request: Request) {
  const token = readCookie(request, sessionCookieName)
  if (!token) return { ok: false as const, response: jsonError(401, 'faça login para continuar') }

  try {
    const user = await userFromToken(token)
    if (!user) return { ok: false as const, response: jsonError(401, 'faça login para continuar') }
    return { ok: true as const, user }
  } catch {
    console.error('sessão falhou')
    return { ok: false as const, response: jsonError(500, 'não foi possível concluir. tente de novo.') }
  }
}
