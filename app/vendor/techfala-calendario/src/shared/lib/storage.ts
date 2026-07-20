/**
 * Persistência localStorage com gravação adiada.
 * Evita travar a UI a cada keystroke/toggle (debounce + idle).
 */

const timers = new Map<string, ReturnType<typeof setTimeout>>()
const pending = new Map<string, unknown>()

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // silencioso: quota ou modo privado
  }
}

/** Agenda gravação; coalesca writes da mesma chave. */
export function saveJsonSoon<T>(key: string, value: T, ms = 280): void {
  pending.set(key, value)
  const prev = timers.get(key)
  if (prev) clearTimeout(prev)

  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key)
      const v = pending.get(key)
      pending.delete(key)
      if (v !== undefined) {
        const run = () => saveJson(key, v)
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(() => run(), { timeout: 400 })
        } else {
          run()
        }
      }
    }, ms),
  )
}

function flushAll() {
  for (const [key, value] of pending) {
    saveJson(key, value)
  }
  pending.clear()
  for (const t of timers.values()) clearTimeout(t)
  timers.clear()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushAll)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAll()
  })
}
