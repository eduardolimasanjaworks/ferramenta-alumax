/**
 * Aba Tags — buscar, adicionar e listar tags do contato.
 */
import { useState } from 'react'
import type { Contato } from '@/shared/types/crm'
import { useCrm } from '../store/crmStore'

type Props = { contato: Contato }

export function AbaTags({ contato }: Props) {
  const { atualizarContato } = useCrm()
  const [busca, setBusca] = useState('')
  const [nova, setNova] = useState('')

  const filtradas = contato.tags.filter((t) =>
    t.toLowerCase().includes(busca.trim().toLowerCase()),
  )

  function adicionar() {
    const t = nova.trim()
    if (!t || contato.tags.includes(t)) return
    atualizarContato(contato.id, { tags: [...contato.tags, t] })
    setNova('')
  }

  function remover(tag: string) {
    atualizarContato(contato.id, {
      tags: contato.tags.filter((t) => t !== tag),
    })
  }

  return (
    <div className="aba-form">
      <input
        className="input"
        placeholder="Buscar tags..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {contato.tags.length === 0 ? (
        <div className="empty-block">
          <p>Nenhuma tag</p>
          <p className="empty-hint">Nenhuma tag associada a este contato</p>
        </div>
      ) : (
        <div className="tag-list">
          {filtradas.map((t) => (
            <button key={t} type="button" className="tag-chip" onClick={() => remover(t)}>
              {t} ×
            </button>
          ))}
        </div>
      )}

      <div className="inline-add">
        <input
          className="input"
          placeholder="Adicionar tag"
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && adicionar()}
        />
        <button type="button" className="btn btn-primary" onClick={adicionar}>
          Adicionar tag
        </button>
      </div>
    </div>
  )
}
