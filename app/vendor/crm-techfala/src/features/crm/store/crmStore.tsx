/**
 * Store React do CRM: Kanban + painel do contato.
 * Persistência via `/api/crm/*` com debounce de PATCH (baixa latência, sem race).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CrmApiError, crmFetch, crmUploadArquivo } from '@/shared/lib/crmApi'
import type { Coluna, Contato, ContatoArquivo, CrmState } from '@/shared/types/crm'
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from './defaultData'
import { normalizarContatos } from './normalizarContatos'

export type CrmFiltro = {
  colunaIds: string[]
  tags: string[]
  comTelefone: boolean
  comEmail: boolean
}

const FILTRO_VAZIO: CrmFiltro = {
  colunaIds: [],
  tags: [],
  comTelefone: false,
  comEmail: false,
}

const PATCH_DEBOUNCE_MS = 280

export type NovoContatoInput = {
  nome: string
  telefone: string
  ddi?: string
  iaAtiva?: boolean
}

type CrmContextValue = CrmState & {
  carregando: boolean
  erro: string | null
  filtro: CrmFiltro
  colunasOrdenadas: Coluna[]
  contatosFiltrados: Contato[]
  contatoAberto: Contato | null
  setBusca: (v: string) => void
  setFiltro: (patch: Partial<CrmFiltro>) => void
  limparFiltro: () => void
  zoomIn: () => void
  zoomOut: () => void
  adicionarColuna: (titulo?: string) => void
  adicionarContato: (colunaId: string, dados: NovoContatoInput) => void
  atualizarContato: (id: string, patch: Partial<Contato>) => void
  flushContatoPendentes: (id: string) => Promise<void>
  uploadArquivo: (contatoId: string, file: File) => Promise<void>
  removerArquivo: (contatoId: string, arquivoId: string) => void
  abrirContato: (id: string) => void
  fecharContato: () => void
  removerContato: (id: string) => void
  moverContato: (contatoId: string, colunaDestinoId: string) => void
  reordenarColunas: (origemId: string, destinoId: string) => void
  renomearColuna: (id: string, titulo: string) => void
  alterarCorColuna: (id: string, cor: string) => void
  removerColuna: (id: string, opts?: { moverParaId?: string }) => void
  sincronizarAtendimento: () => Promise<void>
  syncAtendimentoEmAndamento: boolean
  pipelineId: string | null
  setPipelineId: (id: string) => void
  recarregarBoard: () => Promise<void>
}

const CrmContext = createContext<CrmContextValue | null>(null)

function upsertContato(lista: Contato[], contato: Contato): Contato[] {
  const i = lista.findIndex((c) => c.id === contato.id)
  if (i < 0) return [...lista, contato]
  const next = [...lista]
  next[i] = contato
  return next
}

function aplicaFiltro(lista: Contato[], busca: string, filtro: CrmFiltro): Contato[] {
  const q = busca.trim().toLowerCase()
  return lista.filter((c) => {
    if (filtro.colunaIds.length && !filtro.colunaIds.includes(c.colunaId)) {
      return false
    }
    if (filtro.tags.length && !filtro.tags.every((t) => c.tags.includes(t))) {
      return false
    }
    if (filtro.comTelefone && !c.telefone?.trim()) return false
    if (filtro.comEmail && !c.email?.trim()) return false
    if (!q) return true
    return (
      c.nome.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.telefone?.includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    )
  })
}

export function CrmProvider({ children }: { children: ReactNode }) {
  const [colunas, setColunas] = useState<Coluna[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltroState] = useState<CrmFiltro>(FILTRO_VAZIO)
  const [zoom, setZoom] = useState(1)
  const [contatoAbertoId, setContatoAbertoId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [syncAtendimentoEmAndamento, setSyncAtendimentoEmAndamento] = useState(false)
  const [pipelineId, setPipelineId] = useState<string | null>(
    () => localStorage.getItem('crm_pipeline_id'),
  )

  const pendingPatches = useRef(new Map<string, Partial<Contato>>())
  const patchTimers = useRef(new Map<string, number>())
  const patchSeq = useRef(new Map<string, number>())

  const abrirContato = useCallback((id: string) => {
    setContatoAbertoId(id)
    // Board vem lean (sem timeline/notas/…); hidrata o contato ao abrir o painel.
    void (async () => {
      try {
        const { contato } = await crmFetch<{ contato: Contato }>(`/contatos/${id}`)
        setContatos((prev) => upsertContato(prev, normalizarContatos([contato])[0]))
      } catch {
        /* painel já abre com o que veio do board */
      }
    })()
  }, [])

  const recarregarBoard = useCallback(async () => {
    const qs = pipelineId ? `?pipelineId=${encodeURIComponent(pipelineId)}` : ''
    const data = await crmFetch<{ colunas: Coluna[]; contatos: Contato[] }>(
      `/board${qs}`,
    )
    setColunas(data.colunas)
    setContatos(normalizarContatos(data.contatos))
  }, [pipelineId])

  useEffect(() => {
    if (pipelineId) localStorage.setItem('crm_pipeline_id', pipelineId)
    let cancelado = false
    void (async () => {
      setCarregando(true)
      try {
        await recarregarBoard()
        if (!cancelado) setErro(null)
      } catch (e) {
        if (!cancelado) {
          setErro(e instanceof Error ? e.message : 'Falha ao carregar CRM')
        }
      } finally {
        if (!cancelado) setCarregando(false)
      }
    })()
    return () => {
      cancelado = true
      for (const t of patchTimers.current.values()) window.clearTimeout(t)
      patchTimers.current.clear()
    }
  }, [pipelineId, recarregarBoard])

  const flushPatch = useCallback(
    async (id: string) => {
      const body = pendingPatches.current.get(id)
      pendingPatches.current.delete(id)
      patchTimers.current.delete(id)
      if (!body || Object.keys(body).length === 0) return

      const seq = (patchSeq.current.get(id) ?? 0) + 1
      patchSeq.current.set(id, seq)
      try {
        const { contato } = await crmFetch<{ contato: Contato }>(
          `/contatos/${id}`,
          { method: 'PATCH', body: JSON.stringify(body) },
        )
        if (patchSeq.current.get(id) !== seq) return
        if (pendingPatches.current.has(id)) return
        const normalizado = normalizarContatos([contato])[0]
        setContatos((prev) => upsertContato(prev, normalizado))
        setErro(null)
      } catch (e) {
        if (patchSeq.current.get(id) !== seq) return
        if (
          e instanceof CrmApiError &&
          e.codigo === 'telefone_duplicado' &&
          e.contatoExistenteId
        ) {
          if (
            window.confirm(
              'Já existe um contato com este telefone. Abrir o contato existente?',
            )
          ) {
            abrirContato(e.contatoExistenteId)
          }
          await recarregarBoard()
          return
        }
        setErro(e instanceof Error ? e.message : 'Erro ao atualizar contato')
      }
    },
    [abrirContato, recarregarBoard],
  )

  const sincronizarAtendimento = useCallback(async () => {
    if (syncAtendimentoEmAndamento) return
    setSyncAtendimentoEmAndamento(true)
    try {
      await crmFetch('/sync/atendimento', { method: 'POST' })
      await recarregarBoard()
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao sincronizar Atendimento')
    } finally {
      setSyncAtendimentoEmAndamento(false)
    }
  }, [recarregarBoard, syncAtendimentoEmAndamento])

  const colunasOrdenadas = useMemo(
    () => [...colunas].sort((a, b) => a.ordem - b.ordem),
    [colunas],
  )

  const contatosFiltrados = useMemo(
    () => aplicaFiltro(contatos, busca, filtro),
    [contatos, busca, filtro],
  )

  const contatoAberto = useMemo(
    () => contatos.find((c) => c.id === contatoAbertoId) ?? null,
    [contatos, contatoAbertoId],
  )

  const setFiltro = useCallback((patch: Partial<CrmFiltro>) => {
    setFiltroState((prev) => ({ ...prev, ...patch }))
  }, [])

  const limparFiltro = useCallback(() => setFiltroState(FILTRO_VAZIO), [])

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))
  }, [])

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))
  }, [])

  const adicionarColuna = useCallback(
    (titulo = 'Nova Coluna') => {
      void (async () => {
        try {
          const { coluna } = await crmFetch<{ coluna: Coluna }>('/colunas', {
            method: 'POST',
            body: JSON.stringify({ titulo, pipelineId: pipelineId || undefined }),
          })
          setColunas((prev) => [...prev, coluna])
        } catch (e) {
          setErro(e instanceof Error ? e.message : 'Erro ao criar coluna')
        }
      })()
    },
    [pipelineId],
  )

  const adicionarContato = useCallback(
    (colunaId: string, dados: NovoContatoInput) => {
      const nome = dados.nome.trim()
      const telefone = dados.telefone.trim()
      if (!nome || !telefone) return
      void (async () => {
        try {
          const { contato } = await crmFetch<{ contato: Contato }>('/contatos', {
            method: 'POST',
            body: JSON.stringify({
              colunaId,
              nome,
              telefone,
              ddi: dados.ddi ?? '+55',
              iaAtiva: dados.iaAtiva ?? true,
            }),
          })
          const normalizado = normalizarContatos([contato])[0]
          setContatos((prev) => [...prev, normalizado])
          setContatoAbertoId(normalizado.id)
          setErro(null)
        } catch (e) {
          if (
            e instanceof CrmApiError &&
            e.codigo === 'telefone_duplicado' &&
            e.contatoExistenteId
          ) {
            if (
              window.confirm(
                'Já existe um contato com este telefone. Abrir o contato existente?',
              )
            ) {
              abrirContato(e.contatoExistenteId)
            }
            return
          }
          setErro(e instanceof Error ? e.message : 'Erro ao criar contato')
        }
      })()
    },
    [abrirContato],
  )

  const atualizarContato = useCallback(
    (id: string, patch: Partial<Contato>) => {
      setContatos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      )
      const merged = {
        ...(pendingPatches.current.get(id) ?? {}),
        ...patch,
      }
      pendingPatches.current.set(id, merged)
      const prevTimer = patchTimers.current.get(id)
      if (prevTimer) window.clearTimeout(prevTimer)
      const t = window.setTimeout(() => {
        void flushPatch(id)
      }, PATCH_DEBOUNCE_MS)
      patchTimers.current.set(id, t)
    },
    [flushPatch],
  )

  const uploadArquivo = useCallback(async (contatoId: string, file: File) => {
    try {
      const { arquivo } = await crmUploadArquivo<{ arquivo: ContatoArquivo }>(
        contatoId,
        file,
      )
      const tl = {
        id: `tl-${crypto.randomUUID().slice(0, 8)}`,
        tipo: 'arquivo' as const,
        titulo: 'Arquivo',
        detalhe: arquivo.nome,
        em: new Date().toISOString(),
      }
      let timelineNext: Contato['timeline'] = [tl]
      setContatos((prev) =>
        prev.map((c) => {
          if (c.id !== contatoId) return c
          timelineNext = [tl, ...c.timeline]
          return {
            ...c,
            arquivos: [arquivo, ...c.arquivos],
            timeline: timelineNext,
          }
        }),
      )
      await crmFetch(`/contatos/${contatoId}`, {
        method: 'PATCH',
        body: JSON.stringify({ timeline: timelineNext }),
      })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar arquivo')
      throw e
    }
  }, [])

  const flushContatoPendentes = useCallback(
    async (id: string) => {
      const t = patchTimers.current.get(id)
      if (t) window.clearTimeout(t)
      patchTimers.current.delete(id)
      await flushPatch(id)
    },
    [flushPatch],
  )

  const removerArquivo = useCallback((contatoId: string, arquivoId: string) => {
    setContatos((prev) =>
      prev.map((c) =>
        c.id === contatoId
          ? { ...c, arquivos: c.arquivos.filter((a) => a.id !== arquivoId) }
          : c,
      ),
    )
    void (async () => {
      try {
        await crmFetch(`/contatos/${contatoId}/arquivos/${arquivoId}`, {
          method: 'DELETE',
        })
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao excluir arquivo')
        await recarregarBoard()
      }
    })()
  }, [recarregarBoard])

  const fecharContato = useCallback(() => setContatoAbertoId(null), [])

  const removerContato = useCallback((id: string) => {
    const t = patchTimers.current.get(id)
    if (t) window.clearTimeout(t)
    patchTimers.current.delete(id)
    pendingPatches.current.delete(id)
    setContatos((prev) => prev.filter((c) => c.id !== id))
    setContatoAbertoId((aberto) => (aberto === id ? null : aberto))
    void (async () => {
      try {
        await crmFetch(`/contatos/${id}`, { method: 'DELETE' })
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao excluir contato')
        await recarregarBoard()
      }
    })()
  }, [recarregarBoard])

  const moverContato = useCallback(
    (contatoId: string, colunaDestinoId: string) => {
      let origem = ''
      setContatos((prev) => {
        const cur = prev.find((c) => c.id === contatoId)
        origem = cur?.colunaId ?? ''
        if (!cur || cur.colunaId === colunaDestinoId) return prev
        return prev.map((c) =>
          c.id === contatoId ? { ...c, colunaId: colunaDestinoId } : c,
        )
      })
      if (!origem || origem === colunaDestinoId) return
      void (async () => {
        try {
          const { contato } = await crmFetch<{ contato: Contato }>(
            `/contatos/${contatoId}/mover`,
            {
              method: 'POST',
              body: JSON.stringify({ colunaId: colunaDestinoId }),
            },
          )
          const normalizado = normalizarContatos([contato])[0]
          setContatos((prev) => upsertContato(prev, normalizado))
        } catch (e) {
          setContatos((prev) =>
            prev.map((c) =>
              c.id === contatoId ? { ...c, colunaId: origem } : c,
            ),
          )
          setErro(e instanceof Error ? e.message : 'Erro ao mover contato')
        }
      })()
    },
    [],
  )
  const reordenarColunas = useCallback(
    (origemId: string, destinoId: string) => {
      if (origemId === destinoId) return
      setColunas((prev) => {
        const sorted = [...prev].sort((a, b) => a.ordem - b.ordem)
        const from = sorted.findIndex((c) => c.id === origemId)
        const to = sorted.findIndex((c) => c.id === destinoId)
        if (from < 0 || to < 0) return prev
        const [item] = sorted.splice(from, 1)
        sorted.splice(to, 0, item)
        return sorted.map((c, i) => ({ ...c, ordem: i }))
      })
      void (async () => {
        try {
          const { colunas: next } = await crmFetch<{ colunas: Coluna[] }>(
            '/colunas/reordenar',
            {
              method: 'POST',
              body: JSON.stringify({ origemId, destinoId }),
            },
          )
          setColunas(next)
        } catch (e) {
          setErro(e instanceof Error ? e.message : 'Erro ao reordenar colunas')
        }
      })()
    },
    [],
  )

  const renomearColuna = useCallback((id: string, titulo: string) => {
    const limpo = titulo.trim()
    if (!limpo) return
    setColunas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, titulo: limpo } : c)),
    )
    void (async () => {
      try {
        const { coluna } = await crmFetch<{ coluna: Coluna }>(
          `/colunas/${id}`,
          { method: 'PATCH', body: JSON.stringify({ titulo: limpo }) },
        )
        setColunas((prev) => prev.map((c) => (c.id === id ? coluna : c)))
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao renomear coluna')
      }
    })()
  }, [])

  const alterarCorColuna = useCallback((id: string, cor: string) => {
    if (!cor.trim()) return
    setColunas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, cor } : c)),
    )
    void (async () => {
      try {
        const { coluna } = await crmFetch<{ coluna: Coluna }>(
          `/colunas/${id}`,
          { method: 'PATCH', body: JSON.stringify({ cor }) },
        )
        setColunas((prev) => prev.map((c) => (c.id === id ? coluna : c)))
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao alterar cor')
      }
    })()
  }, [])

  const removerColuna = useCallback(
    (id: string, opts?: { moverParaId?: string }) => {
      void (async () => {
        try {
          const body = opts?.moverParaId
            ? JSON.stringify({ moverParaId: opts.moverParaId })
            : JSON.stringify({})
          await crmFetch(`/colunas/${id}`, { method: 'DELETE', body })
          await recarregarBoard()
          setErro(null)
        } catch (e) {
          setErro(e instanceof Error ? e.message : 'Erro ao excluir coluna')
        }
      })()
    },
    [recarregarBoard],
  )

  const value: CrmContextValue = {
    colunas,
    contatos,
    busca,
    zoom,
    contatoAbertoId,
    carregando,
    erro,
    filtro,
    colunasOrdenadas,
    contatosFiltrados,
    contatoAberto,
    setBusca,
    setFiltro,
    limparFiltro,
    zoomIn,
    zoomOut,
    adicionarColuna,
    adicionarContato,
    atualizarContato,
    flushContatoPendentes,
    uploadArquivo,
    removerArquivo,
    abrirContato,
    fecharContato,
    removerContato,
    moverContato,
    reordenarColunas,
    renomearColuna,
    alterarCorColuna,
    removerColuna,
    sincronizarAtendimento,
    syncAtendimentoEmAndamento,
    pipelineId,
    setPipelineId,
    recarregarBoard,
  }

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}

export function useCrm() {
  const ctx = useContext(CrmContext)
  if (!ctx) throw new Error('useCrm deve ser usado dentro de CrmProvider')
  return ctx
}
