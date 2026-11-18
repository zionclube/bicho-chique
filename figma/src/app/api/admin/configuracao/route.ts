import { requireAdmin } from '@/lib/auth'
import { getSettings, updateSettings } from '@/lib/admin'
import { jsonError, originAllowed, runJson } from '@/lib/http'

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  return runJson(async () => ({ body: await getSettings() }), 'configuração falhou')
}

export async function PUT(request: Request) {
  if (!originAllowed(request)) return jsonError(403, 'origem não permitida')
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError(400, 'envie os dados em JSON')
  }
  return runJson(async () => ({ body: await updateSettings(body) }), 'configuração falhou')
}
