/**
 * Store do catálogo de Campos Personalizados (toolbar → Campos).
 * CRUD via `/api/crm/campos`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { crmFetch } from '@/shared/lib/crmApi'
import type { CampoPersonalizado, NovoCampoInput } from './types'

type Ctx = {
  campos: CampoPersonalizado[]
  criar: (input: NovoCampoInput) => Promise<CampoPersonalizado | null>
  atualizar: (
    id: string,
    patch: Partial<CampoPersonalizado>,
  ) => Promise<CampoPersonalizado | null>
  remover: (id: string) => void
}

const CamposContext = createContext<Ctx | null>(null)

export function CamposProvider({ children }: { children: ReactNode }) {
  const [campos, setCampos] = useState<CampoPersonalizado[]>([])

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      try {
        const data = await crmFetch<{ campos: CampoPersonalizado[] }>('/campos')
        if (!cancelado) {
          setCampos(
            (data.campos ?? []).map((c) => ({
              ...c,
              opcoes: Array.isArray(c.opcoes) ? c.opcoes : [],
            })),
          )
        }
      } catch {
        /* noop */
      }
    })()
    return () => {
      cancelado = true
    }
  }, [])

  const criar = useCallback(async (input: NovoCampoInput) => {
    try {
      const { campo } = await crmFetch<{ campo: CampoPersonalizado }>(
        '/campos',
        { method: 'POST', body: JSON.stringify(input) },
      )
      setCampos((prev) => [campo, ...prev])
      return campo
    } catch {
      return null
    }
  }, [])

  const atualizar = useCallback(
    async (id: string, patch: Partial<CampoPersonalizado>) => {
      setCampos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      )
      try {
        const { campo } = await crmFetch<{ campo: CampoPersonalizado }>(
          `/campos/${id}`,
          { method: 'PATCH', body: JSON.stringify(patch) },
        )
        setCampos((prev) => prev.map((c) => (c.id === id ? campo : c)))
        return campo
      } catch {
        return null
      }
    },
    [],
  )

  const remover = useCallback((id: string) => {
    setCampos((prev) => prev.filter((c) => c.id !== id))
    void (async () => {
      try {
        await crmFetch(`/campos/${id}`, { method: 'DELETE' })
      } catch {
        /* noop */
      }
    })()
  }, [])

  const value = useMemo(
    () => ({ campos, criar, atualizar, remover }),
    [campos, criar, atualizar, remover],
  )

  return (
    <CamposContext.Provider value={value}>{children}</CamposContext.Provider>
  )
}

export function useCampos() {
  const ctx = useContext(CamposContext)
  if (!ctx) throw new Error('useCampos deve estar dentro de CamposProvider')
  return ctx
}
