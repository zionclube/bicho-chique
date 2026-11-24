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

export async function requireAdmin(request: Request) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth
  if (auth.user.role !== 'admin') {
    return { ok: false as const, response: jsonError(403, 'esta ação é da administração') }
  }
  return auth
}
