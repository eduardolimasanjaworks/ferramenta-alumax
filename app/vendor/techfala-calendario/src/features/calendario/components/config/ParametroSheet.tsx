/**
 * Sidebar “Novo Parâmetro” — dados que o assistente coleta na conversa.
 * Tipo = formato do dado (Texto, Telefone…), não canal de envio.
 */
import { useState } from 'react'
import { IconWorkflow, IconX } from '@/shared/icons'
import { MOMENTOS_PARAM, TIPOS_PARAM } from '../../lib/opcoesConfigSheets'
import type { ParametroAgenda } from '../../types/agendaConfig'
import { CfgToggleLinha } from './CfgToggleLinha'

type Props = {
  inicial?: ParametroAgenda | null
  onClose: () => void
  onSalvar: (p: ParametroAgenda) => void
}

function vazio(): ParametroAgenda {
  return {
    id: `prm-${crypto.randomUUID().slice(0, 6)}`,
    nome: '',
    solicitarAo: MOMENTOS_PARAM[0],
    descricao: '',
    tipo: TIPOS_PARAM[0],
    naoObrigatorio: true,
    limitarOpcoes: false,
  }
}

export function ParametroSheet({ inicial, onClose, onSalvar }: Props) {
  const [form, setForm] = useState<ParametroAgenda>(() =>
    inicial
      ? {
          ...vazio(),
          ...inicial,
          descricao: inicial.descricao || inicial.valor || '',
        }
      : vazio(),
  )

  const valido =
    Boolean(form.nome.trim()) &&
    Boolean(form.solicitarAo) &&
    Boolean(form.tipo) &&
    Boolean(form.descricao.trim())

  return (
    <div className="cal-overlay cal-overlay-nested" role="presentation" onClick={onClose}>
      <aside
        className="cal-sheet is-nested"
        role="dialog"
        aria-label="Novo Parâmetro"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cal-sheet-head">
          <div className="cal-sheet-title-row">
            <span className="cal-sheet-icon cfg-head-ico">
              <IconWorkflow />
            </span>
            <h2>Novo Parâmetro</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar">
            <IconX />
          </button>
        </header>

        <div className="cal-sheet-body cfg-stack">
          <label className="field">
            <span>Nome do Parâmetro: *</span>
            <input
              className="input"
              placeholder="Nome do Parâmetro"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Solicitar ao realizar: *</span>
            <select
              className="input"
              value={form.solicitarAo}
              onChange={(e) => setForm({ ...form, solicitarAo: e.target.value })}
            >
              {MOMENTOS_PARAM.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>

          <CfgToggleLinha
            checked={form.naoObrigatorio}
            onChange={(v) => setForm({ ...form, naoObrigatorio: v })}
            labelAtivo="Não Obrigatório"
            labelDesativado="Obrigatório"
            textoAtivo="O assistente pode agendar mesmo sem recolher esse dado na conversa."
            textoDesativado="Este parâmetro precisa ser preenchido para concluir o fluxo."
          />

          <label className="field">
            <span>Descrição do Parâmetro: *</span>
            <textarea
              className="input textarea cfg-textarea-lg"
              placeholder="Escreva a descrição desse parâmetro..."
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Tipo do Parâmetro: *</span>
            <select
              className="input"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              {TIPOS_PARAM.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <span className="cfg-card-meta">
              Formato do dado coletado (ex.: Telefone, E-mail) — não é canal de envio.
            </span>
          </label>

          <CfgToggleLinha
            checked={form.limitarOpcoes}
            onChange={(v) => setForm({ ...form, limitarOpcoes: v })}
            textoAtivo="Seu assistente estará limitado a uma lista de opções para preencher esse parâmetro."
            textoDesativado="Seu assistente NÃO estará limitado a uma lista de opções para preencher esse parâmetro."
          />
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
              onClick={() => onSalvar({ ...form, nome: form.nome.trim() })}
            >
              Salvar
            </button>
          </div>
        </footer>
      </aside>
    </div>
  )
}
