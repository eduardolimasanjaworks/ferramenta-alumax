/**
 * Contexto para abrir o modal de novo contato de qualquer view.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AddContactModal } from './AddContactModal'

type Ctx = {
  abrirNovoContato: (colunaId: string) => void
}

const AddContactContext = createContext<Ctx | null>(null)

export function AddContactProvider({ children }: { children: ReactNode }) {
  const [colunaId, setColunaId] = useState<string | null>(null)

  const abrirNovoContato = useCallback((id: string) => {
    setColunaId(id)
  }, [])

  const value = useMemo(() => ({ abrirNovoContato }), [abrirNovoContato])

  return (
    <AddContactContext.Provider value={value}>
      {children}
      {colunaId ? (
        <AddContactModal colunaId={colunaId} onClose={() => setColunaId(null)} />
      ) : null}
    </AddContactContext.Provider>
  )
}

export function useAddContact() {
  const ctx = useContext(AddContactContext)
  if (!ctx) throw new Error('useAddContact deve estar dentro de AddContactProvider')
  return ctx
}
