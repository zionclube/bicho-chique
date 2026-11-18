import { ContaError, signup } from '@/lib/conta'
import { jsonError, originAllowed, sessionCookie } from '@/lib/http'
import { createSession } from '@/lib/session'

export async function POST(request: Request) {
  if (!originAllowed(request)) return jsonError(403, 'origem não permitida')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError(400, 'envie os dados em JSON')
  }

  try {
    const user = await signup(body)
    const session = await createSession(user.id)
    return Response.json(
      { user },
      {
        headers: {
          'Cache-Control': 'no-store',
          'Set-Cookie': sessionCookie(session.token, session.expiresAt, request),
        },
      },
    )
  } catch (error) {
    if (error instanceof ContaError) return jsonError(error.status, error.message)
    console.error('cadastro falhou')
    return jsonError(500, 'não foi possível concluir. tente de novo.')
  }
}
