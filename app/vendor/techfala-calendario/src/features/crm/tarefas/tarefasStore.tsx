/**
 * Store das tarefas do painel lateral (toolbar → Tarefas).
 * CRUD + persistência; estado de UI (aberto/view) fica no CrmPage.
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
import { TAREFAS_PADRAO, TAREFAS_STORAGE_KEY } from './defaultTarefas'
import type { NovaTarefaInput, Tarefa } from './types'

type Ctx = {
  tarefas: Tarefa[]
  criar: (input: NovaTarefaInput) => void
  concluir: (id: string) => void
  remover: (id: string) => void
  atualizar: (id: string, patch: Partial<Tarefa>) => void
}

const TarefasContext = createContext<Ctx | null>(null)

function uid() {
  return `tar-${crypto.randomUUID().slice(0, 8)}`
}

export function TarefasProvider({ children }: { children: ReactNode }) {
  const [tarefas, setTarefas] = useState<Tarefa[]>(() =>
    loadJson(TAREFAS_STORAGE_KEY, TAREFAS_PADRAO),
  )

  useEffect(() => {
    saveJsonSoon(TAREFAS_STORAGE_KEY, tarefas)
  }, [tarefas])

  const criar = useCallback((input: NovaTarefaInput) => {
    setTarefas((prev) => [{ id: uid(), ...input }, ...prev])
  }, [])

  const concluir = useCallback((id: string) => {
    setTarefas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'concluida' } : t)),
    )
  }, [])

  const remover = useCallback((id: string) => {
    setTarefas((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const atualizar = useCallback((id: string, patch: Partial<Tarefa>) => {
    setTarefas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    )
  }, [])

  const value = useMemo(
    () => ({ tarefas, criar, concluir, remover, atualizar }),
    [tarefas, criar, concluir, remover, atualizar],
  )

  return (
    <TarefasContext.Provider value={value}>{children}</TarefasContext.Provider>
  )
}

export function useTarefas() {
  const ctx = useContext(TarefasContext)
  if (!ctx) throw new Error('useTarefas deve estar dentro de TarefasProvider')
  return ctx
}
