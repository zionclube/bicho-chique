import type { ReactNode } from 'react'

export function LojaShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#24362f]">
      <header className="topbar">
        <a className="brand" href="/">
          <img
            className="brand-logo"
            src="/assets/bicho-chique-logo.png"
            alt="Bicho Chique Estética Animal"
          />
        </a>
        <div className="header-actions">
          <a className="reservation-access" href="/conta">
            Minha conta
          </a>
          <a className="reservation-access" href="/painel">
            Administração
          </a>
        </div>
      </header>
      <main className="account-page">{children}</main>
    </div>
  )
}
