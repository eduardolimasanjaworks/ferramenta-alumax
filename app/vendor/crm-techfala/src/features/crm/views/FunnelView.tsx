/**
 * Vista funil: SVG à esquerda + grid da etapa selecionada à direita.
 * Mostra % e valor por estágio para leitura rápida do pipeline.
 */
import { useMemo, useState } from 'react'
import {
  IconLayers,
  IconPlus,
  IconUsers,
} from '@/shared/icons'
import type { Contato } from '@/shared/types/crm'
import { ColunaMenuButton } from '../components/ColunaMenuButton'
import { ContactCard } from '../components/ContactCard'
import { promptNovoContato } from '../components/promptNovoContato'
import { useDropContato } from '../hooks/useDropContato'
import { useCrm } from '../store/crmStore'
import { buildFunnelSlices, slicePath } from './funnelGeometry'
import {
  PAGE_SIZE,
  formatBRL,
  somaValores,
} from './viewUtils'

const SVG_W = 280

export function FunnelView() {
  const { colunasOrdenadas, contatosFiltrados, adicionarContato } = useCrm()
  const [selId, setSelId] = useState(colunasOrdenadas[0]?.id ?? '')
  const [visiveis, setVisiveis] = useState(PAGE_SIZE)

  const stats = useMemo(() => {
    const total = contatosFiltrados.length || 1
    return colunasOrdenadas.map((col) => {
      const list = contatosFiltrados.filter((c) => c.colunaId === col.id)
      return {
        col,
        list,
        count: list.length,
        pct: ((list.length / total) * 100).toFixed(1),
        valor: somaValores(list),
      }
    })
  }, [colunasOrdenadas, contatosFiltrados])

  const svgH = Math.max(360, stats.length * 88)
  const slices = useMemo(
    () =>
      buildFunnelSlices(
        stats.map((s) => ({ id: s.col.id, count: s.count })),
        SVG_W,
        svgH,
      ),
    [stats, svgH],
  )

  const ativo = stats.find((s) => s.col.id === selId) ?? stats[0]
  const drop = useDropContato(ativo?.col.id ?? '')
  if (!ativo) return null

  const sliceCards = ativo.list.slice(0, visiveis)
  const resto = ativo.list.length - sliceCards.length

  function selecionar(id: string) {
    setSelId(id)
    setVisiveis(PAGE_SIZE)
  }

  return (
    <div className="funnel-view">
      <div className="funnel-body">
        <aside className="funnel-aside" style={{ height: svgH }}>
          <div className="funnel-labels" style={{ height: svgH }}>
            {stats.map((s) => (
              <button
                key={s.col.id}
                type="button"
                className={
                  s.col.id === ativo.col.id
                    ? 'funnel-label is-active'
                    : 'funnel-label'
                }
                style={{ height: svgH / stats.length }}
                onClick={() => selecionar(s.col.id)}
              >
                <span className="funnel-label-title">{s.col.titulo}</span>
                <span className="funnel-label-pct">{s.pct}%</span>
                {s.valor > 0 ? (
                  <span className="valor-badge">{formatBRL(s.valor)}</span>
                ) : null}
              </button>
            ))}
          </div>
          <svg
            width={SVG_W}
            height={svgH}
            viewBox={`0 0 ${SVG_W} ${svgH}`}
            className="funnel-svg"
            aria-label="Funil de vendas"
          >
            <defs>
              {stats.map((s, i) => (
                <linearGradient
                  key={s.col.id}
                  id={`fg-${i}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={s.col.cor} stopOpacity="0.85" />
                  <stop offset="100%" stopColor={s.col.cor} stopOpacity="0.55" />
                </linearGradient>
              ))}
            </defs>
            {slices.map((sl, i) => (
              <g
                key={sl.id}
                onClick={() => selecionar(sl.id)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={slicePath(sl)}
                  fill={`url(#fg-${i})`}
                  stroke={sl.id === ativo.col.id ? '#fff' : 'transparent'}
                  strokeWidth={sl.id === ativo.col.id ? 2 : 0}
                />
                <text
                  x={SVG_W / 2}
                  y={sl.midY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="15"
                  fontWeight="700"
                  style={{ pointerEvents: 'none' }}
                >
                  {sl.count}
                </text>
              </g>
            ))}
          </svg>
        </aside>

        <section className="funnel-panel">
          <header className="funnel-panel-head">
            <h4>
              <span
                className="dot"
                style={{ background: ativo.col.cor }}
                aria-hidden
              />
              {ativo.col.titulo}
              <span className="muted-chip">{ativo.count} contatos</span>
            </h4>
            <div className="funnel-panel-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => promptNovoContato(ativo.col.id, adicionarContato)}
              >
                <IconPlus /> Adicionar
              </button>
              <ColunaMenuButton
                colunaId={ativo.col.id}
                titulo={ativo.col.titulo}
                cor={ativo.col.cor}
                contatosCount={ativo.count}
              />
            </div>
          </header>

          <div
            className={`funnel-panel-grid${drop.over ? ' is-over' : ''}`}
            onDragOver={drop.onDragOver}
            onDragLeave={drop.onDragLeave}
            onDrop={drop.onDrop}
          >
            {sliceCards.map((c: Contato) => (
              <ContactCard key={c.id} contato={c} />
            ))}
            {ativo.list.length === 0 ? (
              <p className="rows-empty">Nenhum contato nesta etapa</p>
            ) : null}
          </div>
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
        </section>
      </div>

      <footer className="funnel-footer">
        <span>
          <IconUsers /> {contatosFiltrados.length} contatos totais
        </span>
        <span>
          <IconLayers /> {colunasOrdenadas.length} etapas
        </span>
      </footer>
    </div>
  )
}
