import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const userRole = pgEnum('user_role', ['client', 'admin'])
export const petSize = pgEnum('pet_size', ['pequeno', 'medio', 'grande'])
export const appointmentStatus = pgEnum('appointment_status', [
  'marcado',
  'confirmado',
  'cancelado',
])

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    role: userRole('role').notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    cpfCiphertext: text('cpf_ciphertext'),
    cpfHmac: text('cpf_hmac'),
    address: text('address'),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('users_email_unique').on(table.email),
    uniqueIndex('users_cpf_hmac_unique').on(table.cpfHmac),
    check(
      'users_client_has_required_fields',
      sql`${table.role} <> 'client' OR (${table.phone} IS NOT NULL AND ${table.cpfHmac} IS NOT NULL AND ${table.cpfCiphertext} IS NOT NULL AND ${table.address} IS NOT NULL)`,
    ),
  ],
)

export const pets = pgTable('pets', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  species: text('species').notNull(),
  breed: text('breed').notNull(),
  size: petSize('size').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('services_name_unique').on(table.name),
    check('services_duration_positive', sql`${table.durationMinutes} > 0`),
  ],
)

export const shopSettings = pgTable(
  'shop_settings',
  {
    id: integer('id').primaryKey().default(1),
    capacity: integer('capacity').notNull().default(1),
    bufferMinutes: integer('buffer_minutes').notNull().default(0),
  },
  (table) => [
    check('shop_settings_singleton', sql`${table.id} = 1`),
    check('shop_settings_capacity_positive', sql`${table.capacity} >= 1`),
    check('shop_settings_buffer_non_negative', sql`${table.bufferMinutes} >= 0`),
  ],
)

export const openingHours = pgTable(
  'opening_hours',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    weekday: integer('weekday').notNull(),
    startsAt: time('starts_at').notNull(),
    endsAt: time('ends_at').notNull(),
  },
  (table) => [
    check('opening_hours_weekday', sql`${table.weekday} BETWEEN 1 AND 7`),
    check('opening_hours_order', sql`${table.startsAt} < ${table.endsAt}`),
  ],
)

export const blockedIntervals = pgTable(
  'blocked_intervals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('blocked_intervals_order', sql`${table.startsAt} < ${table.endsAt}`)],
)

export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => users.id),
    petId: uuid('pet_id')
      .notNull()
      .references(() => pets.id),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    status: appointmentStatus('status').notNull().default('marcado'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('appointments_order', sql`${table.startsAt} < ${table.endsAt}`)],
)

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('sessions_token_hash_unique').on(table.tokenHash)],
)

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('password_reset_tokens_token_hash_unique').on(table.tokenHash)],
)
