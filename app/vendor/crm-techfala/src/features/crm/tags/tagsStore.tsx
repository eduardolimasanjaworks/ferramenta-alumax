/**
 * Store do catálogo de tags (toolbar → Tags).
 * CRUD via `/api/crm/tags`; contatos referenciam por nome.
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
import { CrmApiError, crmFetch } from '@/shared/lib/crmApi'
import type { NovaTagInput, TagCatalogo } from './types'

type Ctx = {
  tags: TagCatalogo[]
  criarTag: (input: NovaTagInput) => Promise<TagCatalogo>
  removerTag: (id: string) => void
}

const TagsContext = createContext<Ctx | null>(null)

export function TagsProvider({ children }: { children: ReactNode }) {
  const [tags, setTags] = useState<TagCatalogo[]>([])

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      try {
        const data = await crmFetch<{ tags: TagCatalogo[] }>('/tags')
        if (!cancelado) setTags(data.tags ?? [])
      } catch {
        /* noop */
      }
    })()
    return () => {
      cancelado = true
    }
  }, [])

  const criarTag = useCallback(async (input: NovaTagInput) => {
    const nome = input.nome.trim()
    if (!nome) throw new Error('Informe o nome da tag.')
    const existente = tags.find(
      (t) => t.nome.toLowerCase() === nome.toLowerCase(),
    )
    if (existente) {
      if (!existente.ativo) {
        const { tag } = await crmFetch<{ tag: TagCatalogo }>(
          `/tags/${encodeURIComponent(existente.id)}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ ativo: true }),
          },
        )
        setTags((prev) => prev.map((t) => (t.id === tag.id ? tag : t)))
        return tag
      }
      return existente
    }
    try {
      const { tag } = await crmFetch<{ tag: TagCatalogo }>('/tags', {
        method: 'POST',
        body: JSON.stringify({ nome, ativo: input.ativo ?? true }),
      })
      setTags((prev) => {
        if (prev.some((t) => t.id === tag.id)) {
          return prev.map((t) => (t.id === tag.id ? tag : t))
        }
        return [tag, ...prev]
      })
      return tag
    } catch (e) {
      if (e instanceof CrmApiError) throw new Error(e.message)
      throw new Error('Não foi possível criar a tag.')
    }
  }, [tags])

  const removerTag = useCallback((id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id))
    void (async () => {
      try {
        await crmFetch(`/tags/${id}`, { method: 'DELETE' })
      } catch {
        /* noop */
      }
    })()
  }, [])

  const value = useMemo(
    () => ({ tags, criarTag, removerTag }),
    [tags, criarTag, removerTag],
  )

  return <TagsContext.Provider value={value}>{children}</TagsContext.Provider>
}

export function useTags() {
  const ctx = useContext(TagsContext)
  if (!ctx) throw new Error('useTags deve estar dentro de TagsProvider')
  return ctx
}
