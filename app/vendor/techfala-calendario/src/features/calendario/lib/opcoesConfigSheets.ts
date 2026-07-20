/**
 * Opções dos selects de parâmetro e mensagem de êxito.
 * Mensagem vai sempre por WhatsApp — tipo = formato do conteúdo.
 */

export const MOMENTOS_PARAM = [
  'Agendamento',
  'Cancelamento',
  'Remarcação',
]

/** Tipo do dado coletado (não é canal de envio). */
export const TIPOS_PARAM = [
  'Texto',
  'Número',
  'Data',
  'Telefone',
  'E-mail',
  'Lista',
]

export const MOMENTOS_MSG = [
  'Agendamento',
  'Reagendamento',
  'Cancelamento',
] as const

/** Formato WhatsApp: texto ou mídia. Nunca canal (WhatsApp/e-mail). */
export const TIPOS_MSG = [
  'Texto',
  'Imagem',
  'Arquivo',
  'Vídeo',
  'Áudio',
] as const

export type TipoMsg = (typeof TIPOS_MSG)[number]

/** Converte lixo legado (WhatsApp/E-mail) → Texto. */
export function normalizarTipoMsg(raw: string | undefined | null): TipoMsg {
  const t = String(raw || '').trim()
  if ((TIPOS_MSG as readonly string[]).includes(t)) return t as TipoMsg
  return 'Texto'
}
