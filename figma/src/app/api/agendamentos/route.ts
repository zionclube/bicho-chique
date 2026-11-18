import { requireUser } from '@/lib/auth'
import { AgendaError, createAppointment, listAppointments } from '@/lib/agenda'
import { jsonError, originAllowed } from '@/lib/http'

function clientOnly(role: string) {
  if (role === 'client') return null
  return jsonError(403, 'esta ação é da conta do cliente')
}

export async function GET(request: Request) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response
  const denied = clientOnly(auth.user.role)
  if (denied) return denied

  try {
    const appointments = await listAppointments(auth.user.id)
    return Response.json({ appointments }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    console.error('lista de agendamentos falhou')
    return jsonError(500, 'não foi possível concluir. tente de novo.')
  }
}

export async function POST(request: Request) {
  if (!originAllowed(request)) return jsonError(403, 'origem não permitida')
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response
  const denied = clientOnly(auth.user.role)
  if (denied) return denied

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError(400, 'envie os dados em JSON')
  }

  try {
    const appointment = await createAppointment(auth.user.id, body)
    return Response.json({ appointment }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof AgendaError) return jsonError(error.status, error.message)
    console.error('agendamento falhou')
    return jsonError(500, 'não foi possível concluir. tente de novo.')
  }
}
