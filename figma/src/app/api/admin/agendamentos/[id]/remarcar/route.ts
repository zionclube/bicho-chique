import { requireAdmin } from '@/lib/auth'
import { rescheduleAppointment } from '@/lib/agenda'
import { jsonError, originAllowed, runJson } from '@/lib/http'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!originAllowed(request)) return jsonError(403, 'origem não permitida')
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError(400, 'envie os dados em JSON')
  }
  const startsAt = typeof body === 'object' && body && 'startsAt' in body ? String(body.startsAt ?? '') : ''
  return runJson(
    async () => ({ body: { appointment: await rescheduleAppointment(id, startsAt) } }),
    'remarcação falhou',
  )
}
