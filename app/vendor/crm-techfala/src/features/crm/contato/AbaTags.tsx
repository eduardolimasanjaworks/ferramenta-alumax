/**
 * Aba Tags — buscar, adicionar e listar tags do contato.
 * Sugere do catálogo; cria tag nova no catálogo quando necessário.
 */
import { useMemo, useState } from 'react'
import type { Contato } from '@/shared/types/crm'
import { useTags } from '../tags/tagsStore'
import { useCrm } from '../store/crmStore'

type Props = { contato: Contato }

export function AbaTags({ contato }: Props) {
  const { atualizarContato } = useCrm()
  const { tags, criarTag } = useTags()
  const [busca, setBusca] = useState('')
  const [nova, setNova] = useState('')

  const catalogoAtivo = useMemo(
    () => tags.filter((t) => t.ativo),
    [tags],
  )

  const filtradas = contato.tags.filter((t) =>
    t.toLowerCase().includes(busca.trim().toLowerCase()),
  )

  const chipsDisponiveis = catalogoAtivo.filter(
    (t) =>
      !contato.tags.includes(t.nome) &&
      t.nome.toLowerCase().includes(busca.trim().toLowerCase()),
  )

  function vincular(nome: string) {
    const t = nome.trim()
    if (!t || contato.tags.includes(t)) return
    atualizarContato(contato.id, { tags: [...contato.tags, t] })
  }

  async function adicionar() {
    const t = nova.trim()
    if (!t || contato.tags.includes(t)) return
    const jaNoCatalogo = catalogoAtivo.some(
      (x) => x.nome.toLowerCase() === t.toLowerCase(),
    )
    if (jaNoCatalogo) {
      vincular(
        catalogoAtivo.find((x) => x.nome.toLowerCase() === t.toLowerCase())!
          .nome,
      )
      setNova('')
      return
    }
    try {
      const criada = await criarTag({ nome: t })
      vincular(criada.nome)
      setNova('')
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : 'Não foi possível criar a tag.',
      )
    }
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

      {chipsDisponiveis.length > 0 ? (
        <div className="tag-suggestions">
          <span className="empty-hint">Sugestões do catálogo</span>
          <div className="tag-list">
            {chipsDisponiveis.map((t) => (
              <button
                key={t.id}
                type="button"
                className="tag-chip tag-chip-add"
                onClick={() => vincular(t.nome)}
              >
                + {t.nome}
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
          onKeyDown={(e) => e.key === 'Enter' && void adicionar()}
        />
        <button type="button" className="btn btn-primary" onClick={() => void adicionar()}>
          Adicionar tag
        </button>
      </div>
    </div>
  )
}
