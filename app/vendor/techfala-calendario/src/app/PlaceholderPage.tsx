/**
 * Placeholder para módulos ainda não recriados.
 */
type Props = { titulo: string }

export function PlaceholderPage({ titulo }: Props) {
  return (
    <div className="placeholder">
      <div>
        <h1>{titulo}</h1>
        <p>Em breve. Nesta fase o CRM Kanban é o módulo ativo.</p>
      </div>
    </div>
  )
}
