/**
 * Tipos do catálogo de tags do CRM.
 * Tags ativas aparecem como sugestão na aba do contato.
 */

export type TagCatalogo = {
  id: string
  nome: string
  ativo: boolean
}

export type NovaTagInput = { nome: string; ativo?: boolean }
