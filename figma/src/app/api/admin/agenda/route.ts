import { requireAdmin } from '@/lib/auth'
import { listAgenda } from '@/lib/agenda'
import { jsonError, runJson } from '@/lib/http'

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const url = new URL(request.url)
  return runJson(
    async () => ({ body: await listAgenda(url.searchParams.get('visao') ?? '', url.searchParams.get('data') ?? '') }),
    'agenda falhou',
  )
}
