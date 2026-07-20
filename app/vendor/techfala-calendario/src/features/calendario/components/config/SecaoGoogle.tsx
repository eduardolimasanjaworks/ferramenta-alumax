/**
 * Seção Google Calendar — toggle, ID, testar conexão e regras do clone.
 * Teste usa GoogleCalendarPort (stub hoje; adapter real depois).
 */
import { useState } from 'react'
import { GOOGLE_SHARE_EMAIL } from '../../domain/defaults'
import {
  GOOGLE_HELP_EXPECTATIVAS,
  GOOGLE_HELP_PASSOS,
} from '../../domain/googleHelp'
import { useCalendario } from '../../store/calendarioStore'
import type { AgendaConfig } from '../../types/agendaConfig'
import { CfgToggleLinha } from './CfgToggleLinha'

type Props = {
  config: AgendaConfig
  onChange: (patch: Partial<AgendaConfig>) => void
}

export function SecaoGoogle({ config, onChange }: Props) {
  const { services } = useCalendario()
  const [status, setStatus] = useState('')

  async function testar() {
    setStatus('Testando…')
    const { testarGoogleApi } = await import('../../lib/apiCalendario')
    const r = await testarGoogleApi(config.googleAgendaId)
    if (r.ok) {
      setStatus('Conexão OK.')
      if (!config.googleConectado) onChange({ googleConectado: true })
      return
    }
    // Fallback stub local + mensagem clara
    const local = await services.google.testarConexao(config.googleAgendaId)
    setStatus(r.erro || local.erro || 'Falha na conexão')
    if (local.ok && !r.erro?.includes('não configurado')) {
      onChange({ googleConectado: true })
    }
  }

  return (
    <div className="cfg-stack">
      <p className="cfg-help-lead">
        Conecte sua agenda com uma agenda Google. Compartilhe com{' '}
        <strong>{GOOGLE_SHARE_EMAIL}</strong> (fazer alterações nos eventos).
      </p>

      <CfgToggleLinha
        checked={config.googleConectado}
        onChange={(v) => onChange({ googleConectado: v })}
        textoAtivo="Conexão com google ativa."
        textoDesativado="Conexão com google inativa."
      />

      <label className="field">
        <span>Id da agenda google:</span>
        <input
          className="input"
          value={config.googleAgendaId}
          onChange={(e) => onChange({ googleAgendaId: e.target.value })}
          placeholder="Cole o ID da agenda"
          disabled={!config.googleConectado && !config.googleAgendaId}
        />
      </label>

      <button
        type="button"
        className="btn btn-outline"
        onClick={() => void testar()}
        disabled={!config.googleAgendaId.trim()}
      >
        Testar conexão
      </button>
      {status ? <p className="cfg-card-meta">{status}</p> : null}

      <ol className="cfg-help-list">
        {GOOGLE_HELP_PASSOS.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>

      <p className="cfg-help-sub">O que você deve esperar dessa conexão:</p>
      <ul className="cfg-help-list">
        {GOOGLE_HELP_EXPECTATIVAS.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  )
}
