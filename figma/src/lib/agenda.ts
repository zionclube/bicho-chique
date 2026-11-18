import { and, asc, count, eq, gt, inArray, lt, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../db/client'
import { appointments, blockedIntervals, openingHours, pets, services, shopSettings, users } from '../db/schema'
import { agendaWindow, canClientCancel, classifySlot, saoPauloParts } from './agenda-time'

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

function overlapWhere(startsAt: Date, endsAt: Date, ignoreId?: string) {
  const filters = [
    inArray(appointments.status, ['marcado', 'confirmado']),
    lt(appointments.startsAt, endsAt),
    gt(appointments.endsAt, startsAt),
  ]
  if (ignoreId) filters.push(ne(appointments.id, ignoreId))
  return and(...filters)
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
      .where(overlapWhere(start.date, endsAt))
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

export type AdminAppointment = PublicAppointment & {
  client: { id: string; name: string; email: string }
  pet: PublicAppointment['pet'] & { size: 'pequeno' | 'medio' | 'grande' }
}

function toAdminAppointment(row: {
  id: string
  startsAt: Date
  endsAt: Date
  status: 'marcado' | 'confirmado' | 'cancelado'
  clientId: string
  clientName: string
  clientEmail: string
  petId: string
  petName: string
  petSize: 'pequeno' | 'medio' | 'grande'
  serviceId: string
  serviceName: string
  durationMinutes: number
}): AdminAppointment {
  return {
    ...toPublicAppointment({
      id: row.id,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      status: row.status,
      petId: row.petId,
      petName: row.petName,
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      durationMinutes: row.durationMinutes,
    }),
    client: { id: row.clientId, name: row.clientName, email: row.clientEmail },
    pet: { id: row.petId, name: row.petName, size: row.petSize },
  }
}

const adminAppointmentSelect = {
  id: appointments.id,
  startsAt: appointments.startsAt,
  endsAt: appointments.endsAt,
  status: appointments.status,
  clientId: users.id,
  clientName: users.name,
  clientEmail: users.email,
  petId: pets.id,
  petName: pets.name,
  petSize: pets.size,
  serviceId: services.id,
  serviceName: services.name,
  durationMinutes: services.durationMinutes,
}

function adminAppointmentQuery() {
  return getDb()
    .select(adminAppointmentSelect)
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.clientId))
    .innerJoin(pets, eq(pets.id, appointments.petId))
    .innerJoin(services, eq(services.id, appointments.serviceId))
}

async function loadAdminAppointment(appointmentId: string) {
  if (!z.string().uuid().safeParse(appointmentId).success) {
    throw new AgendaError('agendamento não encontrado', 404)
  }
  const rows = await adminAppointmentQuery().where(eq(appointments.id, appointmentId)).limit(1)
  const row = rows[0]
  if (!row) throw new AgendaError('agendamento não encontrado', 404)
  return toAdminAppointment(row)
}

export async function listAgenda(view: string, date: string) {
  if (view !== 'dia' && view !== 'semana' && view !== 'mes') {
    throw new AgendaError('informe o dia, a semana ou o mês', 400)
  }
  const window = agendaWindow(view, date)
  if (!window) throw new AgendaError('data inválida', 400)
  const rows = await adminAppointmentQuery()
    .where(and(lt(appointments.startsAt, window.end), gt(appointments.endsAt, window.start)))
    .orderBy(asc(appointments.startsAt))
  return {
    from: window.start,
    until: window.end,
    appointments: rows.map(toAdminAppointment),
  }
}

export async function confirmAppointment(appointmentId: string) {
  const current = await loadAdminAppointment(appointmentId)
  if (current.status === 'confirmado') throw new AgendaError('este agendamento já está confirmado', 409)
  if (current.status === 'cancelado') throw new AgendaError('agendamento cancelado não pode ser confirmado', 409)
  const updated = await getDb()
    .update(appointments)
    .set({ status: 'confirmado' })
    .where(and(eq(appointments.id, appointmentId), eq(appointments.status, 'marcado')))
    .returning({ id: appointments.id })
  if (!updated[0]) throw new AgendaError('este agendamento já está confirmado', 409)
  return loadAdminAppointment(appointmentId)
}

export async function adminCancelAppointment(appointmentId: string) {
  const current = await loadAdminAppointment(appointmentId)
  if (current.status === 'cancelado') throw new AgendaError('este agendamento já está cancelado', 409)
  const updated = await getDb()
    .update(appointments)
    .set({ status: 'cancelado' })
    .where(
      and(eq(appointments.id, appointmentId), inArray(appointments.status, ['marcado', 'confirmado'])),
    )
    .returning({ id: appointments.id })
  if (!updated[0]) throw new AgendaError('este agendamento já está cancelado', 409)
  return loadAdminAppointment(appointmentId)
}

export async function rescheduleAppointment(appointmentId: string, startsAt: string) {
  if (!z.string().uuid().safeParse(appointmentId).success) {
    throw new AgendaError('agendamento não encontrado', 404)
  }
  const start = parseStart(startsAt)
  await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(pg_catalog.hashtext('bicho_chique_agenda')::bigint)`)
    const currentRows = await tx.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1)
    const current = currentRows[0]
    if (!current) throw new AgendaError('agendamento não encontrado', 404)
    if (current.status === 'cancelado') throw new AgendaError('agendamento cancelado não pode ser remarcado', 409)

    const serviceRows = await tx.select().from(services).where(eq(services.id, current.serviceId)).limit(1)
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
      .where(overlapWhere(start.date, endsAt, appointmentId))
    if (Number(overlapping[0]?.value ?? 0) >= settings.capacity) {
      throw new AgendaError('esse horário não está livre', 409)
    }

    await tx
      .update(appointments)
      .set({ startsAt: start.date, endsAt })
      .where(eq(appointments.id, appointmentId))
  })
  return loadAdminAppointment(appointmentId)
}
