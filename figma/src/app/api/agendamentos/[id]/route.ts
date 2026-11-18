import { requireUser } from '@/lib/auth'
import { AgendaError, getAppointment } from '@/lib/agenda'
import { jsonError } from '@/lib/http'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response
  if (auth.user.role !== 'client') return jsonError(403, 'esta ação é da conta do cliente')
  const { id } = await context.params

  try {
    const appointment = await getAppointment(auth.user.id, id)
    return Response.json({ appointment }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof AgendaError) return jsonError(error.status, error.message)
    console.error('consulta de agendamento falhou')
    return jsonError(500, 'não foi possível concluir. tente de novo.')
  }
}
