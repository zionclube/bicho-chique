import { requireUser } from '@/lib/auth'
import { AgendaError, cancelAppointment } from '@/lib/agenda'
import { jsonError, originAllowed } from '@/lib/http'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!originAllowed(request)) return jsonError(403, 'origem não permitida')
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response
  if (auth.user.role !== 'client') return jsonError(403, 'esta ação é da conta do cliente')
  const { id } = await context.params

  try {
    const appointment = await cancelAppointment(auth.user.id, id)
    return Response.json({ appointment }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof AgendaError) return jsonError(error.status, error.message)
    console.error('cancelamento falhou')
    return jsonError(500, 'não foi possível concluir. tente de novo.')
  }
}
