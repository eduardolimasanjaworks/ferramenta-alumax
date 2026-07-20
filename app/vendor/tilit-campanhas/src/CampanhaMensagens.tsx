/**
 * Bloco de mensagens da campanha (até 5 textos livres).
 * Isolado do sheet para edição modular.
 */
import type { MensagemCampanha } from './types'
import { novaMsg } from './formHelpers'

type Props = {
  mensagens: MensagemCampanha[]
  onChange: (mensagens: MensagemCampanha[]) => void
}

export function CampanhaMensagens({ mensagens, onChange }: Props) {
  return (
    <div className="field">
      <div className="cp-msg-head">
        <span>Mensagens ({mensagens.length}/5) *</span>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={mensagens.length >= 5}
          onClick={() => onChange([...mensagens, novaMsg()])}
        >
          + Adicionar
        </button>
      </div>
      {mensagens.map((m, idx) => (
        <div key={m.id} className="cp-msg-card">
          <div className="cp-msg-top">
            <strong>Mensagem {idx + 1}</strong>
            {mensagens.length > 1 ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onChange(mensagens.filter((x) => x.id !== m.id))}
              >
                Remover
              </button>
            ) : null}
          </div>
          <textarea
            className="input"
            rows={3}
            placeholder="Digite a mensagem..."
            value={m.texto}
            onChange={(e) =>
              onChange(
                mensagens.map((x) =>
                  x.id === m.id ? { ...x, texto: e.target.value } : x,
                ),
              )
            }
          />
        </div>
      ))}
    </div>
  )
}
