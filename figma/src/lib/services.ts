import { asc, eq } from 'drizzle-orm'
import { getDb } from '../db/client'
import { services } from '../db/schema'

export async function listActiveServices() {
  return getDb()
    .select({
      id: services.id,
      name: services.name,
      durationMinutes: services.durationMinutes,
    })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.name))
}
