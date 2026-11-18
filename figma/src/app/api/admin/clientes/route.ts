import { requireAdmin } from '@/lib/auth'
import { listClients } from '@/lib/admin'
import { runJson } from '@/lib/http'

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  return runJson(async () => ({ body: { clients: await listClients() } }), 'lista de clientes falhou')
}
