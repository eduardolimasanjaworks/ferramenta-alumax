/**
 * Página da aba Calendário — sidebar esquerda + grade principal.
 * Layout fiel ao dump TechFala (sem markup Bubble).
 */
import { useState } from 'react'
import { CalSideBar } from './components/CalSideBar'
import { CalToolbar } from './components/CalToolbar'
import { ConfigAgendaSheet } from './components/ConfigAgendaSheet'
import { EventoSheet } from './components/EventoSheet'
import { NovaAgendaModal } from './components/NovaAgendaModal'
import { VistaLista } from './components/VistaLista'
import { VistaMensal } from './components/VistaMensal'
import { isoHoje } from './lib/formatData'
import { CalendarioProvider } from './store/calendarioStore'
import type { Agenda, Evento, VistaCal } from './types'

function CalendarioBoard() {
  const agora = new Date()
  const [ano, setAno] = useState(agora.getFullYear())
  const [mes0, setMes0] = useState(agora.getMonth())
  const [diaSel, setDiaSel] = useState(isoHoje())
  const [vista, setVista] = useState<VistaCal>('mensal')

  const [eventoAberto, setEventoAberto] = useState(false)
  const [dataEvento, setDataEvento] = useState<string | undefined>()
  const [editando, setEditando] = useState<Evento | null>(null)
  const [novaAgendaAberto, setNovaAgendaAberto] = useState(false)
  const [configAgenda, setConfigAgenda] = useState<Agenda | null>(null)
  const [sidebarAberta, setSidebarAberta] = useState(true)

  function irHoje() {
    const d = new Date()
    setAno(d.getFullYear())
    setMes0(d.getMonth())
    setDiaSel(isoHoje(d))
  }

  function prev() {
    if (mes0 === 0) {
      setAno((y) => y - 1)
      setMes0(11)
    } else setMes0((m) => m - 1)
  }

  function next() {
    if (mes0 === 11) {
      setAno((y) => y + 1)
      setMes0(0)
    } else setMes0((m) => m + 1)
  }

  function abrirNovo(iso?: string) {
    setEditando(null)
    setDataEvento(iso ?? diaSel)
    setEventoAberto(true)
  }

  function abrirEditar(ev: Evento) {
    setEditando(ev)
    setDataEvento(ev.data)
    setEventoAberto(true)
  }

  function selecionarDia(iso: string) {
    setDiaSel(iso)
    const [y, m] = iso.split('-').map(Number)
    if (y && m) {
      setAno(y)
      setMes0(m - 1)
    }
  }

  return (
    <div className={`cal-page${sidebarAberta ? '' : ' is-side-collapsed'}`}>
      {sidebarAberta ? (
        <CalSideBar
          ano={ano}
          mes0={mes0}
          diaSelecionado={diaSel}
          onPrev={prev}
          onNext={next}
          onSelectDia={selecionarDia}
          onNovoEvento={() => abrirNovo(diaSel)}
          onNovaAgenda={() => setNovaAgendaAberto(true)}
          onConfigurar={setConfigAgenda}
        />
      ) : null}

      <div className="cal-main">
        <CalToolbar
          ano={ano}
          mes0={mes0}
          vista={vista}
          onVista={setVista}
          onHoje={irHoje}
          onPrev={prev}
          onNext={next}
          sidebarAberta={sidebarAberta}
          onToggleSidebar={() => setSidebarAberta((v) => !v)}
        />

        <div className="cal-board">
          {vista === 'mensal' ? (
            <VistaMensal
              ano={ano}
              mes0={mes0}
              diaSelecionado={diaSel}
              onDiaClick={(iso) => {
                setDiaSel(iso)
                abrirNovo(iso)
              }}
              onEventoClick={abrirEditar}
            />
          ) : (
            <VistaLista
              diaSelecionado={diaSel}
              onEventoClick={abrirEditar}
              onNovoEvento={() => abrirNovo(diaSel)}
            />
          )}
        </div>
      </div>

      {eventoAberto ? (
        <EventoSheet
          dataInicial={dataEvento}
          editando={editando}
          onClose={() => {
            setEventoAberto(false)
            setEditando(null)
          }}
        />
      ) : null}

      {novaAgendaAberto ? (
        <NovaAgendaModal onClose={() => setNovaAgendaAberto(false)} />
      ) : null}

      {configAgenda ? (
        <ConfigAgendaSheet
          agenda={configAgenda}
          onClose={() => setConfigAgenda(null)}
          onSelecionar={setConfigAgenda}
        />
      ) : null}
    </div>
  )
}

export function CalendarioPage() {
  return (
    <CalendarioProvider>
      <CalendarioBoard />
    </CalendarioProvider>
  )
}
