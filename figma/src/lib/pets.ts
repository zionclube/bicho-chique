import { and, asc, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../db/client'
import { appointments, pets } from '../db/schema'

const sizeField = z.enum(['pequeno', 'medio', 'grande'], {
  errorMap: () => ({ message: 'porte inválido. use pequeno, medio ou grande.' }),
})

function textField(emptyMessage: string) {
  return z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, ' '))
    .pipe(z.string().min(1, emptyMessage).max(80, 'texto longo demais'))
}

export const petSchema = z.object({
  name: textField('informe o nome'),
  species: textField('informe a espécie'),
  breed: textField('informe a raça'),
  size: sizeField,
})

export const petPatchSchema = petSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'informe o que deseja alterar',
})

export class PetError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export type PublicPet = {
  id: string
  name: string
  species: string
  breed: string
  size: 'pequeno' | 'medio' | 'grande'
  createdAt: Date
}

function toPublicPet(pet: typeof pets.$inferSelect): PublicPet {
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    size: pet.size,
    createdAt: pet.createdAt,
  }
}

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? 'dados inválidos'
}

function isInvalidUuid(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '22P02'
}

function isForeignKeyViolation(error: unknown) {
  const seen = new Set<unknown>()
  let current: unknown = error
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    const record = current as { code?: string; cause?: unknown }
    if (record.code === '23503') return true
    current = record.cause
  }
  return false
}

async function ownedPet(clientId: string, petId: string) {
  if (!z.string().uuid().safeParse(petId).success) {
    throw new PetError('pet não encontrado', 404)
  }
  try {
    const rows = await getDb()
      .select()
      .from(pets)
      .where(and(eq(pets.id, petId), eq(pets.clientId, clientId)))
      .limit(1)
    const pet = rows[0]
    if (!pet) throw new PetError('pet não encontrado', 404)
    return pet
  } catch (error) {
    if (error instanceof PetError) throw error
    if (isInvalidUuid(error)) throw new PetError('pet não encontrado', 404)
    throw error
  }
}

export async function createPet(clientId: string, input: unknown) {
  const parsed = petSchema.safeParse(input)
  if (!parsed.success) throw new PetError(firstIssue(parsed.error), 400)

  const inserted = await getDb()
    .insert(pets)
    .values({ clientId, ...parsed.data })
    .returning()
  const pet = inserted[0]
  if (!pet) throw new PetError('não foi possível concluir. tente de novo.', 500)
  return toPublicPet(pet)
}

export async function listPets(clientId: string) {
  const rows = await getDb()
    .select()
    .from(pets)
    .where(eq(pets.clientId, clientId))
    .orderBy(asc(pets.createdAt), asc(pets.name))
  return rows.map(toPublicPet)
}

export async function getPet(clientId: string, petId: string) {
  return toPublicPet(await ownedPet(clientId, petId))
}

export async function updatePet(clientId: string, petId: string, input: unknown) {
  const parsed = petPatchSchema.safeParse(input)
  if (!parsed.success) throw new PetError(firstIssue(parsed.error), 400)
  await ownedPet(clientId, petId)

  const updated = await getDb()
    .update(pets)
    .set(parsed.data)
    .where(and(eq(pets.id, petId), eq(pets.clientId, clientId)))
    .returning()
  const pet = updated[0]
  if (!pet) throw new PetError('pet não encontrado', 404)
  return toPublicPet(pet)
}

export async function deletePet(clientId: string, petId: string) {
  await ownedPet(clientId, petId)
  const used = await getDb()
    .select({ value: count() })
    .from(appointments)
    .where(eq(appointments.petId, petId))
  if ((used[0]?.value ?? 0) > 0) {
    throw new PetError('este pet tem agendamentos e não pode ser apagado', 409)
  }

  try {
    const removed = await getDb()
      .delete(pets)
      .where(and(eq(pets.id, petId), eq(pets.clientId, clientId)))
      .returning({ id: pets.id })
    if (!removed[0]) throw new PetError('pet não encontrado', 404)
  } catch (error) {
    if (error instanceof PetError) throw error
    if (isForeignKeyViolation(error)) {
      throw new PetError('este pet tem agendamentos e não pode ser apagado', 409)
    }
    throw error
  }
}
