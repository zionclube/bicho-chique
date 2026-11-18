import { requireAdmin } from '@/lib/auth'
import { adminCancelAppointment } from '@/lib/agenda'
import { jsonError, originAllowed, runJson } from '@/lib/http'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!originAllowed(request)) return jsonError(403, 'origem não permitida')
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  return runJson(async () => ({ body: { appointment: await adminCancelAppointment(id) } }), 'cancelamento falhou')
}
