/**
 * Largura ajustável do painel de contato.
 * Persiste no localStorage; arrasta pela borda esquerda.
 */
import { useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'

const KEY = 'techfala-contato-panel-w'
const MIN = 360
const DEFAULT_RATIO = 0.88

function maxW() {
  return Math.max(MIN, window.innerWidth - 48)
}

function defaultW() {
  return Math.round(window.innerWidth * DEFAULT_RATIO)
}

function clamp(w: number) {
  return Math.min(maxW(), Math.max(MIN, w))
}

export function usePanelWidth() {
  const [width, setWidth] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return clamp(Number(raw))
    } catch {
      /* ignore */
    }
    return clamp(defaultW())
  })

  useEffect(() => {
    function onResize() {
      setWidth((w) => clamp(w))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, String(width))
    } catch {
      /* ignore */
    }
  }, [width])

  const startResize = useCallback((e: ReactPointerEvent) => {
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
  }, [width])

  return { width, startResize, setWidth, min: MIN, max: maxW() }
}
