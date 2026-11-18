import { count } from 'drizzle-orm'
import { getDb } from './client'
import { openingHours, services, shopSettings } from './schema'

const initialServices = [
  { name: 'Banho, porte pequeno', durationMinutes: 45 },
  { name: 'Banho dermatológico', durationMinutes: 80 },
  { name: 'Banho, porte grande', durationMinutes: 150 },
  { name: 'Banho e tosa', durationMinutes: 90 },
]

const weekdayShifts = [
  { startsAt: '08:00:00', endsAt: '12:00:00' },
  { startsAt: '13:30:00', endsAt: '18:00:00' },
]

export async function seedShopDefaults() {
  const db = getDb()

  await db.insert(shopSettings).values({ id: 1, capacity: 1, bufferMinutes: 0 }).onConflictDoNothing()

  for (const service of initialServices) {
    await db.insert(services).values(service).onConflictDoNothing({ target: services.name })
  }

  const existingHours = await db.select({ value: count() }).from(openingHours)
  if (existingHours[0]?.value === 0) {
    const rows = [1, 2, 3, 4, 5].flatMap((weekday) =>
      weekdayShifts.map((shift) => ({ weekday, ...shift })),
    )
    await db.insert(openingHours).values(rows)
  }
}
