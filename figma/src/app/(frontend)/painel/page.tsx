'use client'

import { FormEvent, useEffect, useState } from 'react'
import { LojaShell } from '../LojaShell'
import { formatShop, lojaApi, shopInstant, todayInShop } from '../loja-api'

type User = { id: string; role: 'client' | 'admin'; name: string }
type AgendaItem = {
  id: string
  startsAt: string
  endsAt: string
  status: string
  client: { name: string; email: string }
  pet: { name: string }
  service: { name: string }
}
type Block = { id: string; startsAt: string; endsAt: string; note: string | null }
type Service = { id: string; name: string; durationMinutes: number; active: boolean }
type Shift = { weekday: number; startsAt: string; endsAt: string }

const weekdayName = ['', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']

export default function PainelPage() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'dia' | 'semana' | 'mes'>('dia')
  const [date, setDate] = useState(todayInShop)
  const [appointments, setAppointments] = useState<AgendaItem[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [capacity, setCapacity] = useState(1)
  const [bufferMinutes, setBufferMinutes] = useState(0)

  async function loadAgenda(nextView = view, nextDate = date) {
    const body = await lojaApi<{ appointments: AgendaItem[] }>(
      `/api/admin/agenda?visao=${nextView}&data=${nextDate}`,
    )
    setAppointments(body.appointments)
  }

  async function loadAdmin() {
    const session = await lojaApi<{ user: User }>('/api/conta/eu')
    setUser(session.user)
    if (session.user.role !== 'admin') return
    const [blockBody, serviceBody, settings, hours] = await Promise.all([
      lojaApi<{ blocks: Block[] }>('/api/admin/bloqueios'),
      lojaApi<{ services: Service[] }>('/api/admin/servicos'),
      lojaApi<{ capacity: number; bufferMinutes: number }>('/api/admin/configuracao'),
      lojaApi<{ shifts: Shift[] }>('/api/admin/expediente'),
    ])
    setBlocks(blockBody.blocks)
    setServices(serviceBody.services)
    setCapacity(settings.capacity)
    setBufferMinutes(settings.bufferMinutes)
    setShifts(hours.shifts)
    await loadAgenda()
  }

  useEffect(() => {
    void loadAdmin()
      .catch((reason: unknown) => {
        const message = reason instanceof Error ? reason.message : ''
        if (message && message !== 'faça login para continuar') setError(message)
      })
      .finally(() => setReady(true))
  }, [])

  async function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await lojaApi('/api/conta/entrar', {
        method: 'POST',
        body: JSON.stringify({
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? ''),
        }),
      })
      await loadAdmin()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'não foi possível entrar')
    }
  }

  async function act(path: string, body?: unknown) {
    setError('')
    try {
      await lojaApi(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
      await loadAgenda()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'não foi possível concluir')
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      const saved = await lojaApi<{ capacity: number; bufferMinutes: number }>('/api/admin/configuracao', {
        method: 'PUT',
        body: JSON.stringify({ capacity, bufferMinutes }),
      })
      setCapacity(saved.capacity)
      setBufferMinutes(saved.bufferMinutes)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'não foi possível salvar')
    }
  }

  async function saveHours() {
    setError('')
    try {
      const saved = await lojaApi<{ shifts: Shift[] }>('/api/admin/expediente', {
        method: 'PUT',
        body: JSON.stringify({ shifts }),
      })
      setShifts(saved.shifts)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'não foi possível salvar o expediente')
    }
  }

  async function addService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = event.currentTarget
    const data = new FormData(form)
    try {
      await lojaApi('/api/admin/servicos', {
        method: 'POST',
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          durationMinutes: Number(data.get('durationMinutes') ?? 0),
        }),
      })
      form.reset()
      const body = await lojaApi<{ services: Service[] }>('/api/admin/servicos')
      setServices(body.services)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'não foi possível criar o serviço')
    }
  }

  async function addBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = event.currentTarget
    const data = new FormData(form)
    try {
      await lojaApi('/api/admin/bloqueios', {
        method: 'POST',
        body: JSON.stringify({
          startsAt: shopInstant(String(data.get('startsAt') ?? '')),
          endsAt: shopInstant(String(data.get('endsAt') ?? '')),
          note: String(data.get('note') ?? ''),
        }),
      })
      form.reset()
      const body = await lojaApi<{ blocks: Block[] }>('/api/admin/bloqueios')
      setBlocks(body.blocks)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'não foi possível bloquear')
    }
  }

  return (
    <LojaShell>
      {!ready ? <p className="account-muted">Carregando…</p> : null}
      {ready && !user ? (
        <section className="account-card">
          <h1>Administração</h1>
          <form className="account-grid" onSubmit={enter}>
            <label>
              E-mail
              <input name="email" type="email" required autoComplete="username" />
            </label>
            <label>
              Senha
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
            <div className="account-actions">
              <button className="primary-button" type="submit">
                Entrar
              </button>
            </div>
          </form>
        </section>
      ) : null}
      {user && user.role !== 'admin' ? (
        <section className="account-card">
          <h1>Administração</h1>
          <p>Esta área é da conta da loja.</p>
        </section>
      ) : null}
      {user?.role === 'admin' ? (
        <>
          <section className="account-card">
            <h1>Agenda</h1>
            <form
              className="account-grid"
              onSubmit={(event) => {
                event.preventDefault()
                void loadAgenda().catch((reason: unknown) => {
                  setError(reason instanceof Error ? reason.message : 'não foi possível carregar a agenda')
                })
              }}
            >
              <label>
                Visão
                <select value={view} onChange={(event) => setView(event.target.value as 'dia' | 'semana' | 'mes')}>
                  <option value="dia">dia</option>
                  <option value="semana">semana</option>
                  <option value="mes">mês</option>
                </select>
              </label>
              <label>
                Data
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
              </label>
              <div className="account-actions">
                <button className="primary-button" type="submit">
                  Ver agenda
                </button>
              </div>
            </form>
            {appointments.map((item) => (
              <div className="account-row" key={item.id}>
                <p>
                  {formatShop(item.startsAt)} · {item.client.name} · {item.pet.name} · {item.service.name} · {item.status}
                </p>
                <div className="account-actions">
                  {item.status === 'marcado' ? (
                    <button className="secondary-button" type="button" onClick={() => void act(`/api/admin/agendamentos/${item.id}/confirmar`)}>
                      Confirmar
                    </button>
                  ) : null}
                  {item.status !== 'cancelado' ? (
                    <button className="secondary-button" type="button" onClick={() => void act(`/api/admin/agendamentos/${item.id}/cancelar`)}>
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </section>
          <section className="account-card">
            <h2>Remarcar</h2>
            <form
              className="account-grid"
              onSubmit={(event) => {
                event.preventDefault()
                const form = new FormData(event.currentTarget)
                void act(`/api/admin/agendamentos/${String(form.get('id') ?? '')}/remarcar`, {
                  startsAt: shopInstant(String(form.get('startsAt') ?? '')),
                })
              }}
            >
              <label>
                Agendamento
                <select name="id" required defaultValue="">
                  <option value="" disabled>
                    escolha
                  </option>
                  {appointments
                    .filter((item) => item.status !== 'cancelado')
                    .map((item) => (
                      <option value={item.id} key={item.id}>
                        {formatShop(item.startsAt)} · {item.pet.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Novo horário da loja
                <input name="startsAt" type="datetime-local" required />
              </label>
              <div className="account-actions">
                <button className="primary-button" type="submit">
                  Remarcar
                </button>
              </div>
            </form>
          </section>
          <section className="account-card">
            <h2>Capacidade e folga</h2>
            <form className="account-grid" onSubmit={(event) => void saveSettings(event)}>
              <label>
                Atendimentos ao mesmo tempo
                <input type="number" min={1} value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} />
              </label>
              <label>
                Folga em minutos
                <input type="number" min={0} value={bufferMinutes} onChange={(event) => setBufferMinutes(Number(event.target.value))} />
              </label>
              <div className="account-actions">
                <button className="primary-button" type="submit">
                  Salvar
                </button>
              </div>
            </form>
          </section>
          <section className="account-card">
            <h2>Expediente</h2>
            <p>Salvar substitui a semana inteira. Sem turnos, a loja fica fechada.</p>
            {shifts.map((shift, index) => (
              <div className="account-grid" key={`${shift.weekday}-${index}`}>
                <label>
                  Dia
                  <select
                    value={shift.weekday}
                    onChange={(event) => {
                      const next = [...shifts]
                      next[index] = { ...shift, weekday: Number(event.target.value) }
                      setShifts(next)
                    }}
                  >
                    {weekdayName.slice(1).map((name, day) => (
                      <option value={day + 1} key={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Começa
                  <input
                    type="time"
                    value={shift.startsAt}
                    onChange={(event) => {
                      const next = [...shifts]
                      next[index] = { ...shift, startsAt: event.target.value }
                      setShifts(next)
                    }}
                  />
                </label>
                <label>
                  Termina
                  <input
                    type="time"
                    value={shift.endsAt}
                    onChange={(event) => {
                      const next = [...shifts]
                      next[index] = { ...shift, endsAt: event.target.value }
                      setShifts(next)
                    }}
                  />
                </label>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShifts(shifts.filter((_, item) => item !== index))}
                >
                  Tirar turno
                </button>
              </div>
            ))}
            <div className="account-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShifts([...shifts, { weekday: 1, startsAt: '08:00', endsAt: '12:00' }])}
              >
                Acrescentar turno
              </button>
              <button className="primary-button" type="button" onClick={() => void saveHours()}>
                Salvar expediente
              </button>
            </div>
          </section>
          <section className="account-card">
            <h2>Serviços</h2>
            {services.map((service) => (
              <p key={service.id}>
                {service.name} · {service.durationMinutes} min · {service.active ? 'ativo' : 'inativo'}
              </p>
            ))}
            <form className="account-grid" onSubmit={(event) => void addService(event)}>
              <label>
                Nome
                <input name="name" required />
              </label>
              <label>
                Minutos
                <input name="durationMinutes" type="number" min={1} required />
              </label>
              <div className="account-actions">
                <button className="primary-button" type="submit">
                  Criar serviço
                </button>
              </div>
            </form>
          </section>
          <section className="account-card">
            <h2>Bloqueios</h2>
            {blocks.map((block) => (
              <div className="account-row" key={block.id}>
                <p>
                  {formatShop(block.startsAt)} – {formatShop(block.endsAt)}
                  {block.note ? ` · ${block.note}` : ''}
                </p>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    void lojaApi(`/api/admin/bloqueios/${block.id}`, { method: 'DELETE' })
                      .then(() => lojaApi<{ blocks: Block[] }>('/api/admin/bloqueios'))
                      .then((body) => setBlocks(body.blocks))
                      .catch((reason: unknown) =>
                        setError(reason instanceof Error ? reason.message : 'não foi possível remover'),
                      )
                  }
                >
                  Remover
                </button>
              </div>
            ))}
            <form className="account-grid" onSubmit={(event) => void addBlock(event)}>
              <label>
                Começa
                <input name="startsAt" type="datetime-local" required />
              </label>
              <label>
                Termina
                <input name="endsAt" type="datetime-local" required />
              </label>
              <label>
                Nota
                <input name="note" />
              </label>
              <div className="account-actions">
                <button className="primary-button" type="submit">
                  Bloquear
                </button>
              </div>
            </form>
          </section>
        </>
      ) : null}
      {error ? <p className="account-error">{error}</p> : null}
    </LojaShell>
  )
}
