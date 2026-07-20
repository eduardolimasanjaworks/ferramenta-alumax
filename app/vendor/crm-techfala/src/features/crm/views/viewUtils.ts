/**
 * Helpers compartilhados das views: soma de valores e formatação BRL.
 * Evita duplicar lógica entre Linhas, Lista e Funil.
 */
import type { Contato } from '@/shared/types/crm'

export const PAGE_SIZE = 25

export function parseValor(raw?: string): number {
  if (!raw) return 0
  const n = Number(String(raw).replace(/[^\d,.-]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function somaValores(contatos: Contato[]): number {
  return contatos.reduce((acc, c) => acc + parseValor(c.valorOportunidade), 0)
}

export function formatBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/** Extrai r,g,b de hex (#rgb/#rrggbb) ou rgb()/rgba(). */
export function parseRgb(color: string): { r: number; g: number; b: number } | null {
  const c = color.trim()
  const rgb = c.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/i,
  )
  if (rgb) {
    return {
      r: Math.round(Number(rgb[1])),
      g: Math.round(Number(rgb[2])),
      b: Math.round(Number(rgb[3])),
    }
  }
  const h = c.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : h
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  const n = Number.parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** Converte cor (hex ou rgb) em rgba com alpha. */
export function hexToRgba(color: string, alpha: number): string {
  const rgb = parseRgb(color)
  if (!rgb) return `rgba(59, 130, 246, ${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}
