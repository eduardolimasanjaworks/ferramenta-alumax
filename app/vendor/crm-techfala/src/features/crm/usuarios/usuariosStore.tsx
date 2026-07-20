/**
 * Usuários do sistema para responsáveis em tarefas e interações.
 * Lista vem de GET `/api/crm/usuarios` (não do cadastro manual).
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { crmFetch } from '@/shared/lib/crmApi'

export type Usuario = { id: number | string; nome: string; email: string }

type Ctx = {
  usuarios: Usuario[]
  carregando: boolean
  opcoesResponsavel: string[]
}

const UsuariosContext = createContext<Ctx | null>(null)

export function UsuariosProvider({ children }: { children: ReactNode }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      try {
        const data = await crmFetch<{ usuarios: Usuario[] }>('/usuarios')
        if (!cancelado) setUsuarios(data.usuarios ?? [])
      } catch {
        /* lista vazia */
      } finally {
        if (!cancelado) setCarregando(false)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [])

  const opcoesResponsavel = useMemo(
    () =>
      usuarios.length > 0 ? usuarios.map((u) => u.nome) : ['Você'],
    [usuarios],
  )

  const value = useMemo(
    () => ({ usuarios, carregando, opcoesResponsavel }),
    [usuarios, carregando, opcoesResponsavel],
  )

  return (
    <UsuariosContext.Provider value={value}>{children}</UsuariosContext.Provider>
  )
}

export function useUsuarios() {
  const ctx = useContext(UsuariosContext)
  if (!ctx) throw new Error('useUsuarios deve estar dentro de UsuariosProvider')
  return ctx
}
