/**
 * Aba Dados personalizados — chave/valor livres no contato.
 */
import { useState } from 'react'
import type { Contato } from '@/shared/types/crm'
import { useCrm } from '../store/crmStore'

type Props = { contato: Contato }

export function AbaPersonalizados({ contato }: Props) {
  const { atualizarContato } = useCrm()
  const [chave, setChave] = useState('')
  const [valor, setValor] = useState('')
  const entries = Object.entries(contato.camposPersonalizados)

  function adicionar() {
    const k = chave.trim()
    if (!k) return
    atualizarContato(contato.id, {
      camposPersonalizados: {
        ...contato.camposPersonalizados,
        [k]: valor,
      },
    })
    setChave('')
    setValor('')
  }

  function remover(k: string) {
    const next = { ...contato.camposPersonalizados }
    delete next[k]
    atualizarContato(contato.id, { camposPersonalizados: next })
  }

  return (
    <div className="aba-form">
      {entries.length === 0 ? (
        <p className="empty-hint">Nenhum campo personalizado.</p>
      ) : (
        <ul className="kv-list">
          {entries.map(([k, v]) => (
            <li key={k}>
              <strong>{k}</strong>
              <span>{v}</span>
              <button type="button" className="btn btn-ghost btn-icon sm" onClick={() => remover(k)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="inline-add">
        <input className="input" placeholder="Campo" value={chave} onChange={(e) => setChave(e.target.value)} />
        <input className="input" placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} />
        <button type="button" className="btn btn-primary" onClick={adicionar}>
          Adicionar
        </button>
      </div>
    </div>
  )
}
