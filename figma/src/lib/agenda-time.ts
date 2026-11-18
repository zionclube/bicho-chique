const weekdayNumber: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
}

export type Shift = {
  startsAt: string
  endsAt: string
}

export type SlotFit = 'ok' | 'closed' | 'overflow'

export function saoPauloParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  const weekday = weekdayNumber[read('weekday')]
  let hour = Number(read('hour'))
  if (hour === 24) hour = 0
  const minute = Number(read('minute'))
  const second = Number(read('second'))
  return { weekday, hour, minute, second, minutes: hour * 60 + minute }
}

export function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

export function classifySlot(startMinutes: number, occupiedMinutes: number, shifts: Shift[]): SlotFit {
  const endMinutes = startMinutes + occupiedMinutes
  const startInside = shifts.some((shift) => {
    const start = timeToMinutes(shift.startsAt)
    const end = timeToMinutes(shift.endsAt)
    return startMinutes >= start && startMinutes < end
  })
  const fits = shifts.some((shift) => {
    const start = timeToMinutes(shift.startsAt)
    const end = timeToMinutes(shift.endsAt)
    return startMinutes >= start && endMinutes <= end && startMinutes < end
  })
  if (fits && occupiedMinutes > 0 && endMinutes <= 24 * 60) return 'ok'
  if (startInside) return 'overflow'
  return 'closed'
}

const dayMs = 24 * 60 * 60 * 1000

export function canClientCancel(startsAt: Date, status: string, now = Date.now()) {
  if (status !== 'marcado' && status !== 'confirmado') return false
  return now <= startsAt.getTime() - dayMs
}

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const probe = new Date(Date.UTC(year, month - 1, day))
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day
}

function addCalendarDays(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + days))
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`
}

function saoPauloMidnight(value: string) {
  return new Date(`${value}T00:00:00-03:00`)
}

export function agendaWindow(view: 'dia' | 'semana' | 'mes', date: string) {
  if (!isCalendarDate(date)) return null
  if (view === 'dia') {
    return { start: saoPauloMidnight(date), end: saoPauloMidnight(addCalendarDays(date, 1)) }
  }
  if (view === 'semana') {
    const weekday = saoPauloParts(new Date(`${date}T12:00:00-03:00`)).weekday
    if (!weekday) return null
    const monday = addCalendarDays(date, 1 - weekday)
    return { start: saoPauloMidnight(monday), end: saoPauloMidnight(addCalendarDays(monday, 7)) }
  }
  if (view === 'mes') {
    const [year, month] = date.split('-').map(Number)
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`
    return { start: saoPauloMidnight(start), end: saoPauloMidnight(nextMonth) }
  }
  return null
}
