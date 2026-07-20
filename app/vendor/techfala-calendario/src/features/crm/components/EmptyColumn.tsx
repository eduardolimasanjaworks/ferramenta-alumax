/**
 * Empty state da coluna — texto idêntico ao dump.
 * Arte local (sem AVIF externo).
 */
export function EmptyColumn() {
  return (
    <div className="empty-col">
      <svg className="empty-art" viewBox="0 0 80 80" fill="none" aria-hidden>
        <circle cx="40" cy="40" r="36" fill="#e2e8f0" />
        <circle cx="40" cy="32" r="12" fill="#94a3b8" />
        <path d="M16 62c4-14 14-22 24-22s20 8 24 22" fill="#94a3b8" />
      </svg>
      <p>Nenhum contato</p>
      <p className="hint">Arraste contatos para esta coluna.</p>
    </div>
  )
}
