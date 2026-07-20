/**
 * Formulário inline para novo contato na coluna.
 * Coleta nome, telefone e preferência de atendimento pela IA.
 */
import { useState } from 'react'
import { useCrm } from '../store/crmStore'

type Props = { colunaId: string; onClose: () => void }

export function AddContactForm({ colunaId, onClose }: Props) {
  const { adicionarContato } = useCrm()
  const [nome, setNome] = useState('')
  const [ddi, setDdi] = useState('+55')
  const [telefone, setTelefone] = useState('')
  const [iaAtiva, setIaAtiva] = useState(true)
  const [hint, setHint] = useState('')

  const valido = Boolean(nome.trim() && telefone.trim())

  function salvar() {
    if (!valido) {
      setHint('Preencha nome e telefone.')
      return
    }
    adicionarContato(colunaId, {
      nome: nome.trim(),
      telefone: telefone.trim(),
      ddi,
      iaAtiva,
    })
    setNome('')
    setTelefone('')
    onClose()
  }

  return (
    <div className="add-form">
      <input
        className="input"
        autoFocus
        placeholder="Nome do contato"
        value={nome}
        onChange={(e) => {
          setNome(e.target.value)
          setHint('')
        }}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />
      <div className="phone-row">
        <select
          className="input ddi"
          value={ddi}
          onChange={(e) => setDdi(e.target.value)}
          aria-label="DDI"
        >
          <option value="+55">🇧🇷 +55</option>
          <option value="+1">🇺🇸 +1</option>
          <option value="+351">🇵🇹 +351</option>
          <option value="+34">🇪🇸 +34</option>
          <option value="+54">🇦🇷 +54</option>
        </select>
        <input
          className="input"
          placeholder="Telefone *"
          value={telefone}
          onChange={(e) => {
            setTelefone(e.target.value)
            setHint('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') salvar()
            if (e.key === 'Escape') onClose()
          }}
        />
      </div>
      <div className="campo-switch-row">
        <div>
          <label htmlFor="add-ia">Atendimento pela IA</label>
          <p className="field-hint" style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>
            Mesmo controle do Assistente neste telefone
          </p>
        </div>
        <button
          type="button"
          role="switch"
          id="add-ia"
          aria-checked={iaAtiva}
          className={`campo-switch${iaAtiva ? ' is-on' : ''}`}
          onClick={() => setIaAtiva((v) => !v)}
        >
          <span className="campo-switch-knob" />
        </button>
      </div>
      {hint ? <p className="empty-hint">{hint}</p> : null}
      <div className="add-form-actions">
        <span
          className="add-save-wrap"
          style={{ flex: 1, display: 'flex' }}
          onClick={() => {
            if (!valido) setHint('Preencha nome e telefone.')
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            disabled={!valido}
            onClick={salvar}
            style={{ flex: 1 }}
          >
            Salvar
          </button>
        </span>
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
