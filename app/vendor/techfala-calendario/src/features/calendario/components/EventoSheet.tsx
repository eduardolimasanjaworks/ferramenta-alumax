/**
 * Sheet direito Novo/Editar Evento — serviço, conflito e zoom do painel.
 */
import { useMemo, useState } from 'react'
import { IconX } from '@/shared/icons'
import { ModalZoomBar, useModalZoom } from '@/shared/ui/ModalZoom'
import { diffMinutos, isoHoje, somarMinutos } from '../lib/formatData'
import { useCalendario } from '../store/calendarioStore'
import type { Evento } from '../types'
import { EventoDataHora } from './EventoDataHora'

type Props = {
  dataInicial?: string
  editando?: Evento | null
  onClose: () => void
}

export function EventoSheet({ dataInicial, editando, onClose }: Props) {
  const {
    agendas, criarEvento, atualizarEvento, removerEvento,
    servicosDaAgenda, recursoDaAgenda, checarConflito,
  } = useCalendario()

  const ativas = agendas.filter((a) => a.ativo)
  const agenda0 = ativas[0] ?? agendas[0]
  const agendaId0 = editando?.agendaId ?? agenda0?.id ?? ''
  const svcs0 = servicosDaAgenda(agendaId0)

  const [titulo, setTitulo] = useState(editando?.titulo ?? '')
  const [cor, setCor] = useState(editando?.cor ?? agenda0?.cor ?? '#f5008d')
  const [agendaId, setAgendaId] = useState(agendaId0)
  const [servicoId, setServicoId] = useState(editando?.servicoId ?? svcs0[0]?.id ?? '')
  const [data, setData] = useState(editando?.data ?? dataInicial ?? isoHoje())
  const [horaInicio, setHoraInicio] = useState(editando?.horaInicio ?? '09:00')
  const [horaFim, setHoraFim] = useState(editando?.horaFim ?? '10:00')
  const [diaTodo, setDiaTodo] = useState(editando?.diaTodo ?? false)
  const [convidado, setConvidado] = useState(editando?.convidado ?? '')
  const [link, setLink] = useState(editando?.linkChamada ?? '')
  const [notas, setNotas] = useState(editando?.notas ?? '')
  const [notificacoes, setNotificacoes] = useState(editando?.notificacoes ?? false)
  const [erro, setErro] = useState('')
  const { zoom, zoomIn, zoomOut, zoomReset } = useModalZoom()

  const svcs = servicosDaAgenda(agendaId)
  const recurso = recursoDaAgenda(agendaId)
  const valido = Boolean(titulo.trim() && agendaId && data)
  const duracao = useMemo(() => diffMinutos(horaInicio, horaFim), [horaInicio, horaFim])

  function aplicarServico(sid: string, inicio = horaInicio) {
    setServicoId(sid)
    const s = svcs.find((x) => x.id === sid) ?? servicosDaAgenda(agendaId).find((x) => x.id === sid)
    if (s) {
      setHoraFim(somarMinutos(inicio, s.duracaoMin))
      if (s.cor) setCor(s.cor)
    }
  }

  function onAgendaChange(id: string) {
    setAgendaId(id)
    const a = agendas.find((x) => x.id === id)
    const list = servicosDaAgenda(id)
    if (a && !editando) {
      setCor(a.cor)
      if (a.linkChamadaPadrao) setLink(a.linkChamadaPadrao)
    }
    if (list[0]) aplicarServico(list[0].id, horaInicio)
    else if (a) setHoraFim(somarMinutos(horaInicio, a.tempoPadraoMin))
  }

  function salvar() {
    if (!valido) return
    const payload: Omit<Evento, 'id'> = {
      titulo: titulo.trim(),
      cor,
      agendaId,
      recursoId: recurso?.id,
      servicoId: servicoId || null,
      data,
      horaInicio: diaTodo ? '00:00' : horaInicio,
      horaFim: diaTodo ? '23:59' : horaFim,
      diaTodo,
      convidado: convidado.trim(),
      linkChamada: link.trim(),
      notas: notas.trim(),
      notificacoes,
    }
    const candidato: Evento = { id: editando?.id ?? 'novo', ...payload }
    const msg = checarConflito(candidato)
    if (msg) { setErro(msg); return }
    if (editando) atualizarEvento(editando.id, payload)
    else criarEvento(payload)
    onClose()
  }

  return (
    <div className="cal-overlay" role="presentation" onClick={onClose}>
      <aside
        className="cal-sheet"
        role="dialog"
        aria-label={editando ? 'Editar Evento' : 'Novo Evento'}
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top right' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cal-sheet-head">
          <div className="cal-sheet-title-row">
            <span className="cal-sheet-icon" style={{ background: cor }} />
            <h2>{editando ? 'Editar Evento' : 'Novo Evento'}</h2>
          </div>
          <div className="cal-modal-head-tools">
            <ModalZoomBar zoom={zoom} onIn={zoomIn} onOut={zoomOut} onReset={zoomReset} />
            <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar">
              <IconX />
            </button>
          </div>
        </header>

        <div className="cal-sheet-body">
          {erro ? <p className="cfg-erro">{erro}</p> : null}

          <div className="cal-form-row2">
            <label className="field">
              <span>Título do Evento: *</span>
              <div className="cal-input-cor">
                <input
                  className="input"
                  placeholder="Título do Evento"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
                <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} aria-label="Cor" />
              </div>
            </label>
            <label className="field">
              <span>Agenda: *</span>
              <select className="input" value={agendaId} onChange={(e) => onAgendaChange(e.target.value)}>
                {agendas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Serviço:</span>
            <select className="input" value={servicoId} onChange={(e) => aplicarServico(e.target.value)}>
              <option value="">—</option>
              {svcs.map((s) => (
                <option key={s.id} value={s.id}>{s.nome} ({s.duracaoMin} min)</option>
              ))}
            </select>
          </label>

          <EventoDataHora
            data={data}
            setData={setData}
            horaInicio={horaInicio}
            onInicioChange={(h) => {
              setHoraInicio(h)
              if (servicoId) aplicarServico(servicoId, h)
            }}
            horaFim={horaFim}
            setHoraFim={setHoraFim}
            diaTodo={diaTodo}
            setDiaTodo={setDiaTodo}
            duracao={duracao}
          />

          <label className="field">
            <span>Convidado:</span>
            <input className="input" value={convidado} onChange={(e) => setConvidado(e.target.value)} />
          </label>
          <label className="field">
            <span>Link da chamada:</span>
            <input className="input" value={link} onChange={(e) => setLink(e.target.value)} />
          </label>
          <label className="field">
            <span>Adicionar Notas:</span>
            <textarea className="input textarea" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </label>

          <label className="cal-switch-row">
            <button
              type="button"
              role="switch"
              aria-checked={notificacoes}
              className={`campo-switch${notificacoes ? ' is-on' : ''}`}
              onClick={() => setNotificacoes((v) => !v)}
            >
              <span className="campo-switch-knob" />
            </button>
            <span>
              Notificações <strong>{notificacoes ? 'ativadas' : 'desativadas'}</strong> para esse evento.
            </span>
          </label>
        </div>

        <footer className="cal-sheet-foot">
          {editando ? (
            <button
              type="button"
              className="btn btn-outline danger-text"
              onClick={() => {
                if (window.confirm('Excluir este evento?')) {
                  removerEvento(editando.id)
                  onClose()
                }
              }}
            >
              Excluir
            </button>
          ) : (
            <span />
          )}
          <div className="cal-sheet-foot-right">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-primary" disabled={!valido} onClick={salvar}>Salvar</button>
          </div>
        </footer>
      </aside>
    </div>
  )
}
