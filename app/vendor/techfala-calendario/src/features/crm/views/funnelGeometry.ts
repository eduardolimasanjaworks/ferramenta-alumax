/**
 * Calcula trapézios SVG do funil a partir das contagens.
 * Largura proporcional ao volume; altura igual por etapa.
 */
export type FunnelSlice = {
  id: string
  count: number
  topL: number
  topR: number
  botL: number
  botR: number
  y: number
  h: number
  midY: number
}

const MIN_W = 42
const PAD = 14

export function buildFunnelSlices(
  items: { id: string; count: number }[],
  width: number,
  height: number,
): FunnelSlice[] {
  const n = items.length
  if (n === 0) return []
  const max = Math.max(...items.map((i) => i.count), 1)
  const h = height / n
  const usable = width - PAD * 2

  const widths = items.map((i) => {
    if (i.count === 0) return MIN_W
    return Math.max(MIN_W, (i.count / max) * usable)
  })

  return items.map((item, i) => {
    const topW = widths[i]
    const botW = widths[Math.min(i + 1, n - 1)]
    const y = i * h
    const topL = (width - topW) / 2
    const topR = topL + topW
    const botL = (width - botW) / 2
    const botR = botL + botW
    return {
      id: item.id,
      count: item.count,
      topL,
      topR,
      botL,
      botR,
      y,
      h,
      midY: y + h / 2,
    }
  })
}

export function slicePath(s: FunnelSlice): string {
  const cy = s.y + s.h / 2
  return `
    M ${s.topL} ${s.y}
    C ${s.topL} ${cy}, ${s.botL} ${cy}, ${s.botL} ${s.y + s.h}
    L ${s.botR} ${s.y + s.h}
    C ${s.botR} ${cy}, ${s.topR} ${cy}, ${s.topR} ${s.y}
    Z
  `
}
