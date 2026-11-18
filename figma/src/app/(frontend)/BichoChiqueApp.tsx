'use client'

import { useState, type ReactNode } from 'react'

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

const timeline = [
  {
    time: '09:00',
    title: 'Chegada e acolhimento',
    text: 'Adaptação tranquila ao ambiente',
    active: true,
  },
  { time: '09:15', title: 'Banho dermatológico', text: 'Produtos hipoalergênicos da Luna' },
  { time: '10:05', title: 'Secagem sem pressa', text: 'Temperatura suave e pausas' },
  { time: '10:45', title: 'Prontinha para você', text: 'Enviaremos uma foto antes' },
]

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'inicio' | 'agenda' | 'pets' | 'reserva'>('inicio')
  const [bookingOpen, setBookingOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [confirmed, setConfirmed] = useState(false)
  const [petName, setPetName] = useState('')
  const [tutorName, setTutorName] = useState('')
  const [phone, setPhone] = useState('')
  const [toast, setToast] = useState('')

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#24362f]">
      {toast && (
        <div className="toast">
          <Icon name="check" size={18} />
          {toast}
        </div>
      )}

      <header className="topbar">
        <button
          className="brand"
          onClick={() => setActiveTab('inicio')}
          aria-label="Ir para o início"
        >
          <img
            className="brand-logo"
            src="/assets/bicho-chique-logo.png"
            alt="Bicho Chique Estética Animal"
          />
        </button>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {['Início', 'Agenda', 'Meus pets'].map((item) => (
            <button
              key={item}
              onClick={() =>
                setActiveTab(item === 'Início' ? 'inicio' : item === 'Agenda' ? 'agenda' : 'pets')
              }
              className={
                (item === 'Início' && activeTab === 'inicio') ||
                (item === 'Agenda' && activeTab === 'agenda') ||
                (item === 'Meus pets' && activeTab === 'pets')
                  ? 'active'
                  : ''
              }
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <a className="reservation-access" href="/conta">
            Entrar
          </a>
          <button className="reservation-access" onClick={() => setActiveTab('reserva')}>
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
                <p className="eyebrow">Quarta-feira, 12 de junho</p>
                <h1>Cuidado no tempo do seu pet.</h1>
                <p>Atendimento exclusivo, tranquilo e sem cadastro.</p>
              </div>
              <button
                className="primary-button desktop-only"
                onClick={() => {
                  setStep(1)
                  setConfirmed(false)
                  setBookingOpen(true)
                }}
              >
                <Icon name="plus" size={18} /> Novo agendamento
              </button>
            </section>

            <section className="appointment-card">
              <div className="appointment-main">
                <div className="appointment-label">
                  <span></span> Próximo cuidado
                </div>
                <div className="appointment-content">
                  <img src={lunaPhoto} alt="Luna, uma cachorrinha pequena com bandana verde" />
                  <div className="appointment-copy">
                    <div className="date-chip">
                      <strong>18</strong>
                      <span>JUN</span>
                    </div>
                    <div>
                      <h2>Banho dermatológico da Luna</h2>
                      <p>
                        <Icon name="clock" size={17} /> Terça-feira, das 09:00 às 11:00
                      </p>
                      <div className="assurances">
                        <span>
                          <Icon name="shield" size={16} /> Sala exclusiva
                        </span>
                        <span>
                          <Icon name="leaf" size={16} /> Linha hipoalergênica
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="appointment-footer">
                  <div className="specialist">
                    <span className="specialist-avatar">MA</span>
                    <span>
                      Com Marina Alves<small>Especialista em peles sensíveis</small>
                    </span>
                  </div>
                  <button onClick={() => setActiveTab('agenda')}>
                    Ver detalhes <Icon name="arrow" size={17} />
                  </button>
                </div>
              </div>
              <aside className="exclusive-note">
                <Icon name="sparkle" size={26} />
                <div>
                  <strong>Este horário é só da Luna.</strong>
                  <p>Sem esperas, sem gaiolas e sem contato com outros pets.</p>
                </div>
              </aside>
            </section>

            <div className="content-grid">
              <section className="section-card care-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Com calma, do início ao fim</p>
                    <h2>Como será o cuidado</h2>
                  </div>
                  <span className="duration">
                    <Icon name="clock" size={16} /> 2 horas reservadas
                  </span>
                </div>
                <div className="timeline">
                  {timeline.map((item, index) => (
                    <div className="timeline-item" key={item.time}>
                      <div className={`timeline-dot ${item.active ? 'active' : ''}`}>
                        {index === 0 ? <Icon name="heart" size={15} /> : index + 1}
                      </div>
                      <time>{item.time}</time>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="section-card pet-card">
                <div className="pet-photo">
                  <img
                    src={carePhoto}
                    alt="Cachorrinha branca enrolada em uma toalha após o banho"
                  />
                  <span>Perfil completo</span>
                </div>
                <div className="pet-info">
                  <div className="pet-title">
                    <div>
                      <p className="eyebrow">Minha pet</p>
                      <h2>Luna</h2>
                    </div>
                    <span>Shih-tzu • 5 anos</span>
                  </div>
                  <div className="pet-tags">
                    <span>Pele sensível</span>
                    <span>Água morna</span>
                    <span>Sem perfume</span>
                  </div>
                  <button onClick={() => setActiveTab('pets')}>
                    Ver ficha de cuidados <Icon name="arrow" size={17} />
                  </button>
                </div>
              </section>
            </div>

            <section className="reassurance">
              <div className="reassurance-icon">
                <Icon name="message" size={25} />
              </div>
              <div>
                <p className="eyebrow">Você acompanha de perto</p>
                <h2>Atualizações durante o banho</h2>
                <p>
                  Enviaremos uma mensagem quando a Luna chegar, após o banho e assim que estiver
                  pronta — com foto, é claro.
                </p>
              </div>
              <button onClick={() => setChatOpen(true)}>
                Falar com a equipe <Icon name="arrow" size={17} />
              </button>
            </section>
          </>
        )}

        {activeTab === 'agenda' && (
          <AgendaView
            onBook={(time) => {
              setSelectedTime(time)
              setStep(1)
              setConfirmed(false)
              setBookingOpen(true)
            }}
          />
        )}
        {activeTab === 'pets' && <PetView />}
        {activeTab === 'reserva' && <ReservationView />}
      </main>

      <button
        className="chat-fab"
        onClick={() => setChatOpen(true)}
        aria-label="Falar com a equipe"
      >
        <Icon name="message" size={23} />
        <span>Podemos ajudar?</span>
      </button>

      <nav className="mobile-nav" aria-label="Navegação mobile">
        <button
          className={activeTab === 'inicio' ? 'active' : ''}
          onClick={() => setActiveTab('inicio')}
        >
          <Icon name="home" />
          <span>Início</span>
        </button>
        <button
          className={activeTab === 'agenda' ? 'active' : ''}
          onClick={() => setActiveTab('agenda')}
        >
          <Icon name="calendar" />
          <span>Agenda</span>
        </button>
        <button
          className="book-mobile"
          onClick={() => {
            setStep(1)
            setConfirmed(false)
            setBookingOpen(true)
          }}
        >
          <Icon name="plus" size={25} />
        </button>
        <button
          className={activeTab === 'pets' ? 'active' : ''}
          onClick={() => setActiveTab('pets')}
        >
          <Icon name="paw" />
          <span>Pets</span>
        </button>
        <button
          className={activeTab === 'reserva' ? 'active' : ''}
          onClick={() => setActiveTab('reserva')}
        >
          <Icon name="shield" />
          <span>Reserva</span>
        </button>
      </nav>

      {bookingOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setBookingOpen(false)}
        >
          <div className="modal">
            <button
              className="modal-close"
              onClick={() => setBookingOpen(false)}
              aria-label="Fechar"
            >
              <Icon name="close" />
            </button>
            {!confirmed ? (
              <>
                <div className="modal-progress">
                  <span className={step >= 1 ? 'done' : ''}></span>
                  <span className={step >= 2 ? 'done' : ''}></span>
                  <span className={step >= 3 ? 'done' : ''}></span>
                </div>
                <div className="guest-booking-note">
                  <Icon name="check" size={15} />
                  <span>
                    <strong>Agendamento rápido</strong>
                    <small>Sem criar conta ou cadastrar senha.</small>
                  </span>
                </div>
                <p className="eyebrow">Agendamento • passo {step} de 3</p>
                {step === 1 && (
                  <div className="step-content">
                    <h2>Quem vem para o cuidado?</h2>
                    <p>Precisamos apenas dos dados essenciais para confirmar o horário.</p>
                    <div className="booking-fields">
                      <label className="pet-name-field">
                        Nome do tutor
                        <span>
                          <Icon name="user" size={20} />
                          <input
                            autoFocus
                            value={tutorName}
                            onChange={(event) => setTutorName(event.target.value)}
                            placeholder="Seu nome"
                            autoComplete="name"
                          />
                        </span>
                      </label>
                      <label className="pet-name-field">
                        Telefone
                        <span>
                          <Icon name="message" size={20} />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(event) => setPhone(formatPhone(event.target.value))}
                            placeholder="(51) 99999-9999"
                            autoComplete="tel"
                            inputMode="tel"
                          />
                        </span>
                      </label>
                      <label className="pet-name-field full-width">
                        Nome do cachorro
                        <span>
                          <Icon name="paw" size={20} />
                          <input
                            value={petName}
                            onChange={(event) => setPetName(event.target.value)}
                            placeholder="Ex.: Luna"
                          />
                        </span>
                      </label>
                    </div>
                    <div className="minimal-data-note">
                      <Icon name="shield" size={16} />
                      Usamos esses dados somente para identificar e confirmar o agendamento.
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="step-content">
                    <h2>Escolha o melhor horário</h2>
                    <p>Todos os horários garantem atendimento exclusivo.</p>
                    <div className="date-row">
                      <button>
                        <small>SEG</small>17
                      </button>
                      <button className="selected">
                        <small>TER</small>18
                      </button>
                      <button>
                        <small>QUA</small>19
                      </button>
                      <button>
                        <small>QUI</small>20
                      </button>
                    </div>
                    <div className="time-grid">
                      {['09:00', '11:30', '14:00', '16:30'].map((time) => (
                        <button
                          className={selectedTime === time ? 'selected' : ''}
                          onClick={() => setSelectedTime(time)}
                          key={time}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="step-content">
                    <h2>Confira os dados.</h2>
                    <p>Você não precisa criar uma conta para confirmar.</p>
                    <div className="privacy-assurance">
                      <span>
                        <Icon name="shield" size={20} />
                      </span>
                      <div>
                        <strong>Cadastro mínimo</strong>
                        <small>Não solicitamos e-mail, documento, endereço ou senha.</small>
                      </div>
                    </div>
                    <div className="summary-box">
                      <div>
                        <Icon name="paw" />
                        <span>
                          <small>Pet e serviço</small>
                          <strong>{petName} • Banho dermatológico</strong>
                        </span>
                      </div>
                      <div>
                        <Icon name="user" />
                        <span>
                          <small>Tutor e contato</small>
                          <strong>
                            {tutorName} • {phone}
                          </strong>
                        </span>
                      </div>
                      <div>
                        <Icon name="calendar" />
                        <span>
                          <small>Data e horário</small>
                          <strong>18 de junho • {selectedTime}</strong>
                        </span>
                      </div>
                      <div>
                        <Icon name="shield" />
                        <span>
                          <small>Garantia</small>
                          <strong>Sala exclusiva por 2 horas</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="modal-actions">
                  {step > 1 && (
                    <button className="secondary-button" onClick={() => setStep(step - 1)}>
                      Voltar
                    </button>
                  )}
                  <button
                    className="primary-button"
                    onClick={() => {
                      if (
                        step === 1 &&
                        (!petName.trim() ||
                          !tutorName.trim() ||
                          phone.replace(/\D/g, '').length < 10)
                      ) {
                        notify('Preencha nome do tutor, telefone e nome do cachorro')
                      } else if (step < 3) {
                        setStep(step + 1)
                      } else {
                        setConfirmed(true)
                      }
                    }}
                  >
                    {step === 3 ? 'Confirmar agendamento' : 'Continuar'}{' '}
                    <Icon name="arrow" size={17} />
                  </button>
                </div>
              </>
            ) : (
              <div className="success-state">
                <span>
                  <Icon name="check" size={32} />
                </span>
                <p className="eyebrow">Agendamento confirmado</p>
                <h2>O tempo de {petName} está reservado.</h2>
                <p>
                  Terça-feira, 18 de junho às {selectedTime}. Para consultar ou alterar a reserva,
                  use o telefone informado no agendamento.
                </p>
                <div className="booking-code">
                  <span>
                    <small>TELEFONE PARA CONSULTA</small>
                    <strong>{phone}</strong>
                  </span>
                  <Icon name="message" size={18} />
                </div>
                <button
                  className="primary-button"
                  onClick={() => {
                    setBookingOpen(false)
                    setActiveTab('agenda')
                    notify('Agendamento adicionado à agenda')
                  }}
                >
                  Ver na minha agenda
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </div>
  )
}

function AgendaView({ onBook }: { onBook: (time: string) => void }) {
  const [selectedDay, setSelectedDay] = useState(18)
  const [selectedSlot, setSelectedSlot] = useState('09:00')
  const days = [
    { week: 'SEG', day: 17, available: 2 },
    { week: 'TER', day: 18, available: 4 },
    { week: 'QUA', day: 19, available: 1 },
    { week: 'QUI', day: 20, available: 3 },
    { week: 'SEX', day: 21, available: 2 },
  ]
  const slots = ['09:00', '11:30', '14:00', '16:30']

  return (
    <div className="inner-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">Escolha com tranquilidade</p>
          <h1>Horários disponíveis</h1>
          <p>Veja a semana e reserve sem login, em poucos passos.</p>
        </div>
      </div>

      <div className="schedule-layout">
        <section className="calendar-card">
          <div className="calendar-head">
            <button aria-label="Semana anterior">←</button>
            <div>
              <strong>17 — 21 de junho</strong>
              <small>Junho de 2025</small>
            </div>
            <button aria-label="Próxima semana">→</button>
          </div>
          <div className="week-days">
            {days.map((item) => (
              <button
                key={item.day}
                className={selectedDay === item.day ? 'selected' : ''}
                onClick={() => setSelectedDay(item.day)}
              >
                <small>{item.week}</small>
                <strong>{item.day}</strong>
                <span>{item.available} horários</span>
              </button>
            ))}
          </div>
          <div className="available-slots">
            <div className="slots-heading">
              <div>
                <p className="eyebrow">Terça-feira, {selectedDay} de junho</p>
                <h2>Qual horário fica melhor?</h2>
              </div>
              <span>
                <i></i> Disponível
              </span>
            </div>
            <div className="slot-grid">
              {slots.map((slot, index) => (
                <button
                  key={slot}
                  className={selectedSlot === slot ? 'selected' : ''}
                  onClick={() => setSelectedSlot(slot)}
                >
                  <span>
                    <strong>{slot}</strong>
                    <small>{index === 0 ? 'com Marina' : '2h reservadas'}</small>
                  </span>
                  {selectedSlot === slot && <Icon name="check" size={17} />}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="schedule-summary">
          <span className="summary-icon">
            <Icon name="calendar" size={23} />
          </span>
          <p className="eyebrow">Sua escolha</p>
          <h2>
            Dia {selectedDay}, às {selectedSlot}
          </h2>
          <p>O espaço fica reservado exclusivamente para o seu pet durante todo o atendimento.</p>
          <div className="schedule-benefits">
            <span>
              <Icon name="shield" size={17} /> Sem gaiolas ou esperas
            </span>
            <span>
              <Icon name="clock" size={17} /> 2 horas com calma
            </span>
            <span>
              <Icon name="user" size={17} /> Nenhum login necessário
            </span>
          </div>
          <button className="primary-button" onClick={() => onBook(selectedSlot)}>
            Continuar agendamento <Icon name="arrow" size={17} />
          </button>
          <small>Depois, consulte a reserva usando o telefone informado.</small>
        </aside>
      </div>
    </div>
  )
}

function PetView() {
  return (
    <div className="inner-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">Cuidado que conhece cada detalhe</p>
          <h1>Perfil da Luna</h1>
          <p>Preferências salvas para todos os atendimentos.</p>
        </div>
        <button className="secondary-button">Editar perfil</button>
      </div>
      <div className="profile-grid">
        <section className="pet-hero">
          <img src={lunaPhoto} alt="Luna" />
          <div>
            <span className="status-pill">Ficha completa</span>
            <h2>Luna</h2>
            <p>Shih-tzu • 5 anos • 6,2 kg</p>
            <div className="pet-tags">
              <span>Dócil</span>
              <span>Pele sensível</span>
              <span>Gosta de pausas</span>
            </div>
          </div>
        </section>
        <section className="section-card preferences">
          <h2>Preferências de cuidado</h2>
          <div>
            <span className="pref-icon">
              <Icon name="leaf" />
            </span>
            <span>
              <strong>Produtos</strong>
              <p>Linha hipoalergênica, sem perfume</p>
            </span>
          </div>
          <div>
            <span className="pref-icon">
              <Icon name="clock" />
            </span>
            <span>
              <strong>Ritmo</strong>
              <p>Secagem suave, com uma pausa curta</p>
            </span>
          </div>
          <div>
            <span className="pref-icon">
              <Icon name="shield" />
            </span>
            <span>
              <strong>Ambiente</strong>
              <p>Sala silenciosa, longe do soprador</p>
            </span>
          </div>
        </section>
        <section className="section-card notes">
          <p className="eyebrow">Observação importante</p>
          <h2>Pele com tendência a irritação</h2>
          <p>
            Evitar produtos com fragrância e observar a região das patinhas. A equipe confirma os
            produtos antes de cada banho.
          </p>
          <span>Atualizado em 28 de maio</span>
        </section>
      </div>
    </div>
  )
}

function ReservationView() {
  const [lookupPhone, setLookupPhone] = useState('')
  const [searched, setSearched] = useState(false)
  const [lookupError, setLookupError] = useState(false)

  return (
    <div className="inner-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">Acesso sem conta</p>
          <h1>Consulte sua reserva</h1>
          <p>Use o mesmo telefone informado no agendamento.</p>
        </div>
      </div>
      <div className="reservation-lookup">
        <span className="lookup-icon">
          <Icon name="shield" size={28} />
        </span>
        <h2>Digite seu telefone</h2>
        <p>Você não precisa criar conta ou lembrar uma senha.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const valid = lookupPhone.replace(/\D/g, '').length >= 10
            setSearched(valid)
            setLookupError(!valid)
          }}
        >
          <label htmlFor="booking-lookup">Telefone do tutor</label>
          <div>
            <input
              id="booking-lookup"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={lookupPhone}
              onChange={(event) => {
                setLookupPhone(formatPhone(event.target.value))
                setSearched(false)
                setLookupError(false)
              }}
              placeholder="(51) 99999-9999"
            />
            <button className="primary-button" type="submit">
              Consultar
            </button>
          </div>
        </form>
        {lookupError && <p className="lookup-error">Informe um telefone válido com DDD.</p>}
        {searched && (
          <div className="lookup-result">
            <Icon name="check" size={19} />
            <span>
              <strong>Reserva localizada</strong>
              <small>18 de junho, às 09:00 • Banho dermatológico</small>
            </span>
          </div>
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
          <small>Online agora • resposta imediata</small>
        </div>
        <button onClick={onClose} aria-label="Fechar conversa">
          <Icon name="close" />
        </button>
      </div>
      <div className="chat-body">
        <div className="chat-time">Hoje, 20:42</div>
        <div className="bot-message">
          Oi. Que bom ter você por aqui. Como podemos cuidar do seu pet hoje?
        </div>
        {messages.map((message, i) => (
          <div className="user-message" key={i}>
            {message}
          </div>
        ))}
        {messages.length === 0 && (
          <div className="quick-replies">
            <button onClick={() => send('A pele da Luna está irritada')}>
              A pele dela está irritada
            </button>
            <button onClick={() => send('Quero agendar um horário')}>
              Quero agendar um horário
            </button>
            <button onClick={() => send('Tenho uma dúvida sobre o banho')}>
              Tenho uma dúvida sobre o banho
            </button>
          </div>
        )}
        {messages.length > 0 && (
          <div className="bot-message">
            Entendi. Obrigada por contar isso. A pele sensível da Luna merece atenção especial. Você
            percebeu vermelhidão, coceira ou alguma área mais sensível?
          </div>
        )}
      </div>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Conte o que está acontecendo..."
          aria-label="Mensagem"
        />
        <button aria-label="Enviar">
          <Icon name="send" size={19} />
        </button>
      </form>
      <div className="chat-security">
        <Icon name="shield" size={13} /> Seus dados estão protegidos
      </div>
    </div>
  )
}
