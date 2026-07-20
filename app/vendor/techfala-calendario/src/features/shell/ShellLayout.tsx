/**
 * Layout: sidebar esquerda + área principal.
 * Espelha o shell Bubble + React CRM do dump.
 */
import type { ReactNode } from 'react'
import { SideNav } from './SideNav'
import type { RotaId } from './navItems'

type Props = {
  rota: RotaId
  onNavigate: (id: RotaId) => void
  children: ReactNode
}

export function ShellLayout({ rota, onNavigate, children }: Props) {
  return (
    <div className="app-shell">
      <SideNav ativa={rota} onNavigate={onNavigate} />
      <div className="app-main">{children}</div>
    </div>
  )
}
