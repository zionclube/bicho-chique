import { requireAdmin } from '@/lib/auth'
import { deleteService, getService, updateService } from '@/lib/admin'
import { jsonError, originAllowed, runJson } from '@/lib/http'

async function admin(request: Request) {
  if (!originAllowed(request)) return jsonError(403, 'origem não permitida')
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  return null
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  return runJson(async () => ({ body: { service: await getService(id) } }), 'consulta de serviço falhou')
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await admin(request)
  if (denied) return denied
  const { id } = await context.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError(400, 'envie os dados em JSON')
  }
  return runJson(async () => ({ body: { service: await updateService(id, body) } }), 'alteração de serviço falhou')
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await admin(request)
  if (denied) return denied
  const { id } = await context.params
  return runJson(async () => {
    await deleteService(id)
    return { body: { ok: true } }
  }, 'remoção de serviço falhou')
}
