import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Database = ReturnType<typeof drizzle<typeof schema>>

let database: Database | undefined
let client: ReturnType<typeof postgres> | undefined

export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  if (!database || !client) {
    client = postgres(url, { max: 10 })
    database = drizzle(client, { schema })
  }
  return database
}

export async function closeDb() {
  await client?.end({ timeout: 5 })
  client = undefined
  database = undefined
}
