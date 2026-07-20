/**
 * Menu ⋯ da coluna/etapa: renomear, cor e remover.
 * Ao remover com contatos, oferece mover para outra etapa ou excluir tudo.
 */
import { useEffect, useRef, useState } from 'react'
import { IconEllipsis } from '@/shared/icons'
import { useCrm } from '../store/crmStore'

const CORES = [
  'rgb(59, 130, 246)',
  'rgb(139, 92, 246)',
  'rgb(16, 185, 129)',
  'rgb(245, 158, 11)',
  'rgb(239, 68, 68)',
  'rgb(236, 72, 153)',
  'rgb(6, 182, 212)',
  'rgb(100, 116, 139)',
]

type Props = {
  colunaId: string
  titulo: string
  cor?: string
  contatosCount?: number
  className?: string
}

export function ColunaMenuButton({
  colunaId,
  titulo,
  cor,
  contatosCount = 0,
  className,
}: Props) {
  const { colunasOrdenadas, renomearColuna, alterarCorColuna, removerColuna } =
    useCrm()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function confirmarRemover() {
    if (contatosCount <= 0) {
      if (window.confirm(`Excluir a etapa "${titulo}"?`)) {
        removerColuna(colunaId)
      }
      return
    }

    const outras = colunasOrdenadas.filter((c) => c.id !== colunaId)
    const lista = outras
      .map((c, i) => `${i + 1}. ${c.titulo}`)
      .join('\n')
    const escolha = window.prompt(
      `Esta etapa tem ${contatosCount} contato(s).\n\nDigite o número da etapa para mover os contatos:\n\n${lista}\n\n(Cancelar para excluir todos os contatos)`,
    )

    if (escolha === null) {
      if (
        window.confirm(
          `Excluir a etapa "${titulo}" e todos os ${contatosCount} contatos nela?`,
        )
      ) {
        removerColuna(colunaId)
      }
      return
    }

    const idx = Number.parseInt(escolha.trim(), 10) - 1
    const destino = outras[idx]
    if (!destino) {
      window.alert('Etapa inválida.')
      return
    }
    removerColuna(colunaId, { moverParaId: destino.id })
  }

  return (
    <div className={`col-menu${className ? ` ${className}` : ''}`} ref={root}>
      <button
        type="button"
        className="btn btn-ghost btn-icon sm"
        aria-label="Menu da etapa"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IconEllipsis />
      </button>
      {open ? (
        <div className="col-menu-panel">
          <button
            type="button"
            onClick={() => {
              const next = window.prompt('Novo nome', titulo)
              if (next?.trim()) renomearColuna(colunaId, next.trim())
              setOpen(false)
            }}
          >
            Renomear
          </button>
          <div className="col-menu-cores" role="group" aria-label="Cor da etapa">
            <span className="col-menu-cores-label">Cor</span>
            <div className="col-menu-cores-grid">
              {CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`col-cor-swatch${cor === c ? ' is-active' : ''}`}
                  style={{ background: c }}
                  title={c}
                  aria-label={`Cor ${c}`}
                  onClick={() => {
                    alterarCorColuna(colunaId, c)
                    setOpen(false)
                  }}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            className="danger"
            onClick={() => {
              confirmarRemover()
              setOpen(false)
            }}
          >
            Remover
          </button>
        </div>
      ) : null}
    </div>
  )
}
