/**
 * Página Campanhas: lista + sheet expansível.
 * Carrega tags/instâncias e orquestra CRUD + agendar.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  atualizarCampanha,
  agendarCampanha,
  enviarAgoraCampanha,
  excluirCampanha,
  listarCampanhas,
  listarInstancias,
  listarTags,
  pausarCampanha,
  salvarCampanha,
} from './api'
import { CampanhaSheet } from './CampanhaSheet'
import { ListaCampanhas } from './ListaCampanhas'
import type { Campanha, InstanciaOpt } from './types'

export function CampanhasPage() {
  const [itens, setItens] = useState<Campanha[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [instancias, setInstancias] = useState<InstanciaOpt[]>([])
  const [sheet, setSheet] = useState<Campanha | 'novo' | null>(null)
  const [expandido, setExpandido] = useState(true)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    setErro('')
    try {
      const [c, t, i] = await Promise.all([
        listarCampanhas(),
        listarTags().catch(() => ({ ok: true, tags: [] as string[] })),
        listarInstancias().catch(() => ({
          ok: true,
          instancias: [] as InstanciaOpt[],
        })),
      ])
      setItens(c.campanhas || [])
      setTags(t.tags || [])
      setInstancias(i.instancias || [])
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  async function onSalvar(
    body: Partial<Campanha> & { nome: string },
    agendar: boolean,
  ) {
    let id = body.id
    if (id) {
      await atualizarCampanha(id, body)
    } else {
      const r = await salvarCampanha(body)
      id = r.campanha.id
    }
    if (agendar && id) await agendarCampanha(id)
    await reload()
  }

  return (
    <div className="cp-page">
      <header className="cp-toolbar">
        <div>
          <h1>Campanhas</h1>
          <p className="cp-sub">Disparos WhatsApp com delay e agendamento</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setSheet('novo')}>
          + Nova Campanha
        </button>
      </header>

      {erro ? <p className="cp-erro">{erro}</p> : null}
      {loading ? <p className="cp-meta">Carregando…</p> : null}

      <ListaCampanhas
        itens={itens}
        onAbrir={(c) => setSheet(c)}
        onExcluir={async (id) => {
          await excluirCampanha(id)
          await reload()
        }}
        onPausar={async (id) => {
          await pausarCampanha(id)
          await reload()
        }}
        onEnviarAgora={async (id) => {
          await enviarAgoraCampanha(id)
          await reload()
        }}
      />

      {sheet ? (
        <CampanhaSheet
          inicial={sheet === 'novo' ? null : sheet}
          tags={tags}
          instancias={instancias}
          expandido={expandido}
          onToggleExpand={() => setExpandido((v) => !v)}
          onClose={() => setSheet(null)}
          onSalvar={onSalvar}
        />
      ) : null}
    </div>
  )
}
