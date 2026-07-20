/**
 * Lista de agendas na sub-sidebar: busca, toggle e ações.
 * O + abre Nova Agenda; engrenagem abre Configurar.
 */
import { useMemo, useState } from 'react'
import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconPlus,
  IconSearch,
  IconSettings,
  IconTrash,
} from '@/shared/icons'
import { useCalendario } from '../store/calendarioStore'
import type { Agenda } from '../types'

type Props = {
  onNovaAgenda: () => void
  onConfigurar: (a: Agenda) => void
}

export function AgendasSideList({ onNovaAgenda, onConfigurar }: Props) {
  const { agendas, atualizarAgenda, removerAgenda } = useCalendario()
  const [aberto, setAberto] = useState(true)
  const [busca, setBusca] = useState('')

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return agendas
    return agendas.filter((a) => a.nome.toLowerCase().includes(q))
  }, [agendas, busca])

  return (
    <div className="cal-agendas-side">
      <button
        type="button"
        className="cal-agendas-toggle"
        onClick={() => setAberto((v) => !v)}
      >
        <span className="cal-agendas-toggle-left">
          Agendas
        </span>
        {aberto ? <IconChevronUp /> : <IconChevronDown />}
      </button>

      {aberto ? (
        <>
          <div className="cal-agendas-busca">
            <IconSearch />
            <input
              placeholder="Buscar agendas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <button
              type="button"
              className="cal-agendas-add"
              title="Nova Agenda"
              aria-label="Nova Agenda"
              onClick={onNovaAgenda}
            >
              <IconPlus />
            </button>
          </div>

          <ul className="cal-agendas-ul">
            {filtradas.map((a) => (
              <li key={a.id} className="cal-agenda-row">
                <button
                  type="button"
                  className={`cal-agenda-check${a.visivel ? ' is-on' : ''}`}
                  style={{ background: a.visivel ? a.cor : 'transparent', borderColor: a.cor }}
                  title={a.visivel ? 'Ocultar na grade' : 'Mostrar na grade'}
                  onClick={() => atualizarAgenda(a.id, { visivel: !a.visivel })}
                >
                  {a.visivel ? <IconCheck /> : null}
                </button>
                <span className="cal-agenda-row-nome">{a.nome}</span>
                <button
                  type="button"
                  className="cal-agenda-ico"
                  title="Configurar"
                  onClick={() => onConfigurar(a)}
                >
                  <IconSettings />
                </button>
                <button
                  type="button"
                  className="cal-agenda-ico"
                  title="Excluir"
                  onClick={() => {
                    if (window.confirm(`Excluir agenda “${a.nome}”?`)) {
                      removerAgenda(a.id)
                    }
                  }}
                >
                  <IconTrash />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
