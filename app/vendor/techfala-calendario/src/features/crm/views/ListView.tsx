/**
 * Vista lista/grid focada em uma etapa por vez.
 * Navega entre estágios com setas, select e barra de progresso.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  IconChevronLeft,
  IconChevronRight,
  IconEllipsis,
  IconPlus,
  IconUsers,
} from '@/shared/icons'
import { ContactCard } from '../components/ContactCard'
import { useCrm } from '../store/crmStore'
import { PAGE_SIZE, hexToRgba, somaValores, formatBRL } from './viewUtils'

export function ListView() {
  const { colunasOrdenadas, contatosFiltrados, adicionarContato } = useCrm()
  const [idx, setIdx] = useState(0)
  const [visiveis, setVisiveis] = useState(PAGE_SIZE)

  const coluna = colunasOrdenadas[idx] ?? colunasOrdenadas[0]

  useEffect(() => {
    setVisiveis(PAGE_SIZE)
  }, [idx])

  const contatos = useMemo(
    () =>
      coluna
        ? contatosFiltrados.filter((c) => c.colunaId === coluna.id)
        : [],
    [contatosFiltrados, coluna],
  )

  if (!coluna) return null

  const slice = contatos.slice(0, visiveis)
  const resto = contatos.length - slice.length
  const totalValor = somaValores(contatos)
  const podePrev = idx > 0
  const podeNext = idx < colunasOrdenadas.length - 1

  return (
    <div className="list-view">
      <header
        className="list-view-header"
        style={{ background: hexToRgba(coluna.cor, 0.08) }}
      >
        <button
          type="button"
          className="btn btn-icon"
          disabled={!podePrev}
          aria-label="Etapa anterior"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
        >
          <IconChevronLeft />
        </button>

        <div className="list-view-center">
          <label className="list-stage-select">
            <span
              className="dot"
              style={{ background: coluna.cor }}
              aria-hidden
            />
            <select
              value={coluna.id}
              onChange={(e) => {
                const i = colunasOrdenadas.findIndex(
                  (c) => c.id === e.target.value,
                )
                if (i >= 0) setIdx(i)
              }}
            >
              {colunasOrdenadas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titulo}
                </option>
              ))}
            </select>
          </label>

          <div className="list-count">
            <IconUsers />
            <strong>{contatos.length}</strong>
            <span>contatos</span>
            {totalValor > 0 ? (
              <span className="valor-badge">{formatBRL(totalValor)}</span>
            ) : null}
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              const nome = window.prompt('Nome do contato')
              if (nome?.trim()) adicionarContato(coluna.id, nome.trim())
            }}
          >
            <IconPlus /> Adicionar
          </button>
          <button type="button" className="btn btn-icon sm" aria-label="Mais opções">
            <IconEllipsis />
          </button>
        </div>

        <button
          type="button"
          className="btn btn-icon"
          disabled={!podeNext}
          aria-label="Próxima etapa"
          onClick={() =>
            setIdx((i) => Math.min(colunasOrdenadas.length - 1, i + 1))
          }
        >
          <IconChevronRight />
        </button>
      </header>

      <div className="list-progress" role="tablist" aria-label="Etapas">
        {colunasOrdenadas.map((c, i) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={i === idx}
            className="list-progress-dot"
            style={{
              background:
                i === idx ? c.cor : hexToRgba(c.cor, 0.25),
            }}
            title={c.titulo}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>

      <div className="list-grid-wrap">
        <div className="list-grid">
          {slice.map((c) => (
            <ContactCard key={c.id} contato={c} />
          ))}
        </div>
        {contatos.length === 0 ? (
          <p className="rows-empty">Nenhum contato nesta etapa</p>
        ) : null}
        {resto > 0 ? (
          <div className="list-load-more">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setVisiveis((v) => v + PAGE_SIZE)}
            >
              Carregar mais ({resto})
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
