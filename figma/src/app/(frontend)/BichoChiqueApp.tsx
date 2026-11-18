'use client'

import { FormEvent, useEffect, useState, type ReactNode } from 'react'
import { formatShop, lojaApi, shopInstant, todayInShop } from './loja-api'

const lunaPhoto =
  'https://images.unsplash.com/photo-1678153184494-1f6fc14a673d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900'
const carePhoto =
  'https://images.unsplash.com/photo-1733964659477-35534815c626?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1000'

type IconName =
  | 'calendar'
  | 'clock'
  | 'home'
  | 'paw'
  | 'message'
  | 'user'
  | 'bell'
  | 'sparkle'
  | 'shield'
  | 'leaf'
  | 'check'
  | 'plus'
  | 'arrow'
  | 'close'
  | 'send'
  | 'heart'

function Icon({
  name,
  size = 20,
  stroke = 1.8,
}: {
  name: IconName
  size?: number
  stroke?: number
}) {
  const paths: Record<IconName, ReactNode> = {
    calendar: (
      <>
        <path d="M6 2v4M18 2v4M3 9h18" />
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <path d="m8 15 2.2 2.2L16 12" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7" />
      </>
    ),
    paw: (
      <>
        <ellipse cx="12" cy="16.5" rx="5.5" ry="4" />
        <ellipse cx="6" cy="10" rx="2" ry="2.7" />
        <ellipse cx="18" cy="10" rx="2" ry="2.7" />
        <ellipse cx="10" cy="6" rx="2" ry="2.7" />
        <ellipse cx="14.5" cy="6" rx="2" ry="2.7" />
      </>
    ),
    message: (
      <>
        <path d="M20 15a4 4 0 0 1-4 4H8l-5 3 1.3-5A7 7 0 0 1 3 13V8a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4Z" />
        <path d="M8 11h.01M12 11h.01M16 11h.01" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8Z" />
        <path d="M10 21h4" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 2 1.3 4.2L17 8l-3.7 1.8L12 14l-1.3-4.2L7 8l3.7-1.8Z" />
        <path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-3.7 8-10V5l-8-3-8 3v7c0 6.3 8 10 8 10Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 3C11 3 5 7 5 14c0 3 2 6 5 7 1-7 4-11 10-15" />
        <path d="M4 22c1-5 5-9 11-12" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

type Tab = 'inicio' | 'agenda' | 'pets' | 'conta'

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
  status: 'marcado' | 'confirmado' | 'cancelado'
  canCancel: boolean
  pet: { name: string }
  service: { name: string; durationMinutes: number }
}

function shopDayLabel(value: Date = new Date()) {
  const label = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(value)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function nextCare(items: Appointment[]) {
  const now = Date.now()
  return items
    .filter(
      (item) =>
        (item.status === 'marcado' || item.status === 'confirmado') &&
        new Date(item.startsAt).getTime() >= now,
    )
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0]
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('inicio')
  const [bookingOpen, setBookingOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [dayLabel, setDayLabel] = useState('Cachoeirinha, RS')
  const [user, setUser] = useState<User | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  async function loadShop(current: User) {
    if (current.role !== 'client') {
      setPets([])
      setServices([])
      setAppointments([])
      return
    }
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
    setDayLabel(shopDayLabel())
    void lojaApi<{ user: User }>('/api/conta/eu')
      .then(async (body) => {
        setUser(body.user)
        await loadShop(body.user)
      })
      .catch(() => setUser(null))
      .finally(() => setReady(true))
  }, [])

  function openBooking() {
    setError('')
    setBookingOpen(true)
  }

  async function refresh() {
    if (!user) return
    await loadShop(user)
  }

  const upcoming = nextCare(appointments)
  const firstPet = pets[0]

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#24362f]">
      {toast && (
        <div className="toast">
          <Icon name="check" size={18} />
          {toast}
        </div>
      )}

      <header className="topbar">
        <button className="brand" onClick={() => setActiveTab('inicio')} aria-label="Ir para o início">
          <img className="brand-logo" src="/assets/bicho-chique-logo.png" alt="Bicho Chique Estética Animal" />
        </button>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {(
            [
              ['Início', 'inicio'],
              ['Agenda', 'agenda'],
              ['Meus pets', 'pets'],
            ] as const
          ).map(([label, tab]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'active' : ''}>
              {label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          {user?.role === 'admin' && (
            <a className="reservation-access" href="/painel">
              Administração
            </a>
          )}
          {user ? (
            <button
              className="reservation-access"
              onClick={() => {
                void lojaApi('/api/conta/sair', { method: 'POST' }).then(() => {
                  setUser(null)
                  setPets([])
                  setAppointments([])
                  setServices([])
                  setActiveTab('inicio')
                })
              }}
            >
              Sair
            </button>
          ) : (
            <button className="reservation-access" onClick={() => setActiveTab('conta')}>
              Entrar
            </button>
          )}
          <button
            className="reservation-access"
            onClick={() => setActiveTab(user?.role === 'client' ? 'agenda' : 'conta')}
          >
            <Icon name="shield" size={17} />
            <span>Consultar reserva</span>
          </button>
        </div>
      </header>

      <main>
        {activeTab === 'inicio' && (
          <>
            <section className="welcome">
              <div>
                <p className="eyebrow">{dayLabel}</p>
                <h1>Cuidado no tempo do seu pet.</h1>
                <p>
                  {user
                    ? `Olá, ${user.name.split(' ')[0]}. Seus horários ficam nesta conta.`
                    : 'Entre na sua conta para marcar o horário.'}
                </p>
              </div>
              <button className="primary-button desktop-only" onClick={openBooking}>
                <Icon name="plus" size={18} /> Novo agendamento
              </button>
            </section>

            <section className="appointment-card">
              <div className="appointment-main">
                <div className="appointment-label">
                  <span></span> Próximo cuidado
                </div>
                <div className="appointment-content">
                  <img src={lunaPhoto} alt="Cachorro pequeno, ilustração da vitrine" />
                  <div className="appointment-copy">
                    {upcoming ? (
                      <>
                        <div className="date-chip">
                          <strong>{new Date(upcoming.startsAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit' })}</strong>
                          <span>
                            {new Date(upcoming.startsAt)
                              .toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', month: 'short' })
                              .replace('.', '')
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h2>
                            {upcoming.service.name} de {upcoming.pet.name}
                          </h2>
                          <p>
                            <Icon name="clock" size={17} /> {formatShop(upcoming.startsAt)} · {upcoming.service.durationMinutes} min · {upcoming.status}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <h2>{ready ? 'Nenhum cuidado marcado' : 'Carregando…'}</h2>
                        <p>O horário escolhido precisa caber inteiro no expediente da loja.</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="appointment-footer">
                  <button onClick={() => setActiveTab(user?.role === 'client' ? 'agenda' : 'conta')}>
                    {upcoming ? 'Ver na agenda' : 'Marcar horário'} <Icon name="arrow" size={17} />
                  </button>
                </div>
              </div>
              <aside className="exclusive-note">
                <Icon name="sparkle" size={26} />
                <div>
                  <strong>Um atendimento por vez.</strong>
                  <p>A capacidade da loja define quantos horários podem ocupar o mesmo intervalo.</p>
                </div>
              </aside>
            </section>

            <div className="content-grid">
              <section className="section-card care-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">No horário marcado</p>
                    <h2>O que a agenda guarda</h2>
                  </div>
                  {upcoming && (
                    <span className="duration">
                      <Icon name="clock" size={16} /> {upcoming.service.durationMinutes} min
                    </span>
                  )}
                </div>
                <p>
                  {upcoming
                    ? `${upcoming.pet.name} começa às ${formatShop(upcoming.startsAt)}. O fim do horário inclui a duração do serviço.`
                    : 'Depois de entrar, escolha o pet, o serviço e o minuto. A loja recusa o horário que não termina dentro do expediente.'}
                </p>
              </section>

              <section className="section-card pet-card">
                <div className="pet-photo">
                  <img src={carePhoto} alt="Cachorro enrolado em uma toalha, ilustração da vitrine" />
                  <span>{firstPet ? 'Ficha da conta' : 'Sem pet ainda'}</span>
                </div>
                <div className="pet-info">
                  <div className="pet-title">
                    <div>
                      <p className="eyebrow">Meu pet</p>
                      <h2>{firstPet ? firstPet.name : 'Cadastre o pet'}</h2>
                    </div>
                    {firstPet && (
                      <span>
                        {firstPet.species} • {firstPet.breed} • {firstPet.size}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setActiveTab(user ? 'pets' : 'conta')}>
                    {firstPet ? 'Ver ficha' : 'Entrar para cadastrar'} <Icon name="arrow" size={17} />
                  </button>
                </div>
              </section>
            </div>

            <section className="reassurance">
              <div className="reassurance-icon">
                <Icon name="message" size={25} />
              </div>
              <div>
                <p className="eyebrow">Conversa de demonstração</p>
                <h2>Falar com a equipe</h2>
                <p>O botão abre uma conversa visual. A mensagem não é enviada à loja.</p>
              </div>
              <button onClick={() => setChatOpen(true)}>
                Abrir a demonstração <Icon name="arrow" size={17} />
              </button>
            </section>
          </>
        )}

        {activeTab === 'agenda' && (
          <AgendaView
            user={user}
            appointments={appointments}
            onNeedAccount={() => setActiveTab('conta')}
            onBook={openBooking}
            onCancel={async (id) => {
              setError('')
              try {
                await lojaApi(`/api/agendamentos/${id}/cancelar`, { method: 'POST' })
                await refresh()
                notify('Agendamento cancelado')
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : 'não foi possível cancelar')
              }
            }}
            error={error}
          />
        )}
        {activeTab === 'pets' && (
          <PetView
            user={user}
            pets={pets}
            onNeedAccount={() => setActiveTab('conta')}
            onCreate={async (event) => {
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
                await refresh()
                notify('Pet cadastrado')
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : 'não foi possível salvar o pet')
              }
            }}
            error={error}
          />
        )}
        {activeTab === 'conta' && (
          <AccountView
            user={user}
            onUser={async (next) => {
              setUser(next)
              await loadShop(next)
              setActiveTab(next.role === 'admin' ? 'inicio' : 'agenda')
              notify(next.role === 'admin' ? 'Conta da loja aberta' : 'Conta aberta')
            }}
          />
        )}
      </main>

      <button className="chat-fab" onClick={() => setChatOpen(true)} aria-label="Abrir a conversa de demonstração">
        <Icon name="message" size={23} />
        <span>Demonstração</span>
      </button>

      <nav className="mobile-nav" aria-label="Navegação mobile">
        <button className={activeTab === 'inicio' ? 'active' : ''} onClick={() => setActiveTab('inicio')}>
          <Icon name="home" />
          <span>Início</span>
        </button>
        <button className={activeTab === 'agenda' ? 'active' : ''} onClick={() => setActiveTab('agenda')}>
          <Icon name="calendar" />
          <span>Agenda</span>
        </button>
        <button className="book-mobile" onClick={openBooking} aria-label="Novo agendamento">
          <Icon name="plus" size={25} />
        </button>
        <button className={activeTab === 'pets' ? 'active' : ''} onClick={() => setActiveTab('pets')}>
          <Icon name="paw" />
          <span>Pets</span>
        </button>
        <button className={activeTab === 'conta' ? 'active' : ''} onClick={() => setActiveTab('conta')}>
          <Icon name="user" />
          <span>Conta</span>
        </button>
      </nav>

      {bookingOpen && (
        <BookingModal
          user={user}
          pets={pets}
          services={services}
          onClose={() => setBookingOpen(false)}
          onNeedAccount={() => {
            setBookingOpen(false)
            setActiveTab('conta')
          }}
          onNeedPet={() => {
            setBookingOpen(false)
            setActiveTab('pets')
          }}
          onBooked={async () => {
            setBookingOpen(false)
            await refresh()
            setActiveTab('agenda')
            notify('Horário marcado')
          }}
        />
      )}

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </div>
  )
}

function AgendaView({
  user,
  appointments,
  onNeedAccount,
  onBook,
  onCancel,
  error,
}: {
  user: User | null
  appointments: Appointment[]
  onNeedAccount: () => void
  onBook: () => void
  onCancel: (id: string) => Promise<void>
  error: string
}) {
  return (
    <div className="inner-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">Sua conta</p>
          <h1>Agenda</h1>
          <p>Os horários marcados e confirmados ocupam a loja. Cancelar até 24 horas antes libera o intervalo.</p>
        </div>
        <button className="primary-button" onClick={user?.role === 'client' ? onBook : onNeedAccount}>
          Novo agendamento
        </button>
      </div>
      {error && <p className="account-error">{error}</p>}
      {!user && <p>Entre na conta para ver os horários.</p>}
      {user?.role === 'admin' && (
        <p>
          Esta conta é da loja. A agenda completa está na <a href="/painel">administração</a>.
        </p>
      )}
      {user?.role === 'client' && appointments.length === 0 && <p>Nenhum agendamento.</p>}
      <div className="account-card">
        {appointments.map((item) => (
          <div className="account-row" key={item.id}>
            <p>
              {formatShop(item.startsAt)} · {item.pet.name} · {item.service.name} · {item.status}
            </p>
            {item.canCancel && (
              <button className="secondary-button" onClick={() => void onCancel(item.id)}>
                Cancelar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PetView({
  user,
  pets,
  onNeedAccount,
  onCreate,
  error,
}: {
  user: User | null
  pets: Pet[]
  onNeedAccount: () => void
  onCreate: (event: FormEvent<HTMLFormElement>) => Promise<void>
  error: string
}) {
  if (!user) {
    return (
      <div className="inner-page">
        <div className="page-title">
          <div>
            <p className="eyebrow">Ficha</p>
            <h1>Meus pets</h1>
            <p>A ficha fica na conta.</p>
          </div>
          <button className="primary-button" onClick={onNeedAccount}>
            Entrar
          </button>
        </div>
      </div>
    )
  }
  if (user.role === 'admin') {
    return (
      <div className="inner-page">
        <div className="page-title">
          <div>
            <h1>Meus pets</h1>
            <p>A ficha do cliente abre na administração.</p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="inner-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">Ficha</p>
          <h1>Meus pets</h1>
          <p>Nome, espécie, raça e porte. A raça é o texto que você informar.</p>
        </div>
      </div>
      {error && <p className="account-error">{error}</p>}
      {pets.map((pet) => (
        <section className="section-card" key={pet.id}>
          <h2>{pet.name}</h2>
          <p>
            {pet.species} · {pet.breed} · {pet.size}
          </p>
        </section>
      ))}
      <form className="account-card" onSubmit={(event) => void onCreate(event)}>
        <h2>Novo pet</h2>
        <div className="account-grid">
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
            <select name="size" defaultValue="pequeno">
              <option value="pequeno">pequeno</option>
              <option value="medio">medio</option>
              <option value="grande">grande</option>
            </select>
          </label>
        </div>
        <button className="primary-button" type="submit">
          Salvar pet
        </button>
      </form>
    </div>
  )
}

function AccountView({ user, onUser }: { user: User | null; onUser: (user: User) => Promise<void> }) {
  const [mode, setMode] = useState<'entrar' | 'cadastrar'>('entrar')
  const [error, setError] = useState('')

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
      await onUser(body.user)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'não foi possível entrar')
    }
  }

  if (user) {
    return (
      <div className="inner-page">
        <div className="page-title">
          <div>
            <p className="eyebrow">Conta</p>
            <h1>{user.name}</h1>
            <p>
              {user.email}
              {user.cpfMasked ? ` · CPF ${user.cpfMasked}` : ''}
            </p>
          </div>
        </div>
        {user.role === 'admin' && (
          <a className="primary-button" href="/painel">
            Abrir a administração
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="inner-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">{mode === 'entrar' ? 'Entrar' : 'Cadastro'}</p>
          <h1>{mode === 'entrar' ? 'Acesse sua conta' : 'Crie sua conta'}</h1>
          <p>O agendamento fica ligado ao e-mail e à senha.</p>
        </div>
      </div>
      <form className="account-card" onSubmit={(event) => void onAuth(event)}>
        {error && <p className="account-error">{error}</p>}
        {mode === 'cadastrar' && (
          <div className="account-grid">
            <label>
              Nome
              <input name="name" autoComplete="name" required />
            </label>
            <label>
              Telefone
              <input name="phone" autoComplete="tel" required />
            </label>
            <label>
              CPF
              <input name="cpf" inputMode="numeric" autoComplete="off" required />
            </label>
            <label>
              Endereço
              <input name="address" autoComplete="street-address" required />
            </label>
          </div>
        )}
        <div className="account-grid">
          <label>
            E-mail
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Senha
            <input name="password" type="password" autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'} required />
          </label>
        </div>
        <div className="account-actions">
          <button className="primary-button" type="submit">
            {mode === 'entrar' ? 'Entrar' : 'Cadastrar'}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setError('')
              setMode(mode === 'entrar' ? 'cadastrar' : 'entrar')
            }}
          >
            {mode === 'entrar' ? 'Criar conta' : 'Já tenho conta'}
          </button>
        </div>
      </form>
    </div>
  )
}

function BookingModal({
  user,
  pets,
  services,
  onClose,
  onNeedAccount,
  onNeedPet,
  onBooked,
}: {
  user: User | null
  pets: Pet[]
  services: Service[]
  onClose: () => void
  onNeedAccount: () => void
  onNeedPet: () => void
  onBooked: () => Promise<void>
}) {
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      await lojaApi('/api/agendamentos', {
        method: 'POST',
        body: JSON.stringify({
          petId: String(data.get('petId') ?? ''),
          serviceId: String(data.get('serviceId') ?? ''),
          startsAt: shopInstant(String(data.get('startsAt') ?? '')),
        }),
      })
      await onBooked()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'não foi possível agendar')
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <Icon name="close" />
        </button>
        <p className="eyebrow">Agendamento</p>
        {!user && (
          <div className="step-content">
            <h2>Entre para marcar o horário</h2>
            <p>O horário fica na conta, com o pet já cadastrado.</p>
            <button className="primary-button" onClick={onNeedAccount}>
              Entrar
            </button>
          </div>
        )}
        {user?.role === 'admin' && (
          <div className="step-content">
            <h2>A marcação é da conta do cliente</h2>
            <p>A loja confirma, remarca e cancela na administração.</p>
            <a className="primary-button" href="/painel">
              Abrir a administração
            </a>
          </div>
        )}
        {user?.role === 'client' && pets.length === 0 && (
          <div className="step-content">
            <h2>Cadastre um pet antes</h2>
            <button className="primary-button" onClick={onNeedPet}>
              Ir para os pets
            </button>
          </div>
        )}
        {user?.role === 'client' && pets.length > 0 && (
          <form className="step-content account-card" onSubmit={(event) => void onSubmit(event)}>
            <h2>Escolha pet, serviço e minuto</h2>
            <p>O relógio é o da loja, em São Paulo. O serviço precisa terminar dentro de um turno.</p>
            {error && <p className="account-error">{error}</p>}
            <label>
              Pet
              <select name="petId" required defaultValue="">
                <option value="" disabled>
                  escolha
                </option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
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
                  <option key={service.id} value={service.id}>
                    {service.name} · {service.durationMinutes} min
                  </option>
                ))}
              </select>
            </label>
            <label>
              Horário da loja
              <input name="startsAt" type="datetime-local" required min={`${todayInShop()}T00:00`} />
            </label>
            <button className="primary-button" type="submit">
              Confirmar agendamento
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<string[]>([])
  const [input, setInput] = useState('')
  const send = (text: string) => {
    if (!text.trim()) return
    setMessages([...messages, text])
    setInput('')
  }
  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="online-avatar">
          <img src="/assets/bicho-chique-symbol.jpg" alt="" />
          <span></span>
        </div>
        <div>
          <strong>Equipe Bicho Chique</strong>
          <small>Demonstração. A mensagem não é enviada.</small>
        </div>
        <button onClick={onClose} aria-label="Fechar conversa">
          <Icon name="close" />
        </button>
      </div>
      <div className="chat-body">
        <div className="bot-message">Esta conversa fica só nesta tela.</div>
        {messages.map((message, index) => (
          <div className="user-message" key={`${message}-${index}`}>
            {message}
          </div>
        ))}
      </div>
      <form
        className="chat-input"
        onSubmit={(event) => {
          event.preventDefault()
          send(input)
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Escreva uma mensagem de demonstração"
          aria-label="Mensagem"
        />
        <button aria-label="Enviar">
          <Icon name="send" size={19} />
        </button>
      </form>
    </div>
  )
}

