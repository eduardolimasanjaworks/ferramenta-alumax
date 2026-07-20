/**
 * Modal “Nova Agenda” — nome, cor, tempo padrão e tipo.
 * Espelha o popup de referência sem markup Bubble.
 */
import { useState } from 'react'
import { IconX } from '@/shared/icons'
import { ModalZoomBar, useModalZoom } from '@/shared/ui/ModalZoom'
import { configAgendaPadrao } from '../lib/configAgendaPadrao'
import { TEMPOS_PADRAO, TIPOS_AGENDA } from '../store/defaultData'
import { useCalendario } from '../store/calendarioStore'

type Props = {
  onClose: () => void
  onCriada?: (id: string) => void
}

export function NovaAgendaModal({ onClose, onCriada }: Props) {
  const { criarAgenda } = useCalendario()
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState('#f5008d')
  const [tempo, setTempo] = useState(60)
  const [tipo, setTipo] = useState(TIPOS_AGENDA[0])
  const { zoom, zoomIn, zoomOut, zoomReset } = useModalZoom()

  const valido = Boolean(nome.trim())

  function salvar() {
    if (!valido) return
    const a = criarAgenda({
      nome: nome.trim(),
      cor,
      tempoPadraoMin: tempo,
      tipo,
      ativo: false,
      linkPublicoAtivo: false,
      visivel: true,
      linkChamadaPadrao: '',
      config: configAgendaPadrao(),
    })
    onCriada?.(a.id)
    onClose()
  }

  return (
    <div className="cal-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="cal-modal cal-modal-sm"
        role="dialog"
        aria-label="Nova Agenda"
        style={{ transform: `scale(${zoom})` }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cal-modal-head">
          <h2>Nova Agenda</h2>
          <div className="cal-modal-head-tools">
            <ModalZoomBar
              zoom={zoom}
              onIn={zoomIn}
              onOut={zoomOut}
              onReset={zoomReset}
            />
            <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar">
              <IconX />
            </button>
          </div>
        </header>

        <div className="cal-modal-body">
          <label className="field">
            <span>Nome da Agenda: *</span>
            <div className="cal-input-cor">
              <input
                className="input"
                placeholder="Nome da agenda"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                aria-label="Cor"
              />
            </div>
          </label>

          <label className="field">
            <span>Tempo Padrão dos Eventos: *</span>
            <select
              className="input"
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
            >
              {TEMPOS_PADRAO.map((t) => (
                <option key={t.min} value={t.min}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Tipo de Calendário:</span>
            <select
              className="input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {TIPOS_AGENDA.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <footer className="cal-sheet-foot">
          <span />
          <div className="cal-sheet-foot-right">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!valido}
              onClick={salvar}
            >
              Salvar
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
