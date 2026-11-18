import { and, asc, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../db/client'
import {
  appointments,
  blockedIntervals,
  openingHours,
  pets,
  services,
  shopSettings,
  users,
} from '../db/schema'
import { listAppointments } from './agenda'
import { decryptCpf } from './cpf-crypto'
import { formatCpf } from './cpf'
import { listPets } from './pets'

export class AdminError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? 'dados inválidos'
}

function readableCpf(ciphertext: string | null) {
  if (!ciphertext) return null
  try {
    return formatCpf(decryptCpf(ciphertext))
  } catch {
    return null
  }
}

function isUniqueViolation(error: unknown, constraint: string) {
  const seen = new Set<unknown>()
  let current: unknown = error
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    const record = current as { code?: string; constraint_name?: string; cause?: unknown }
    if (record.code === '23505' && record.constraint_name === constraint) return true
    current = record.cause
  }
  return false
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

const textField = (emptyMessage: string) =>
  z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, ' '))
    .pipe(z.string().min(1, emptyMessage).max(80, 'texto longo demais'))

export async function listClients() {
  const rows = await getDb()
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      address: users.address,
      cpfCiphertext: users.cpfCiphertext,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, 'client'))
    .orderBy(asc(users.name))
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    cpf: readableCpf(row.cpfCiphertext),
    createdAt: row.createdAt,
  }))
}

export async function getClient(clientId: string) {
  if (!z.string().uuid().safeParse(clientId).success) throw new AdminError('cliente não encontrado', 404)
  const rows = await getDb()
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      address: users.address,
      cpfCiphertext: users.cpfCiphertext,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, clientId), eq(users.role, 'client')))
    .limit(1)
  const row = rows[0]
  if (!row) throw new AdminError('cliente não encontrado', 404)
  const [clientPets, clientAppointments] = await Promise.all([
    listPets(row.id),
    listAppointments(row.id),
  ])
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    cpf: readableCpf(row.cpfCiphertext),
    createdAt: row.createdAt,
    pets: clientPets,
    appointments: clientAppointments,
  }
}

export async function getPetRecord(petId: string) {
  if (!z.string().uuid().safeParse(petId).success) throw new AdminError('pet não encontrado', 404)
  const rows = await getDb()
    .select({
      id: pets.id,
      name: pets.name,
      species: pets.species,
      breed: pets.breed,
      size: pets.size,
      createdAt: pets.createdAt,
      clientId: users.id,
      clientName: users.name,
    })
    .from(pets)
    .innerJoin(users, eq(users.id, pets.clientId))
    .where(eq(pets.id, petId))
    .limit(1)
  const pet = rows[0]
  if (!pet) throw new AdminError('pet não encontrado', 404)
  const clientAppointments = await listAppointments(pet.clientId)
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    size: pet.size,
    createdAt: pet.createdAt,
    client: { id: pet.clientId, name: pet.clientName },
    appointments: clientAppointments.filter((appointment) => appointment.pet.id === pet.id),
  }
}

const serviceSchema = z.object({
  name: textField('informe o nome'),
  durationMinutes: z.number().int('informe os minutos inteiros').positive('informe a duração'),
})

function toService(row: typeof services.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    durationMinutes: row.durationMinutes,
    active: row.active,
  }
}

export async function listServices() {
  const rows = await getDb().select().from(services).orderBy(asc(services.name))
  return rows.map(toService)
}

export async function getService(serviceId: string) {
  if (!z.string().uuid().safeParse(serviceId).success) throw new AdminError('serviço não encontrado', 404)
  const rows = await getDb().select().from(services).where(eq(services.id, serviceId)).limit(1)
  const row = rows[0]
  if (!row) throw new AdminError('serviço não encontrado', 404)
  return toService(row)
}

export async function createService(input: unknown) {
  const parsed = serviceSchema.safeParse(input)
  if (!parsed.success) throw new AdminError(firstIssue(parsed.error), 400)
  try {
    const inserted = await getDb().insert(services).values(parsed.data).returning()
    const row = inserted[0]
    if (!row) throw new AdminError('não foi possível concluir. tente de novo.', 500)
    return toService(row)
  } catch (error) {
    if (error instanceof AdminError) throw error
    if (isUniqueViolation(error, 'services_name_unique')) {
      throw new AdminError('este serviço já existe', 409)
    }
    throw error
  }
}

export async function updateService(serviceId: string, input: unknown) {
  const parsed = serviceSchema
    .partial()
    .extend({ active: z.boolean().optional() })
    .refine((value) => Object.keys(value).length > 0, { message: 'informe o que deseja alterar' })
    .safeParse(input)
  if (!parsed.success) throw new AdminError(firstIssue(parsed.error), 400)
  await getService(serviceId)
  try {
    const updated = await getDb()
      .update(services)
      .set(parsed.data)
      .where(eq(services.id, serviceId))
      .returning()
    const row = updated[0]
    if (!row) throw new AdminError('serviço não encontrado', 404)
    return toService(row)
  } catch (error) {
    if (error instanceof AdminError) throw error
    if (isUniqueViolation(error, 'services_name_unique')) {
      throw new AdminError('este serviço já existe', 409)
    }
    throw error
  }
}

export async function deleteService(serviceId: string) {
  await getService(serviceId)
  const used = await getDb()
    .select({ value: count() })
    .from(appointments)
    .where(eq(appointments.serviceId, serviceId))
  if (Number(used[0]?.value ?? 0) > 0) {
    throw new AdminError('este serviço tem agendamentos e não pode ser apagado', 409)
  }
  try {
    const removed = await getDb()
      .delete(services)
      .where(eq(services.id, serviceId))
      .returning({ id: services.id })
    if (!removed[0]) throw new AdminError('serviço não encontrado', 404)
  } catch (error) {
    if (error instanceof AdminError) throw error
    if (isForeignKeyViolation(error)) {
      throw new AdminError('este serviço tem agendamentos e não pode ser apagado', 409)
    }
    throw error
  }
}

const blockSchema = z.object({
  startsAt: z.string().min(1, 'informe o início'),
  endsAt: z.string().min(1, 'informe o fim'),
  note: z.string().trim().max(200, 'texto longo demais').optional(),
})

function parseBlock(input: unknown) {
  const parsed = blockSchema.safeParse(input)
  if (!parsed.success) throw new AdminError(firstIssue(parsed.error), 400)
  const startsAt = new Date(parsed.data.startsAt)
  const endsAt = new Date(parsed.data.endsAt)
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt) {
    throw new AdminError('informe um intervalo válido', 400)
  }
  return {
    startsAt,
    endsAt,
    note: parsed.data.note ? parsed.data.note : null,
  }
}

export async function listBlocks() {
  const rows = await getDb().select().from(blockedIntervals).orderBy(asc(blockedIntervals.startsAt))
  return rows.map((row) => ({
    id: row.id,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    note: row.note,
  }))
}

export async function createBlock(input: unknown) {
  const value = parseBlock(input)
  const inserted = await getDb().insert(blockedIntervals).values(value).returning()
  const row = inserted[0]
  if (!row) throw new AdminError('não foi possível concluir. tente de novo.', 500)
  return { id: row.id, startsAt: row.startsAt, endsAt: row.endsAt, note: row.note }
}

export async function deleteBlock(blockId: string) {
  if (!z.string().uuid().safeParse(blockId).success) throw new AdminError('bloqueio não encontrado', 404)
  const removed = await getDb()
    .delete(blockedIntervals)
    .where(eq(blockedIntervals.id, blockId))
    .returning({ id: blockedIntervals.id })
  if (!removed[0]) throw new AdminError('bloqueio não encontrado', 404)
}

const settingsSchema = z.object({
  capacity: z.number().int('informe um número inteiro').min(1, 'a capacidade mínima é 1'),
  bufferMinutes: z.number().int('informe um número inteiro').min(0, 'a folga não pode ser negativa'),
})

export async function getSettings() {
  const rows = await getDb().select().from(shopSettings).where(eq(shopSettings.id, 1)).limit(1)
  const row = rows[0]
  if (!row) throw new AdminError('não foi possível concluir. tente de novo.', 500)
  return { capacity: row.capacity, bufferMinutes: row.bufferMinutes }
}

export async function updateSettings(input: unknown) {
  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) throw new AdminError(firstIssue(parsed.error), 400)
  const updated = await getDb()
    .update(shopSettings)
    .set(parsed.data)
    .where(eq(shopSettings.id, 1))
    .returning()
  const row = updated[0]
  if (!row) throw new AdminError('não foi possível concluir. tente de novo.', 500)
  return { capacity: row.capacity, bufferMinutes: row.bufferMinutes }
}

const shiftSchema = z.object({
  weekday: z.number().int().min(1, 'dia inválido').max(7, 'dia inválido'),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'horário inválido'),
  endsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'horário inválido'),
})

function minutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

export async function getOpeningHours() {
  const rows = await getDb().select().from(openingHours).orderBy(asc(openingHours.weekday), asc(openingHours.startsAt))
  return rows.map((row) => ({
    weekday: row.weekday,
    startsAt: row.startsAt.slice(0, 5),
    endsAt: row.endsAt.slice(0, 5),
  }))
}

export async function replaceOpeningHours(input: unknown) {
  const parsed = z.object({ shifts: z.array(shiftSchema) }).safeParse(input)
  if (!parsed.success) throw new AdminError(firstIssue(parsed.error), 400)
  const shifts = parsed.data.shifts.map((shift) => ({
    weekday: shift.weekday,
    startsAt: `${shift.startsAt}:00`,
    endsAt: `${shift.endsAt}:00`,
  }))
  for (const shift of shifts) {
    if (minutes(shift.startsAt) >= minutes(shift.endsAt)) {
      throw new AdminError('o turno precisa terminar depois de começar', 400)
    }
  }
  for (let index = 0; index < shifts.length; index += 1) {
    for (let other = index + 1; other < shifts.length; other += 1) {
      const left = shifts[index]
      const right = shifts[other]
      if (
        left.weekday === right.weekday &&
        minutes(left.startsAt) < minutes(right.endsAt) &&
        minutes(right.startsAt) < minutes(left.endsAt)
      ) {
        throw new AdminError('os turnos do mesmo dia se sobrepõem', 400)
      }
    }
  }

  await getDb().transaction(async (tx) => {
    await tx.delete(openingHours)
    if (shifts.length > 0) await tx.insert(openingHours).values(shifts)
  })
  return getOpeningHours()
}
