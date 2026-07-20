/**
 * Store do catálogo de Campos Personalizados (toolbar → Campos).
 * CRUD + localStorage; UI aberta/fechada fica no CrmPage.
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
import { loadJson, saveJsonSoon } from '@/shared/lib/storage'
import { CAMPOS_PADRAO, CAMPOS_STORAGE_KEY } from './defaultCampos'
import type { CampoPersonalizado, NovoCampoInput } from './types'

type Ctx = {
  campos: CampoPersonalizado[]
  criar: (input: NovoCampoInput) => void
  atualizar: (id: string, patch: Partial<CampoPersonalizado>) => void
  remover: (id: string) => void
}

const CamposContext = createContext<Ctx | null>(null)

function uid() {
  return `cf-${crypto.randomUUID().slice(0, 8)}`
}

export function CamposProvider({ children }: { children: ReactNode }) {
  const [campos, setCampos] = useState<CampoPersonalizado[]>(() =>
    loadJson(CAMPOS_STORAGE_KEY, CAMPOS_PADRAO),
  )

  useEffect(() => {
    saveJsonSoon(CAMPOS_STORAGE_KEY, campos)
  }, [campos])

  const criar = useCallback((input: NovoCampoInput) => {
    setCampos((prev) => [{ id: uid(), ...input }, ...prev])
  }, [])

  const atualizar = useCallback(
    (id: string, patch: Partial<CampoPersonalizado>) => {
      setCampos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      )
    },
    [],
  )

  const remover = useCallback((id: string) => {
    setCampos((prev) => prev.filter((c) => c.id !== id))
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
