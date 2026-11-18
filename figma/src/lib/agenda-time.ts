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
