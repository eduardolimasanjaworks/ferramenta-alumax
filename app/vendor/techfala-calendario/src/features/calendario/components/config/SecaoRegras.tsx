/**
 * Regras de Agendamento — alinhado ao Bubble: texto livre + limites + toggles.
 * “Tipo” = o que se agenda (não select Fila/Consulta).
 */
import type { AgendaConfig } from '../../types/agendaConfig'
import { CfgToggleLinha } from './CfgToggleLinha'

type Props = {
  config: AgendaConfig
  linkChamada: string
  onLinkChamada: (v: string) => void
  onChange: (patch: Partial<AgendaConfig>) => void
}

export function SecaoRegras({
  config,
  linkChamada,
  onLinkChamada,
  onChange,
}: Props) {
  return (
    <div className="cfg-stack">
      <label className="field">
        <span>Tipo de agendamento: *</span>
        <input
          className="input"
          placeholder="O que será agendado ou marcado nesta agenda?"
          value={config.tipoAgendamento}
          onChange={(e) => onChange({ tipoAgendamento: e.target.value })}
        />
      </label>

      <label className="field">
        <span>Limite de dias para agendamentos futuros: *</span>
        <input
          type="number"
          className="input"
          min={1}
          placeholder="Quantos dias à frente o assistente pode agendar?"
          value={config.limiteDiasFuturos}
          onChange={(e) =>
            onChange({ limiteDiasFuturos: Number(e.target.value) || 1 })
          }
        />
      </label>

      <label className="field">
        <span>Número de horários disponíveis para o cliente: *</span>
        <input
          type="number"
          className="input"
          min={1}
          placeholder="Quantos horários o assistente deve exibir?"
          value={config.numHorariosCliente}
          onChange={(e) =>
            onChange({ numHorariosCliente: Number(e.target.value) || 1 })
          }
        />
      </label>

      <label className="field">
        <span>Antecedência mínima de agendamento: *</span>
        <select
          className="input"
          value={config.antecedenciaMinutos}
          onChange={(e) =>
            onChange({ antecedenciaMinutos: Number(e.target.value) })
          }
        >
          {[15, 30, 60, 120, 240, 1440].map((m) => (
            <option key={m} value={m}>
              {m < 60 ? `${m} min` : m === 1440 ? '1 dia' : `${m / 60} h`}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Quando o assistente deve usar esta agenda:</span>
        <textarea
          className="input textarea"
          value={config.descricaoPublica}
          onChange={(e) => onChange({ descricaoPublica: e.target.value })}
          placeholder="Ex.: propostas comerciais, primeiros contatos de venda…"
          rows={2}
        />
      </label>

      <CfgToggleLinha
        checked={config.notifPadraoDesativadas}
        onChange={(v) => onChange({ notifPadraoDesativadas: v })}
        labelAtivo=""
        labelDesativado=""
        textoAtivo="Os eventos criados pelo assistente, terão por padrão as notificações de agenda Desativadas"
        textoDesativado="Os eventos criados pelo assistente, terão por padrão as notificações de agenda Ativadas"
      />

      <label className="field">
        <span>Link de chamada padrão:</span>
        <input
          className="input"
          placeholder="Ex: meet.google.com/meulink"
          value={linkChamada}
          onChange={(e) => onLinkChamada(e.target.value)}
        />
      </label>

      <CfgToggleLinha
        checked={config.semSobreposicao}
        onChange={(v) => onChange({ semSobreposicao: v })}
        labelAtivo="Não Permitir"
        labelDesativado="Permitir"
        textoAtivo="sobreposição de eventos na agenda."
        textoDesativado="sobreposição de eventos na agenda."
      />

      <CfgToggleLinha
        checked={Boolean(config.naoSincronizarOutrasAgendas)}
        onChange={(v) => onChange({ naoSincronizarOutrasAgendas: v })}
        labelAtivo="Não Sincronizar"
        labelDesativado="Sincronizar"
        textoAtivo="disponibilidade com outras agendas"
        textoDesativado="disponibilidade com outras agendas (mesmo colaborador/equipe)"
      />
    </div>
  )
}
