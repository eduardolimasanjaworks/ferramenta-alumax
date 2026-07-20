/**
 * Largura redimensionável (painel/sheet), persistida no localStorage.
 * Em mobile (&lt;640px) ocupa quase 100vw.
 */
import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

type Opts = {
  storageKey: string
  minDesktop?: number
  defaultRatio?: number
}

export function useResizableWidth({
  storageKey,
  minDesktop = 320,
  defaultRatio = 0.88,
}: Opts) {
  const minFor = () =>
    typeof window === 'undefined'
      ? minDesktop
      : window.innerWidth < 640
        ? Math.max(260, window.innerWidth - 8)
        : minDesktop

  const maxFor = () => {
    if (typeof window === 'undefined') return 1200
    return Math.max(minFor(), window.innerWidth - (window.innerWidth < 640 ? 0 : 48))
  }

  const defaultFor = () => {
    if (typeof window === 'undefined') return 720
    if (window.innerWidth < 640) return window.innerWidth
    return Math.round(window.innerWidth * defaultRatio)
  }

  const clamp = (w: number) => Math.min(maxFor(), Math.max(minFor(), w))

  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return 720
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) return clamp(Number(raw))
    } catch {
      /* ignore */
    }
    return clamp(defaultFor())
  })

  const [canResize, setCanResize] = useState(true)

  useEffect(() => {
    function sync() {
      setCanResize(window.innerWidth >= 640)
      setWidth((w) => clamp(w))
    }
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(width))
    } catch {
      /* ignore */
    }
  }, [storageKey, width])

  const startResize = useCallback(
    (e: ReactPointerEvent) => {
      if (window.innerWidth < 640) return
      e.preventDefault()
      e.stopPropagation()
      const startX = e.clientX
      const startW = width

      function onMove(ev: PointerEvent) {
        const delta = startX - ev.clientX
        setWidth(clamp(startW + delta))
      }

      function onUp() {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [width],
  )

  return {
    width,
    startResize,
    setWidth,
    canResize,
    cssWidth: `min(${width}px, 100vw)`,
  }
}
