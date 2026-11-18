import { requireAdmin } from '@/lib/auth'
import { getClient } from '@/lib/admin'
import { runJson } from '@/lib/http'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  return runJson(async () => ({ body: { client: await getClient(id) } }), 'consulta de cliente falhou')
}
