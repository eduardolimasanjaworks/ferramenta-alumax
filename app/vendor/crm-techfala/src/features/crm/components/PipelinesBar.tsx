/**
 * Seletor + CRUD simples de funis (pipelines) do CRM.
 * Alterna o board ativo; ao apagar, move colunas/cards para outro funil.
 */
import { useEffect, useState } from 'react'
import { crmFetch } from '@/shared/lib/crmApi'
import type { Pipeline } from '@/shared/types/crm'

type Props = {
  pipelineId: string | null
  onChange: (id: string) => void
}

export function PipelinesBar({ pipelineId, onChange }: Props) {
  const [pipes, setPipes] = useState<Pipeline[]>([])
  const [aberto, setAberto] = useState(false)
  const [nomeNovo, setNomeNovo] = useState('')
  const [erro, setErro] = useState('')

  async function reload() {
    const r = await crmFetch<{ pipelines: Pipeline[] }>('/pipelines')
    setPipes(r.pipelines || [])
    if (!pipelineId && r.pipelines?.length) {
      const prin = r.pipelines.find((p) => p.principal) || r.pipelines[0]
      onChange(prin.id)
    }
  }

  useEffect(() => {
    void reload().catch((e) => setErro(e instanceof Error ? e.message : 'Erro funis'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function criar() {
    if (!nomeNovo.trim()) return
    const r = await crmFetch<{ pipeline: Pipeline }>('/pipelines', {
      method: 'POST',
      body: JSON.stringify({ nome: nomeNovo.trim() }),
    })
    setNomeNovo('')
    await reload()
    onChange(r.pipeline.id)
  }

  async function tornarPrincipal(id: string) {
    await crmFetch(`/pipelines/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ principal: true }),
    })
    await reload()
  }

  async function renomear(id: string) {
    const atual = pipes.find((p) => p.id === id)
    const nome = window.prompt('Novo nome do funil', atual?.nome || '')
    if (!nome?.trim()) return
    await crmFetch(`/pipelines/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ nome: nome.trim() }),
    })
    await reload()
  }

  async function apagar(id: string) {
    const outros = pipes.filter((p) => p.id !== id)
    if (!outros.length) {
      window.alert('Precisa existir ao menos um funil.')
      return
    }
    const destino =
      outros.find((p) => p.principal)?.id
      || window.prompt(
        `Mover colunas/cards para qual funil?\n${outros.map((p) => `- ${p.nome} (${p.id})`).join('\n')}`,
        outros[0].id,
      )
    if (!destino) return
    if (!window.confirm('Apagar funil e mover todas as colunas (com cards) para o destino?')) return
    await crmFetch(`/pipelines/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ moverParaId: destino }),
    })
    await reload()
    if (pipelineId === id) onChange(destino)
  }

  return (
    <div className="pipe-bar">
      <label className="pipe-select-wrap">
        <span className="pipe-lab">Funil</span>
        <select
          className="input pipe-select"
          value={pipelineId || ''}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Funil ativo"
        >
          {pipes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}{p.principal ? ' ★' : ''}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => setAberto((v) => !v)}
      >
        Gerenciar
      </button>

      {aberto ? (
        <div className="pipe-panel" role="dialog" aria-label="Gerenciar funis">
          {erro ? <p className="cp-erro">{erro}</p> : null}
          <div className="pipe-new">
            <input
              className="input"
              placeholder="Nome do novo funil"
              value={nomeNovo}
              onChange={(e) => setNomeNovo(e.target.value)}
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void criar()}>
              Criar
            </button>
          </div>
          <ul className="pipe-list">
            {pipes.map((p) => (
              <li key={p.id}>
                <strong>{p.nome}</strong>
                {p.principal ? <span className="pipe-star">principal</span> : null}
                <div className="pipe-actions">
                  {!p.principal ? (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => void tornarPrincipal(p.id)}>
                      Eleger principal
                    </button>
                  ) : null}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void renomear(p.id)}>
                    Renomear
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={() => void apagar(p.id)}>
                    Apagar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="pipe-hint">Leads do WhatsApp entram no funil ★ principal.</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setAberto(false)}>
            Fechar
          </button>
        </div>
      ) : null}
    </div>
  )
}
