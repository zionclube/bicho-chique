import { count, eq } from 'drizzle-orm'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { closeDb, getDb } from './client'
import { users } from './schema'
import { hashPassword } from '../lib/password'

function askHidden(label: string) {
  return new Promise<string>((resolve, reject) => {
    stdout.write(label)
    if (!stdin.isTTY) {
      reject(new Error('execute este comando num terminal'))
      return
    }
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    let value = ''
    const onData = (chunk: string) => {
      if (chunk === '\u0003') {
        cleanup()
        reject(new Error('cancelado'))
        return
      }
      if (chunk === '\r' || chunk === '\n') {
        cleanup()
        stdout.write('\n')
        resolve(value)
        return
      }
      if (chunk === '\u007f') {
        value = value.slice(0, -1)
        return
      }
      value += chunk
    }
    const cleanup = () => {
      stdin.off('data', onData)
      stdin.setRawMode(false)
      stdin.pause()
    }
    stdin.on('data', onData)
  })
}

async function main() {
  try {
    const existing = await getDb()
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, 'admin'))
    if ((existing[0]?.value ?? 0) > 0) {
      console.error('já existe um administrador. crie os próximos pelo painel.')
      process.exitCode = 1
      return
    }

    const fromEnv = process.env.ADMIN_NAME && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD
    let name: string
    let email: string
    let password: string
    let again: string
    if (fromEnv) {
      name = process.env.ADMIN_NAME!.trim().replace(/\s+/g, ' ')
      email = process.env.ADMIN_EMAIL!.trim().toLowerCase()
      password = process.env.ADMIN_PASSWORD!
      again = password
    } else {
      const rl = createInterface({ input: stdin, output: stdout })
      name = (await rl.question('nome: ')).trim().replace(/\s+/g, ' ')
      email = (await rl.question('e-mail: ')).trim().toLowerCase()
      rl.close()
      password = await askHidden('senha: ')
      again = await askHidden('senha de novo: ')
    }

    if (
      name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8 ||
      password !== again
    ) {
      console.error('dados inválidos. a senha precisa ter 8 caracteres e coincidir.')
      process.exitCode = 1
      return
    }

    await getDb().insert(users).values({
      role: 'admin',
      name,
      email,
      passwordHash: await hashPassword(password),
    })
    console.log('administrador criado.')
  } finally {
    await closeDb()
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : ''
  if (message === 'execute este comando num terminal' || message === 'cancelado') {
    console.error(message)
  } else {
    console.error('não foi possível criar o administrador.')
  }
  process.exitCode = 1
})
