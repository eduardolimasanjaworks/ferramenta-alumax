/**
 * Persistência e seed do catálogo de campos personalizados.
 * Lista começa vazia — empty state do dump HTML.
 */
import type { CampoPersonalizado } from './types'

export const CAMPOS_STORAGE_KEY = 'techfala-campos-v1'

export const CAMPOS_PADRAO: CampoPersonalizado[] = []
