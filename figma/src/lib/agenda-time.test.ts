import assert from 'node:assert/strict'
import { test } from 'node:test'
import { agendaWindow, canClientCancel, classifySlot, saoPauloParts } from './agenda-time.ts'

const morning = [{ startsAt: '08:00:00', endsAt: '12:00:00' }]
const day = [
  { startsAt: '08:00:00', endsAt: '12:00:00' },
  { startsAt: '13:30:00', endsAt: '18:00:00' },
]

test('banho de 45 minutos na manhã pode começar até 11:15', () => {
  assert.equal(classifySlot(11 * 60 + 15, 45, morning), 'ok')
  assert.equal(classifySlot(11 * 60 + 16, 45, morning), 'overflow')
})

test('banho de 150 minutos na manhã pode começar até 09:30', () => {
  assert.equal(classifySlot(9 * 60 + 30, 150, morning), 'ok')
  assert.equal(classifySlot(9 * 60 + 31, 150, morning), 'overflow')
})

test('o serviço precisa terminar no mesmo turno', () => {
  assert.equal(classifySlot(11 * 60, 150, day), 'overflow')
  assert.equal(classifySlot(13 * 60 + 30, 45, day), 'ok')
  assert.equal(classifySlot(12 * 60 + 30, 45, day), 'closed')
})

test('domingo e o intervalo do almoço ficam fechados', () => {
  assert.equal(classifySlot(8 * 60, 45, []), 'closed')
})

test('08:00 em São Paulo cai na segunda de 23 nov 2026', () => {
  const parts = saoPauloParts(new Date('2026-11-23T11:00:00.000Z'))
  assert.equal(parts.weekday, 1)
  assert.equal(parts.hour, 8)
  assert.equal(parts.minute, 0)
  assert.equal(parts.second, 0)
})

test('o cliente cancela até 24 horas antes, inclusive no instante exato', () => {
  const start = new Date('2026-11-24T12:00:00.000Z')
  const limit = start.getTime() - 24 * 60 * 60 * 1000
  assert.equal(canClientCancel(start, 'marcado', limit), true)
  assert.equal(canClientCancel(start, 'confirmado', limit), true)
  assert.equal(canClientCancel(start, 'marcado', limit + 1), false)
  assert.equal(canClientCancel(start, 'cancelado', limit), false)
})

test('dia, semana e mês usam a meia-noite de São Paulo', () => {
  const day = agendaWindow('dia', '2026-11-23')
  assert.equal(day?.start.toISOString(), '2026-11-23T03:00:00.000Z')
  assert.equal(day?.end.toISOString(), '2026-11-24T03:00:00.000Z')
  const week = agendaWindow('semana', '2026-11-23')
  assert.equal(week?.start.toISOString(), '2026-11-23T03:00:00.000Z')
  assert.equal(week?.end.toISOString(), '2026-11-30T03:00:00.000Z')
  const month = agendaWindow('mes', '2026-11-23')
  assert.equal(month?.start.toISOString(), '2026-11-01T03:00:00.000Z')
  assert.equal(month?.end.toISOString(), '2026-12-01T03:00:00.000Z')
  assert.equal(agendaWindow('dia', '2026-02-31'), null)
})
