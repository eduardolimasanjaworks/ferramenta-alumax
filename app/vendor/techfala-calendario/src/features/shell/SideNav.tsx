/**
 * Sidebar esquerda do TechFala (só ícones, ativo rosa).
 * Replica o chrome Bubble do dump — não é nav inferior.
 */
import { NAV_ITEMS, type RotaId } from './navItems'

type Props = {
  ativa: RotaId
  onNavigate: (id: RotaId) => void
}

export function SideNav({ ativa, onNavigate }: Props) {
  return (
    <aside className="sidebar" aria-label="Navegação principal">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`sidebar-item${ativa === item.id ? ' is-active' : ''}`}
          title={item.label}
          aria-label={item.label}
          aria-current={ativa === item.id ? 'page' : undefined}
          onClick={() => onNavigate(item.id)}
        >
          {item.icon}
        </button>
      ))}
    </aside>
  )
}
