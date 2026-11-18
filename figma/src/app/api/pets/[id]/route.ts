import { requireUser } from '@/lib/auth'
import { jsonError, originAllowed } from '@/lib/http'
import { deletePet, getPet, PetError, updatePet } from '@/lib/pets'

function clientOnly(role: string) {
  if (role === 'client') return null
  return jsonError(403, 'esta ação é da conta do cliente')
}

async function clientFrom(request: Request) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth
  const denied = clientOnly(auth.user.role)
  if (denied) return { ok: false as const, response: denied }
  return auth
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await clientFrom(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params

  try {
    const pet = await getPet(auth.user.id, id)
    return Response.json({ pet }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof PetError) return jsonError(error.status, error.message)
    console.error('consulta de pet falhou')
    return jsonError(500, 'não foi possível concluir. tente de novo.')
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!originAllowed(request)) return jsonError(403, 'origem não permitida')
  const auth = await clientFrom(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError(400, 'envie os dados em JSON')
  }

  try {
    const pet = await updatePet(auth.user.id, id, body)
    return Response.json({ pet }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof PetError) return jsonError(error.status, error.message)
    console.error('alteração de pet falhou')
    return jsonError(500, 'não foi possível concluir. tente de novo.')
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!originAllowed(request)) return jsonError(403, 'origem não permitida')
  const auth = await clientFrom(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params

  try {
    await deletePet(auth.user.id, id)
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof PetError) return jsonError(error.status, error.message)
    console.error('remoção de pet falhou')
    return jsonError(500, 'não foi possível concluir. tente de novo.')
  }
}
