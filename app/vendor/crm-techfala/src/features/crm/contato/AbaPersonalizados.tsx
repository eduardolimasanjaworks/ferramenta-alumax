/**
 * Aba Dados personalizados — campos do catálogo tipados + extras livres.
 */
import { useMemo, useState } from 'react'
import type { Contato } from '@/shared/types/crm'
import { useCampos } from '../campos/camposStore'
import type { CampoPersonalizado } from '../campos/types'
import { useCrm } from '../store/crmStore'

type Props = { contato: Contato }

function CampoInput({
  campo,
  valor,
  onChange,
}: {
  campo: CampoPersonalizado
  valor: string
  onChange: (v: string) => void
}) {
  if (campo.tipo === 'booleano') {
    const on = valor === 'true' || valor === '1' || valor === 'sim'
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className={`switch${on ? ' is-on' : ''}`}
        onClick={() => onChange(on ? 'false' : 'true')}
      >
        <span className="switch-knob" />
      </button>
    )
  }

  if (campo.tipo === 'lista') {
    const opcoes = campo.opcoes?.length ? campo.opcoes : null
    if (opcoes) {
      return (
        <select
          className="input"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Selecione</option>
          {opcoes.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )
    }
  }

  const inputType =
    campo.tipo === 'numero' ? 'number' : campo.tipo === 'data' ? 'date' : 'text'

  return (
    <input
      className="input"
      type={inputType}
      value={valor}
      placeholder={campo.descricao || campo.nome}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function AbaPersonalizados({ contato }: Props) {
  const { atualizarContato } = useCrm()
  const { campos } = useCampos()
  const [chave, setChave] = useState('')
  const [valorLivre, setValorLivre] = useState('')

  const ativos = useMemo(
    () => campos.filter((c) => c.ativo).sort((a, b) => a.nome.localeCompare(b.nome)),
    [campos],
  )

  const nomesCatalogo = useMemo(
    () => new Set(ativos.map((c) => c.nome)),
    [ativos],
  )

  const extras = useMemo(
    () =>
      Object.entries(contato.camposPersonalizados).filter(
        ([k]) => !nomesCatalogo.has(k),
      ),
    [contato.camposPersonalizados, nomesCatalogo],
  )

  function setValor(nome: string, valor: string) {
    atualizarContato(contato.id, {
      camposPersonalizados: {
        ...contato.camposPersonalizados,
        [nome]: valor,
      },
    })
  }

  function remover(k: string) {
    const next = { ...contato.camposPersonalizados }
    delete next[k]
    atualizarContato(contato.id, { camposPersonalizados: next })
  }

  function adicionarLivre() {
    const k = chave.trim()
    if (!k) return
    setValor(k, valorLivre)
    setChave('')
    setValorLivre('')
  }

  return (
    <div className="aba-form">
      {ativos.length === 0 && extras.length === 0 ? (
        <p className="empty-hint">
          Nenhum campo no catálogo. Crie em Campos Personalizados na toolbar.
        </p>
      ) : null}

      {ativos.map((campo) => (
        <label key={campo.id} className="field">
          <span>
            {campo.nome}
            {campo.descricao ? (
              <em className="field-hint"> — {campo.descricao}</em>
            ) : null}
          </span>
          <CampoInput
            campo={campo}
            valor={contato.camposPersonalizados[campo.nome] ?? ''}
            onChange={(v) => setValor(campo.nome, v)}
          />
        </label>
      ))}

      {extras.length > 0 ? (
        <>
          <p className="empty-hint">Campos avulsos</p>
          <ul className="kv-list">
            {extras.map(([k, v]) => (
              <li key={k}>
                <strong>{k}</strong>
                <span>{v}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon sm"
                  onClick={() => remover(k)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <div className="inline-add">
        <input
          className="input"
          placeholder="Campo avulso"
          value={chave}
          onChange={(e) => setChave(e.target.value)}
        />
        <input
          className="input"
          placeholder="Valor"
          value={valorLivre}
          onChange={(e) => setValorLivre(e.target.value)}
        />
        <button type="button" className="btn btn-primary" onClick={adicionarLivre}>
          Adicionar
        </button>
      </div>
    </div>
  )
}
