/**
 * Tipos do catálogo global de Campos Personalizados.
 * Definem o schema; valores por contato ficam em camposPersonalizados.
 */

export type CampoTipo =
  | 'texto'
  | 'numero'
  | 'data'
  | 'lista'
  | 'booleano'

export type CampoPersonalizado = {
  id: string
  nome: string
  descricao: string
  ativo: boolean
  tipo: CampoTipo
  /** Opções quando tipo = lista */
  opcoes: string[]
}

export type CamposView = 'lista' | 'form'

export type NovoCampoInput = Omit<CampoPersonalizado, 'id'>
