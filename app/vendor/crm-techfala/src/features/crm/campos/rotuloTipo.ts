/**
 * Labels e opções do select de tipo do campo.
 * Mantém o formulário sem hardcode de strings soltas.
 */

import type { CampoTipo } from './types'

export const TIPO_OPCOES: { value: CampoTipo; label: string }[] = [
  { value: 'texto', label: 'Texto' },
  { value: 'numero', label: 'Número' },
  { value: 'data', label: 'Data' },
  { value: 'lista', label: 'Lista' },
  { value: 'booleano', label: 'Sim/Não' },
]

export function rotuloTipo(tipo: CampoTipo): string {
  return TIPO_OPCOES.find((o) => o.value === tipo)?.label ?? tipo
}
