import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../db/client'
import { users } from '../db/schema'
import { decryptCpf, encryptCpf, hmacCpf } from './cpf-crypto'
import { isValidCpf, maskCpf, onlyDigits } from './cpf'
import { hashPassword, verifyPassword } from './password'
import { clearFailures, isRateLimited, recordFailure } from './rate-limit'

const emailField = z
  .string()
  .trim()
  .email('informe um e-mail válido')
  .max(254)
  .transform((value) => value.toLowerCase())

export const signupSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, ' '))
    .pipe(z.string().min(2, 'informe o nome').max(120, 'nome longo demais')),
  email: emailField,
  phone: z
    .string()
    .transform(onlyDigits)
    .pipe(z.string().regex(/^\d{10,11}$/, 'informe um telefone com DDD')),
  cpf: z
    .string()
    .transform(onlyDigits)
    .pipe(z.string().refine(isValidCpf, 'CPF inválido')),
  address: z.string().trim().min(1, 'informe o endereço').max(300, 'endereço longo demais'),
  password: z
    .string()
    .min(8, 'a senha precisa ter pelo menos 8 caracteres')
    .max(128, 'senha longa demais'),
})

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'informe a senha').max(128),
})

export class ContaError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

type UserRow = typeof users.$inferSelect

export type PublicUser = {
  id: string
  role: 'client' | 'admin'
  name: string
  email: string
  phone: string | null
  address: string | null
  cpfMasked: string | null
}

export function toPublicUser(user: UserRow, knownDigits?: string): PublicUser {
  let cpfMasked: string | null = null
  if (knownDigits) {
    cpfMasked = maskCpf(knownDigits)
  } else if (user.cpfCiphertext) {
    try {
      cpfMasked = maskCpf(decryptCpf(user.cpfCiphertext))
    } catch {
      cpfMasked = null
    }
  }
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    cpfMasked,
  }
}

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? 'dados inválidos'
}

function uniqueConstraint(error: unknown) {
  const seen = new Set<unknown>()
  let current: unknown = error
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    const record = current as { code?: string; constraint_name?: string; cause?: unknown }
    if (record.code === '23505' && record.constraint_name) return record.constraint_name
    current = record.cause
  }
  return undefined
}

let dummyHash: Promise<string> | undefined

function dummyPasswordHash() {
  dummyHash ??= hashPassword('dummy-password-not-a-login')
  return dummyHash
}

export async function signup(input: unknown) {
  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) throw new ContaError(firstIssue(parsed.error), 400)

  const data = parsed.data
  const limitKey = `signup:${data.email}`
  if (isRateLimited(limitKey)) {
    throw new ContaError('muitas tentativas. espere 15 minutos.', 429)
  }

  const passwordHash = await hashPassword(data.password)
  try {
    const inserted = await getDb()
      .insert(users)
      .values({
        role: 'client',
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        cpfCiphertext: encryptCpf(data.cpf),
        cpfHmac: hmacCpf(data.cpf),
        passwordHash,
      })
      .returning()
    const user = inserted[0]
    if (!user) throw new ContaError('não foi possível concluir. tente de novo.', 500)
    clearFailures(limitKey)
    return toPublicUser(user, data.cpf)
  } catch (error) {
    if (error instanceof ContaError) throw error
    const constraint = uniqueConstraint(error)
    if (constraint === 'users_email_unique') {
      recordFailure(limitKey)
      throw new ContaError('este e-mail já está cadastrado', 409)
    }
    if (constraint === 'users_cpf_hmac_unique') {
      recordFailure(limitKey)
      throw new ContaError('este CPF já está cadastrado', 409)
    }
    throw error
  }
}

export async function login(input: unknown) {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) throw new ContaError(firstIssue(parsed.error), 400)

  const data = parsed.data
  const limitKey = `login:${data.email}`
  if (isRateLimited(limitKey)) {
    throw new ContaError('muitas tentativas. espere 15 minutos.', 429)
  }

  const rows = await getDb().select().from(users).where(eq(users.email, data.email)).limit(1)
  const user = rows[0]
  const matches = await verifyPassword(user?.passwordHash ?? (await dummyPasswordHash()), data.password)
  if (!user || !matches) {
    recordFailure(limitKey)
    throw new ContaError('e-mail ou senha inválidos', 401)
  }

  clearFailures(limitKey)
  return toPublicUser(user)
}
