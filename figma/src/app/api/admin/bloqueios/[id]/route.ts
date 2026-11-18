import { requireAdmin } from '@/lib/auth'
import { deleteBlock } from '@/lib/admin'
import { jsonError, originAllowed, runJson } from '@/lib/http'

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!originAllowed(request)) return jsonError(403, 'origem não permitida')
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  return runJson(async () => {
    await deleteBlock(id)
    return { body: { ok: true } }
  }, 'remoção de bloqueio falhou')
}
