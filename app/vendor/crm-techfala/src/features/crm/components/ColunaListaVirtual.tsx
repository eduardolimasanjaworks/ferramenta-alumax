/**
 * Lista virtual da coluna Kanban: monta só cards na viewport.
 * Sem isso, colunas com milhares de contatos travam o React no paint inicial.
 */
import { useEffect, useRef, useState } from 'react'
import type { Contato } from '@/shared/types/crm'
import { ContactCard } from './ContactCard'

/** Altura estimada (card + margem). Varia pouco; overscan cobre o resto. */
const ITEM_H = 88
const OVERSCAN = 10

type Props = { contatos: Contato[] }

export function ColunaListaVirtual({ contatos }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(Math.min(contatos.length, 40))

  useEffect(() => {
    const el = rootRef.current?.parentElement
    if (!el) return

    function medir() {
      const top = el!.scrollTop
      const h = el!.clientHeight || 600
      const s = Math.max(0, Math.floor(top / ITEM_H) - OVERSCAN)
      const e = Math.min(contatos.length, Math.ceil((top + h) / ITEM_H) + OVERSCAN)
      setStart(s)
      setEnd(e)
    }

    medir()
    el.addEventListener('scroll', medir, { passive: true })
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', medir)
      ro.disconnect()
    }
  }, [contatos.length])

  const slice = contatos.slice(start, end)
  const totalH = contatos.length * ITEM_H
  const offsetY = start * ITEM_H

  return (
    <div ref={rootRef} style={{ height: totalH, position: 'relative' }}>
      <div style={{ transform: `translateY(${offsetY}px)` }}>
        {slice.map((c) => (
          <ContactCard key={c.id} contato={c} />
        ))}
      </div>
    </div>
  )
}
