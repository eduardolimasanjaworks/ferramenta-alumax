/**
 * Toggle com texto Ativado/Desativado (ou labels custom) conforme o estado.
 * label vazio = só o texto corrido (como no Bubble das regras).
 */
type Props = {
  checked: boolean
  onChange: (v: boolean) => void
  textoAtivo: string
  textoDesativado: string
  labelAtivo?: string
  labelDesativado?: string
}

export function CfgToggleLinha({
  checked,
  onChange,
  textoAtivo,
  textoDesativado,
  labelAtivo = 'Ativado',
  labelDesativado = 'Desativado',
}: Props) {
  const label = checked ? labelAtivo : labelDesativado
  const texto = checked ? textoAtivo : textoDesativado

  return (
    <div className="cfg-toggle-linha">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`campo-switch${checked ? ' is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="campo-switch-knob" />
      </button>
      <p>
        {label ? (
          <>
            <strong>{label}</strong> {texto}
          </>
        ) : (
          texto
        )}
      </p>
    </div>
  )
}
