/**
 * Lista + busca + empty state do sheet de Campos.
 * Filtra por nome/descrição em tempo real.
 */
import { useMemo, useState } from 'react'
import { IconSearch } from '@/shared/icons'
import { CampoCard } from './CampoCard'
import { useCampos } from './camposStore'

export function CamposLista() {
  const { campos, remover } = useCampos()
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return campos
    return campos.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.descricao.toLowerCase().includes(q),
    )
  }, [campos, busca])

  return (
    <>
      <div className="campos-busca">
        <IconSearch />
        <input
          className="input"
          placeholder="Buscar campos..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="campos-lista-scroll">
        {filtrados.length === 0 ? (
          <div className="campos-empty">
            <div className="campos-empty-art" aria-hidden>
              <svg viewBox="0 0 120 120" fill="none">
                <rect
                  x="28"
                  y="24"
                  width="64"
                  height="72"
                  rx="8"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  d="M44 48h32M44 64h24M44 80h16"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3>Nenhum campo encontrado</h3>
            <p>Crie um novo campo personalizado para começar.</p>
          </div>
        ) : (
          filtrados.map((c) => (
            <CampoCard key={c.id} campo={c} onRemover={remover} />
          ))
        )}
      </div>
    </>
  )
}
