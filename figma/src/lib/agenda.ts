import { and, asc, count, eq, gt, inArray, lt, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../db/client'
import { appointments, blockedIntervals, openingHours, pets, services, shopSettings } from '../db/schema'
import { canClientCancel, classifySlot, saoPauloParts } from './agenda-time'

const bookingSchema = z.object({
  petId: z.string().uuid('informe o pet'),
  serviceId: z.string().uuid('informe o serviço'),
  startsAt: z.string().min(1, 'informe o horário'),
})

export class AgendaError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export type PublicAppointment = {
  id: string
  startsAt: Date
  endsAt: Date
  status: 'marcado' | 'confirmado' | 'cancelado'
  canCancel: boolean
  pet: { id: string; name: string }
  service: { id: string; name: string; durationMinutes: number }
}

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? 'dados inválidos'
}

function parseStart(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new AgendaError('horário inválido', 400)
  if (date.getMilliseconds() !== 0) throw new AgendaError('escolha um minuto cheio', 400)
  const parts = saoPauloParts(date)
  if (!parts.weekday) throw new AgendaError('horário inválido', 400)
  if (parts.second !== 0) throw new AgendaError('escolha um minuto cheio', 400)
  if (date.getTime() <= Date.now()) throw new AgendaError('escolha um horário futuro', 400)
  return { date, weekday: parts.weekday, minutes: parts.minutes }
}

async function loadAppointment(clientId: string, appointmentId: string) {
  if (!z.string().uuid().safeParse(appointmentId).success) {
    throw new AgendaError('agendamento não encontrado', 404)
  }
  const rows = await getDb()
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      status: appointments.status,
      petId: pets.id,
      petName: pets.name,
      serviceId: services.id,
      serviceName: services.name,
      durationMinutes: services.durationMinutes,
    })
    .from(appointments)
    .innerJoin(pets, eq(pets.id, appointments.petId))
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .where(and(eq(appointments.id, appointmentId), eq(appointments.clientId, clientId)))
    .limit(1)
  const row = rows[0]
  if (!row) throw new AgendaError('agendamento não encontrado', 404)
  return toPublicAppointment(row)
}

function toPublicAppointment(row: {
  id: string
  startsAt: Date
  endsAt: Date
  status: 'marcado' | 'confirmado' | 'cancelado'
  petId: string
  petName: string
  serviceId: string
  serviceName: string
  durationMinutes: number
}): PublicAppointment {
  return {
    id: row.id,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    status: row.status,
    canCancel: canClientCancel(row.startsAt, row.status),
    pet: { id: row.petId, name: row.petName },
    service: { id: row.serviceId, name: row.serviceName, durationMinutes: row.durationMinutes },
  }
}

export async function listAppointments(clientId: string) {
  const rows = await getDb()
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      status: appointments.status,
      petId: pets.id,
      petName: pets.name,
      serviceId: services.id,
      serviceName: services.name,
      durationMinutes: services.durationMinutes,
    })
    .from(appointments)
    .innerJoin(pets, eq(pets.id, appointments.petId))
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .where(eq(appointments.clientId, clientId))
    .orderBy(asc(appointments.startsAt))
  return rows.map(toPublicAppointment)
}

export async function getAppointment(clientId: string, appointmentId: string) {
  return loadAppointment(clientId, appointmentId)
}

export async function createAppointment(clientId: string, input: unknown) {
  const parsed = bookingSchema.safeParse(input)
  if (!parsed.success) throw new AgendaError(firstIssue(parsed.error), 400)
  const start = parseStart(parsed.data.startsAt)

  const appointmentId = await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(pg_catalog.hashtext('bicho_chique_agenda')::bigint)`)

    const petRows = await tx
      .select({ id: pets.id })
      .from(pets)
      .where(and(eq(pets.id, parsed.data.petId), eq(pets.clientId, clientId)))
      .limit(1)
    if (!petRows[0]) throw new AgendaError('pet não encontrado', 404)

    const serviceRows = await tx
      .select()
      .from(services)
      .where(and(eq(services.id, parsed.data.serviceId), eq(services.active, true)))
      .limit(1)
    const service = serviceRows[0]
    if (!service) throw new AgendaError('serviço não encontrado', 404)

    const settingsRows = await tx.select().from(shopSettings).where(eq(shopSettings.id, 1)).limit(1)
    const settings = settingsRows[0]
    if (!settings) throw new AgendaError('não foi possível concluir. tente de novo.', 500)

    const occupied = service.durationMinutes + settings.bufferMinutes
    const shifts = await tx.select().from(openingHours).where(eq(openingHours.weekday, start.weekday))
    const fit = classifySlot(start.minutes, occupied, shifts)
    if (fit === 'closed') throw new AgendaError('a loja está fechada nesse horário', 400)
    if (fit === 'overflow') throw new AgendaError('esse serviço não termina dentro do expediente', 400)

    const endsAt = new Date(start.date.getTime() + occupied * 60_000)
    const blocked = await tx
      .select({ value: count() })
      .from(blockedIntervals)
      .where(and(lt(blockedIntervals.startsAt, endsAt), gt(blockedIntervals.endsAt, start.date)))
    if (Number(blocked[0]?.value ?? 0) > 0) throw new AgendaError('esse horário está bloqueado', 409)

    const overlapping = await tx
      .select({ value: count() })
      .from(appointments)
      .where(
        and(
          inArray(appointments.status, ['marcado', 'confirmado']),
          lt(appointments.startsAt, endsAt),
          gt(appointments.endsAt, start.date),
        ),
      )
    if (Number(overlapping[0]?.value ?? 0) >= settings.capacity) {
      throw new AgendaError('esse horário não está livre', 409)
    }

    const inserted = await tx
      .insert(appointments)
      .values({
        clientId,
        petId: parsed.data.petId,
        serviceId: service.id,
        startsAt: start.date,
        endsAt,
        status: 'marcado',
      })
      .returning({ id: appointments.id })
    const id = inserted[0]?.id
    if (!id) throw new AgendaError('não foi possível concluir. tente de novo.', 500)
    return id
  })

  return loadAppointment(clientId, appointmentId)
}

export async function cancelAppointment(clientId: string, appointmentId: string) {
  const current = await loadAppointment(clientId, appointmentId)
  if (current.status === 'cancelado') throw new AgendaError('este agendamento já está cancelado', 409)
  if (!current.canCancel) throw new AgendaError('só é possível cancelar até 24 horas antes', 403)

  const updated = await getDb()
    .update(appointments)
    .set({ status: 'cancelado' })
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.clientId, clientId),
        inArray(appointments.status, ['marcado', 'confirmado']),
      ),
    )
    .returning({ id: appointments.id })
  if (!updated[0]) throw new AgendaError('este agendamento já está cancelado', 409)
  return loadAppointment(clientId, appointmentId)
}
