/**
 * Toolbar do Calendário — navegação, vista e tela cheia.
 * Expandir ajuda no iframe embutido do painel.
 */
import { useEffect, useState } from 'react'
import {
  IconChevronLeft,
  IconChevronRight,
  IconExpand,
} from '@/shared/icons'
import { rotuloMesAno } from '@/features/crm/tarefas/calendarioMes'
import type { VistaCal } from '../types'

type Props = {
  ano: number
  mes0: number
  vista: VistaCal
  onVista: (v: VistaCal) => void
  onHoje: () => void
  onPrev: () => void
  onNext: () => void
  sidebarAberta: boolean
  onToggleSidebar: () => void
}

export function CalToolbar({
  ano,
  mes0,
  vista,
  onVista,
  onHoje,
  onPrev,
  onNext,
  sidebarAberta,
  onToggleSidebar,
}: Props) {
  const [cheia, setCheia] = useState(Boolean(document.fullscreenElement))

  useEffect(() => {
    function onFs() {
      setCheia(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.()
    } else {
      void document.exitFullscreen?.()
    }
  }

  return (
    <header className="cal-toolbar">
      <div className="cal-toolbar-left">
        <button
          type="button"
          className="btn btn-outline btn-sm cal-toggle-side"
          onClick={onToggleSidebar}
          aria-pressed={sidebarAberta}
          title={sidebarAberta ? 'Ocultar agendas' : 'Mostrar agendas'}
        >
          {sidebarAberta ? 'Ocultar menus' : 'Menus'}
        </button>
        <h1 className="cal-titulo">Calendário</h1>
        <button type="button" className="btn btn-outline btn-sm" onClick={onHoje}>
          Hoje
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-icon-sm"
          aria-label="Anterior"
          onClick={onPrev}
        >
          <IconChevronLeft />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-icon-sm"
          aria-label="Próximo"
          onClick={onNext}
        >
          <IconChevronRight />
        </button>
        <span className="cal-mes-label">{rotuloMesAno(ano, mes0)}</span>
      </div>

      <div className="cal-toolbar-right">
        <div className="cal-vista-toggle">
          <button
            type="button"
            className={vista === 'mensal' ? 'is-active' : ''}
            onClick={() => onVista('mensal')}
          >
            Mensal
          </button>
          <button
            type="button"
            className={vista === 'lista' ? 'is-active' : ''}
            onClick={() => onVista('lista')}
          >
            Em Lista
          </button>
        </div>
        <button
          type="button"
          className={`btn btn-outline btn-sm${cheia ? ' is-on-fs' : ''}`}
          onClick={toggleFullscreen}
          aria-label={cheia ? 'Sair da tela cheia' : 'Expandir calendário'}
          title={cheia ? 'Sair da tela cheia' : 'Expandir calendário'}
        >
          <IconExpand />
          <span className="cal-fs-label">{cheia ? 'Reduzir' : 'Expandir'}</span>
        </button>
      </div>
    </header>
  )
}
