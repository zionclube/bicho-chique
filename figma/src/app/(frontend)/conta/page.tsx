'use client'

import { FormEvent, useEffect, useState } from 'react'
import { LojaShell } from '../LojaShell'
import { formatShop, lojaApi, shopInstant } from '../loja-api'

type User = {
  id: string
  role: 'client' | 'admin'
  name: string
  email: string
  phone: string | null
  cpfMasked: string | null
}

type Pet = {
  id: string
  name: string
  species: string
  breed: string
  size: 'pequeno' | 'medio' | 'grande'
}

type Service = { id: string; name: string; durationMinutes: number }

type Appointment = {
  id: string
  startsAt: string
  endsAt: string
  status: string
  canCancel: boolean
  pet: { name: string }
  service: { name: string }
}

export default function ContaPage() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<'entrar' | 'cadastrar'>('entrar')
  const [error, setError] = useState('')
  const [pets, setPets] = useState<Pet[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])

  async function loadSession() {
    try {
      const body = await lojaApi<{ user: User }>('/api/conta/eu')
      setUser(body.user)
    } catch {
      setUser(null)
    } finally {
      setReady(true)
    }
  }

  async function loadShop(current: User) {
    if (current.role !== 'client') return
    const [petBody, serviceBody, agendaBody] = await Promise.all([
      lojaApi<{ pets: Pet[] }>('/api/pets'),
      lojaApi<{ services: Service[] }>('/api/servicos'),
      lojaApi<{ appointments: Appointment[] }>('/api/agendamentos'),
    ])
    setPets(petBody.pets)
    setServices(serviceBody.services)
    setAppointments(agendaBody.appointments)
  }

  useEffect(() => {
    void loadSession()
  }, [])

  useEffect(() => {
    if (!user) return
    void loadShop(user).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'não foi possível carregar a conta')
    })
  }, [user])

  async function onAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const path = mode === 'entrar' ? '/api/conta/entrar' : '/api/conta/cadastro'
    const payload =
      mode === 'entrar'
        ? { email: String(form.get('email') ?? ''), password: String(form.get('password') ?? '') }
        : {
            name: String(form.get('name') ?? ''),
            email: String(form.get('email') ?? ''),
            phone: String(form.get('phone') ?? ''),
            cpf: String(form.get('cpf') ?? ''),
            address: String(form.get('address') ?? ''),
            password: String(form.get('password') ?? ''),
          }
    try {
      const body = await lojaApi<{ user: User }>(path, { method: 'POST', body: JSON.stringify(payload) })
      setUser(body.user)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'não foi possível entrar')
    }
  }

  async function onPet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = event.currentTarget
    const data = new FormData(form)
    try {
      await lojaApi('/api/pets', {
        method: 'POST',
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          species: String(data.get('species') ?? ''),
          breed: String(data.get('breed') ?? ''),
          size: String(data.get('size') ?? ''),
        }),
      })
      form.reset()
      if (user) await loadShop(user)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'não foi possível salvar o pet')
    }
  }

  async function onBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await lojaApi('/api/agendamentos', {
        method: 'POST',
        body: JSON.stringify({
          petId: String(form.get('petId') ?? ''),
          serviceId: String(form.get('serviceId') ?? ''),
          startsAt: shopInstant(String(form.get('startsAt') ?? '')),
        }),
      })
      if (user) await loadShop(user)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'não foi possível agendar')
    }
  }

  async function cancel(id: string) {
    setError('')
    try {
      await lojaApi(`/api/agendamentos/${id}/cancelar`, { method: 'POST' })
      if (user) await loadShop(user)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'não foi possível cancelar')
    }
  }

  async function logout() {
    await lojaApi('/api/conta/sair', { method: 'POST' })
    setUser(null)
    setPets([])
    setAppointments([])
  }

  return (
    <LojaShell>
      {!ready ? <p className="account-muted">Carregando…</p> : null}
      {ready && !user ? (
        <section className="account-card">
          <h1>{mode === 'entrar' ? 'Entrar' : 'Criar conta'}</h1>
          <p>O horário do agendamento é o da loja, em Cachoeirinha.</p>
          <div className="account-actions">
            <button className="secondary-button" type="button" onClick={() => setMode('entrar')}>
              Já tenho conta
            </button>
            <button className="secondary-button" type="button" onClick={() => setMode('cadastrar')}>
              Quero me cadastrar
            </button>
          </div>
          <form className="account-grid" onSubmit={onAuth}>
            {mode === 'cadastrar' ? (
              <>
                <label>
                  Nome
                  <input name="name" required autoComplete="name" />
                </label>
                <label>
                  Telefone
                  <input name="phone" required autoComplete="tel" placeholder="(51) 99999-9999" />
                </label>
                <label>
                  CPF
                  <input name="cpf" required autoComplete="off" placeholder="000.000.000-00" />
                </label>
                <label>
                  Endereço
                  <input name="address" required autoComplete="street-address" />
                </label>
              </>
            ) : null}
            <label>
              E-mail
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <label>
              Senha
              <input name="password" type="password" required minLength={mode === 'cadastrar' ? 8 : 1} autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'} />
            </label>
            <div className="account-actions">
              <button className="primary-button" type="submit">
                {mode === 'entrar' ? 'Entrar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {user ? (
        <section className="account-card">
          <h1>Olá, {user.name}</h1>
          <p>
            {user.email}
            {user.cpfMasked ? ` · CPF ${user.cpfMasked}` : ''}
          </p>
          <div className="account-actions">
            {user.role === 'admin' ? (
              <a className="primary-button" href="/painel">
                Abrir a administração
              </a>
            ) : null}
            <button className="secondary-button" type="button" onClick={() => void logout()}>
              Sair
            </button>
          </div>
        </section>
      ) : null}

      {user?.role === 'client' ? (
        <>
          <section className="account-card">
            <h2>Meus pets</h2>
            {pets.length === 0 ? <p>Nenhum pet cadastrado.</p> : null}
            {pets.map((pet) => (
              <div className="account-row" key={pet.id}>
                <p>
                  {pet.name} · {pet.species} · {pet.breed} · {pet.size}
                </p>
              </div>
            ))}
            <form className="account-grid" onSubmit={onPet}>
              <label>
                Nome
                <input name="name" required />
              </label>
              <label>
                Espécie
                <input name="species" required />
              </label>
              <label>
                Raça
                <input name="breed" required />
              </label>
              <label>
                Porte
                <select name="size" required defaultValue="pequeno">
                  <option value="pequeno">pequeno</option>
                  <option value="medio">medio</option>
                  <option value="grande">grande</option>
                </select>
              </label>
              <div className="account-actions">
                <button className="primary-button" type="submit">
                  Salvar pet
                </button>
              </div>
            </form>
          </section>

          <section className="account-card">
            <h2>Agendar</h2>
            <p>Escolha o minuto. O serviço precisa terminar dentro do expediente.</p>
            <form className="account-grid" onSubmit={onBook}>
              <label>
                Pet
                <select name="petId" required defaultValue="">
                  <option value="" disabled>
                    escolha
                  </option>
                  {pets.map((pet) => (
                    <option value={pet.id} key={pet.id}>
                      {pet.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Serviço
                <select name="serviceId" required defaultValue="">
                  <option value="" disabled>
                    escolha
                  </option>
                  {services.map((service) => (
                    <option value={service.id} key={service.id}>
                      {service.name} · {service.durationMinutes} min
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Horário da loja
                <input name="startsAt" type="datetime-local" required />
              </label>
              <div className="account-actions">
                <button className="primary-button" type="submit">
                  Agendar
                </button>
              </div>
            </form>
          </section>

          <section className="account-card">
            <h2>Meus agendamentos</h2>
            {appointments.length === 0 ? <p>Nenhum agendamento.</p> : null}
            {appointments.map((item) => (
              <div className="account-row" key={item.id}>
                <p>
                  {formatShop(item.startsAt)} · {item.pet.name} · {item.service.name} · {item.status}
                </p>
                {item.canCancel ? (
                  <button className="secondary-button" type="button" onClick={() => void cancel(item.id)}>
                    Cancelar
                  </button>
                ) : null}
              </div>
            ))}
          </section>
        </>
      ) : null}
      {error ? <p className="account-error">{error}</p> : null}
    </LojaShell>
  )
}
