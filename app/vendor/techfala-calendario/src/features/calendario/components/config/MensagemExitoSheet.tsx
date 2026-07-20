/**
 * Sidebar “Mensagem de Êxito” — quando dispara + formato WhatsApp + conteúdo.
 * Envio é sempre WhatsApp; tipo = Texto|Imagem|Arquivo|Vídeo|Áudio.
 */
import { useState } from 'react'
import { IconMessage, IconX } from '@/shared/icons'
import {
  MOMENTOS_MSG,
  TIPOS_MSG,
  normalizarTipoMsg,
  type TipoMsg,
} from '../../lib/opcoesConfigSheets'
import type { MensagemExito } from '../../types/agendaConfig'

type Props = {
  inicial?: MensagemExito | null
  onClose: () => void
  onSalvar: (m: MensagemExito) => void
}

function vazio(): MensagemExito {
  return {
    id: `msg-${crypto.randomUUID().slice(0, 6)}`,
    titulo: '',
    enviarAo: MOMENTOS_MSG[0],
    tipo: 'Texto',
    texto: '',
  }
}

export function MensagemExitoSheet({ inicial, onClose, onSalvar }: Props) {
  const [form, setForm] = useState<MensagemExito>(() => {
    if (!inicial) return vazio()
    return { ...vazio(), ...inicial, tipo: normalizarTipoMsg(inicial.tipo) }
  })

  const tipo = normalizarTipoMsg(form.tipo) as TipoMsg
  const eTexto = tipo === 'Texto'
  const valido =
    Boolean(form.titulo.trim()) &&
    Boolean(form.enviarAo) &&
    Boolean(form.texto.trim())

  return (
    <div className="cal-overlay cal-overlay-nested" role="presentation" onClick={onClose}>
      <aside
        className="cal-sheet is-nested"
        role="dialog"
        aria-label="Mensagem de Êxito"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cal-sheet-head">
          <div className="cal-sheet-title-row">
            <span className="cal-sheet-icon cfg-head-ico">
              <IconMessage />
            </span>
            <h2>Mensagem de Êxito</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar">
            <IconX />
          </button>
        </header>

        <div className="cal-sheet-body cfg-stack">
          <label className="field">
            <span>Título da Mensagem: *</span>
            <input
              className="input"
              placeholder="Título da Mensagem"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Enviar ao realizar um: *</span>
            <select
              className="input"
              value={form.enviarAo}
              onChange={(e) => setForm({ ...form, enviarAo: e.target.value })}
            >
              {MOMENTOS_MSG.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Tipo de Mensagem:</span>
            <select
              className="input"
              value={tipo}
              onChange={(e) =>
                setForm({ ...form, tipo: normalizarTipoMsg(e.target.value) })
              }
            >
              {TIPOS_MSG.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <span className="cfg-card-meta">
              Sempre enviada no WhatsApp — escolha só o formato do conteúdo.
            </span>
          </label>

          <label className="field">
            <span>
              {eTexto ? 'Conteúdo da Mensagem: *' : `Link / URL do(a) ${tipo}: *`}
            </span>
            {eTexto ? (
              <textarea
                className="input textarea cfg-textarea-lg"
                placeholder="Conteúdo da mensagem..."
                value={form.texto}
                onChange={(e) => setForm({ ...form, texto: e.target.value })}
              />
            ) : (
              <input
                className="input"
                type="url"
                placeholder="https://..."
                value={form.texto}
                onChange={(e) => setForm({ ...form, texto: e.target.value })}
              />
            )}
          </label>
        </div>

        <footer className="cal-sheet-foot" style={{ justifyContent: 'flex-end' }}>
          <div className="cal-sheet-foot-right">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!valido}
              onClick={() =>
                onSalvar({
                  ...form,
                  tipo,
                  titulo: form.titulo.trim(),
                  texto: form.texto.trim(),
                })
              }
            >
              Salvar
            </button>
          </div>
        </footer>
      </aside>
    </div>
  )
}
