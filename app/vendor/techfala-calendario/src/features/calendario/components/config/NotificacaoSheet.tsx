/**
 * Sheet “Criar Notificação” — tempo relativo, momento, WhatsApp e telefone.
 * Abre por cima da Configurar Agenda (padrão dos outros sheets nested).
 */
import { useState } from 'react'
import { IconX } from '@/shared/icons'
import { MOMENTOS_NOTIF, TIPOS_NOTIF } from '../../lib/opcoesNotif'
import type { NotificacaoAgenda } from '../../types/agendaConfig'
import { CfgToggleLinha } from './CfgToggleLinha'

type Props = {
  inicial?: NotificacaoAgenda | null
  onClose: () => void
  onSalvar: (n: NotificacaoAgenda) => void
}

function vazio(): NotificacaoAgenda {
  return {
    id: `ntf-${crypto.randomUUID().slice(0, 6)}`,
    titulo: '',
    tipo: TIPOS_NOTIF[0],
    dias: 0,
    horas: 1,
    minutos: 0,
    momento: 'Antes',
    mensagem: '',
    whatsappParticipantes: true,
    whatsappTerceiro: false,
    telefoneTerceiro: '',
  }
}

function Spin({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="cfg-spin">
      <span>
        {value} {label}
      </span>
      <div className="cfg-spin-btns">
        <button type="button" onClick={() => onChange(value + 1)} aria-label={`+ ${label}`}>
          ▲
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`- ${label}`}
          disabled={value <= 0}
        >
          ▼
        </button>
      </div>
    </div>
  )
}

export function NotificacaoSheet({ inicial, onClose, onSalvar }: Props) {
  const [form, setForm] = useState<NotificacaoAgenda>(() =>
    inicial ? { ...vazio(), ...inicial, telefoneTerceiro: inicial.telefoneTerceiro ?? '' } : vazio(),
  )

  const valido = Boolean(form.titulo.trim())

  return (
    <div className="cal-overlay cal-overlay-nested" role="presentation" onClick={onClose}>
      <aside
        className="cal-sheet is-nested"
        role="dialog"
        aria-label="Criar Notificação"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cal-sheet-head">
          <div className="cal-sheet-title-row">
            <span className="cal-sheet-icon cfg-head-ico" />
            <h2>Criar Notificação</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar">
            <IconX />
          </button>
        </header>

        <div className="cal-sheet-body cfg-stack">
          <div className="cal-form-row2">
            <label className="field">
              <span>Título da Notificação: *</span>
              <input
                className="input"
                placeholder="Título da Notificação"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Tipo de Notificação:</span>
              <select
                className="input"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                {TIPOS_NOTIF.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>

          <section className="cfg-acc is-open">
            <div className="cfg-acc-head" style={{ cursor: 'default' }}>
              <span className="cfg-acc-left">Envio de Notificação</span>
            </div>
            <div className="cfg-acc-body cfg-stack">
              <div className="cfg-envio-row">
                <span>Em quanto tempo?</span>
                <Spin
                  label="dias"
                  value={form.dias}
                  onChange={(dias) => setForm({ ...form, dias })}
                />
                <Spin
                  label="horas"
                  value={form.horas}
                  onChange={(horas) => setForm({ ...form, horas })}
                />
                <Spin
                  label="mnt."
                  value={form.minutos}
                  onChange={(minutos) => setForm({ ...form, minutos })}
                />
              </div>
              <label className="field">
                <span>Em que momento?</span>
                <select
                  className="input"
                  value={form.momento}
                  onChange={(e) => setForm({ ...form, momento: e.target.value })}
                >
                  {MOMENTOS_NOTIF.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <label className="field">
            <span>Texto da Mensagem:</span>
            <textarea
              className="input textarea cfg-textarea-lg"
              placeholder="Escreva o conteúdo da sua mensagem..."
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
            />
          </label>

          <CfgToggleLinha
            checked={form.whatsappParticipantes}
            onChange={(v) => setForm({ ...form, whatsappParticipantes: v })}
            labelAtivo="Notificar"
            labelDesativado="Não notificar"
            textoAtivo="participantes com WhatsApp cadastrado."
            textoDesativado="participantes com WhatsApp cadastrado."
          />

          <CfgToggleLinha
            checked={form.whatsappTerceiro}
            onChange={(v) => setForm({ ...form, whatsappTerceiro: v })}
            labelAtivo="Ativado"
            labelDesativado="Desativado"
            textoAtivo="Notificar WhatsApp terceiro."
            textoDesativado="Notificar WhatsApp terceiro?"
          />

          {form.whatsappTerceiro ? (
            <label className="field">
              <span>Número do WhatsApp a ser notificado:</span>
              <input
                className="input"
                type="tel"
                placeholder="11 96123-4567"
                value={form.telefoneTerceiro}
                onChange={(e) =>
                  setForm({ ...form, telefoneTerceiro: e.target.value })
                }
              />
            </label>
          ) : null}
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
                onSalvar({ ...form, titulo: form.titulo.trim() })
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
