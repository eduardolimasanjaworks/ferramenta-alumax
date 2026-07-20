/**
 * Vista em linhas: cada etapa vira uma faixa horizontal de cards.
 * Ideal para varrer muitos contatos por estágio sem o Kanban.
 */
import { useMemo, useState } from 'react'
import type { Coluna, Contato } from '@/shared/types/crm'
import { ContactCard } from '../components/ContactCard'
import { useCrm } from '../store/crmStore'
import { StageSectionHeader } from './StageSectionHeader'
import { PAGE_SIZE, somaValores } from './viewUtils'

function RowSection({
  coluna,
  contatos,
}: {
  coluna: Coluna
  contatos: Contato[]
}) {
  const { adicionarContato } = useCrm()
  const [visiveis, setVisiveis] = useState(PAGE_SIZE)
  const slice = contatos.slice(0, visiveis)
  const resto = contatos.length - slice.length
  const totalValor = somaValores(contatos)

  return (
    <section className="rows-section">
      <StageSectionHeader
        titulo={coluna.titulo}
        cor={coluna.cor}
        count={contatos.length}
        valorTotal={totalValor}
        onAdd={() => {
          const nome = window.prompt('Nome do contato')
          if (nome?.trim()) adicionarContato(coluna.id, nome.trim())
        }}
      />
      <div className="rows-track">
        {slice.map((c) => (
          <div key={c.id} className="rows-card-wrap">
            <ContactCard contato={c} />
          </div>
        ))}
        {resto > 0 ? (
          <button
            type="button"
            className="btn btn-ghost rows-load-more"
            onClick={() => setVisiveis((v) => v + PAGE_SIZE)}
          >
            Carregar mais ({resto})
          </button>
        ) : null}
        {contatos.length === 0 ? (
          <p className="rows-empty">Nenhum contato nesta etapa</p>
        ) : null}
      </div>
    </section>
  )
}

export function RowsView() {
  const { colunasOrdenadas, contatosFiltrados } = useCrm()

  const porColuna = useMemo(() => {
    const map = new Map<string, Contato[]>()
    for (const col of colunasOrdenadas) map.set(col.id, [])
    for (const c of contatosFiltrados) {
      const list = map.get(c.colunaId)
      if (list) list.push(c)
    }
    return map
  }, [colunasOrdenadas, contatosFiltrados])

  return (
    <div className="rows-view">
      {colunasOrdenadas.map((col) => (
        <RowSection
          key={col.id}
          coluna={col}
          contatos={porColuna.get(col.id) ?? []}
        />
      ))}
    </div>
  )
}
