import { requireUser } from '@/lib/auth'
import { jsonError } from '@/lib/http'
import { listActiveServices } from '@/lib/services'

export async function GET(request: Request) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response

  try {
    const services = await listActiveServices()
    return Response.json({ services }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    console.error('lista de serviços falhou')
    return jsonError(500, 'não foi possível concluir. tente de novo.')
  }
}
