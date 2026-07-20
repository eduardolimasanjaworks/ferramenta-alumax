/**
 * Store React do CRM: Kanban + painel do contato.
 * Persiste colunas/contatos; contatoAbertoId só em memória.
 */
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadJson, saveJsonSoon } from '@/shared/lib/storage'
import {
  contatoVazio,
  type Coluna,
  type Contato,
  type CrmState,
} from '@/shared/types/crm'
import {
  COLUNAS_PADRAO,
  CONTATOS_PADRAO,
  CRM_STORAGE_KEY,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from './defaultData'
import { normalizarContatos } from './normalizarContatos'

type Persisted = Pick<CrmState, 'colunas' | 'contatos'>

type CrmContextValue = CrmState & {
  colunasOrdenadas: Coluna[]
  contatosFiltrados: Contato[]
  contatoAberto: Contato | null
  setBusca: (v: string) => void
  zoomIn: () => void
  zoomOut: () => void
  adicionarColuna: (titulo?: string) => void
  adicionarContato: (colunaId: string, nome: string) => void
  atualizarContato: (id: string, patch: Partial<Contato>) => void
  abrirContato: (id: string) => void
  fecharContato: () => void
  removerContato: (id: string) => void
  moverContato: (contatoId: string, colunaDestinoId: string) => void
  reordenarColunas: (origemId: string, destinoId: string) => void
  renomearColuna: (id: string, titulo: string) => void
  removerColuna: (id: string) => void
}

const CrmContext = createContext<CrmContextValue | null>(null)

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function CrmProvider({ children }: { children: ReactNode }) {
  const saved = loadJson<Persisted>(CRM_STORAGE_KEY, {
    colunas: COLUNAS_PADRAO,
    contatos: CONTATOS_PADRAO,
  })

  const [colunas, setColunas] = useState<Coluna[]>(saved.colunas)
  const [contatos, setContatos] = useState<Contato[]>(() =>
    normalizarContatos(saved.contatos),
  )
  const [busca, setBusca] = useState('')
  const [zoom, setZoom] = useState(1)
  const [contatoAbertoId, setContatoAbertoId] = useState<string | null>(null)

  useEffect(() => {
    saveJsonSoon(CRM_STORAGE_KEY, { colunas, contatos })
  }, [colunas, contatos])

  const colunasOrdenadas = useMemo(
    () => [...colunas].sort((a, b) => a.ordem - b.ordem),
    [colunas],
  )

  const contatosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return contatos
    return contatos.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.telefone?.includes(q),
    )
  }, [contatos, busca])

  const contatoAberto = useMemo(
    () => contatos.find((c) => c.id === contatoAbertoId) ?? null,
    [contatos, contatoAbertoId],
  )

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))
  }, [])

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))
  }, [])

  const adicionarColuna = useCallback((titulo = 'Nova Coluna') => {
    setColunas((prev) => {
      const ordem = prev.length
      const cores = [
        'rgb(59, 130, 246)',
        'rgb(139, 92, 246)',
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(239, 68, 68)',
      ]
      return [
        ...prev,
        {
          id: uid('col'),
          titulo,
          cor: cores[ordem % cores.length],
          ordem,
        },
      ]
    })
  }, [])

  const adicionarContato = useCallback((colunaId: string, nome: string) => {
    const limpo = nome.trim()
    if (!limpo) return
    const id = uid('ct')
    const criadoEm = new Date().toISOString()
    const novo = contatoVazio({ id, nome: limpo, colunaId, criadoEm })
    setContatos((prev) => [...prev, novo])
    setContatoAbertoId(id)
  }, [])

  const atualizarContato = useCallback((id: string, patch: Partial<Contato>) => {
    setContatos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    )
  }, [])

  const abrirContato = useCallback((id: string) => setContatoAbertoId(id), [])
  const fecharContato = useCallback(() => setContatoAbertoId(null), [])

  const removerContato = useCallback((id: string) => {
    setContatos((prev) => prev.filter((c) => c.id !== id))
    setContatoAbertoId((aberto) => (aberto === id ? null : aberto))
  }, [])

  const moverContato = useCallback(
    (contatoId: string, colunaDestinoId: string) => {
      setContatos((prev) =>
        prev.map((c) => {
          if (c.id !== contatoId) return c
          const tl = {
            id: uid('tl'),
            tipo: 'kanban',
            titulo: 'Movimentação (Kanban)',
            detalhe: `Contato movido para outra coluna`,
            em: new Date().toISOString(),
          }
          return {
            ...c,
            colunaId: colunaDestinoId,
            timeline: [tl, ...c.timeline],
          }
        }),
      )
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
    },
    [],
  )

  const renomearColuna = useCallback((id: string, titulo: string) => {
    setColunas((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, titulo: titulo.trim() || c.titulo } : c,
      ),
    )
  }, [])

  const removerColuna = useCallback((id: string) => {
    setColunas((prev) =>
      prev.filter((c) => c.id !== id).map((c, i) => ({ ...c, ordem: i })),
    )
    setContatos((prev) => prev.filter((c) => c.colunaId !== id))
  }, [])

  const setBuscaSuave = useCallback((v: string) => {
    startTransition(() => setBusca(v))
  }, [])

  const value: CrmContextValue = {
    colunas,
    contatos,
    busca,
    zoom,
    contatoAbertoId,
    colunasOrdenadas,
    contatosFiltrados,
    contatoAberto,
    setBusca: setBuscaSuave,
    zoomIn,
    zoomOut,
    adicionarColuna,
    adicionarContato,
    atualizarContato,
    abrirContato,
    fecharContato,
    removerContato,
    moverContato,
    reordenarColunas,
    renomearColuna,
    removerColuna,
  }

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}

export function useCrm() {
  const ctx = useContext(CrmContext)
  if (!ctx) throw new Error('useCrm deve ser usado dentro de CrmProvider')
  return ctx
}
