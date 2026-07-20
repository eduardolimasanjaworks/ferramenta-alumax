/**
 * Aba Dados: campos principais do contato (nome, telefone, etc.).
 */
import type { Contato } from '@/shared/types/crm'
import { useCrm } from '../store/crmStore'

type Props = { contato: Contato }

export function AbaDados({ contato }: Props) {
  const { atualizarContato } = useCrm()

  function set<K extends keyof Contato>(key: K, value: Contato[K]) {
    atualizarContato(contato.id, { [key]: value } as Partial<Contato>)
  }

  return (
    <div className="aba-form">
      <label className="field">
        <span>Nome *</span>
        <input
          className="input"
          placeholder="Nome do contato"
          value={contato.nome}
          onChange={(e) => set('nome', e.target.value)}
        />
      </label>

      <label className="field">
        <span>Telefone *</span>
        <div className="phone-row">
          <select
            className="input ddi"
            value={contato.ddi}
            onChange={(e) => set('ddi', e.target.value)}
            aria-label="Country selector"
          >
            <option value="+55">🇧🇷 +55</option>
            <option value="+1">🇺🇸 +1</option>
            <option value="+351">🇵🇹 +351</option>
            <option value="+34">🇪🇸 +34</option>
            <option value="+54">🇦🇷 +54</option>
          </select>
          <input
            className="input"
            placeholder="Digite o telefone"
            value={contato.telefone}
            onChange={(e) => set('telefone', e.target.value)}
          />
        </div>
      </label>

      <label className="field">
        <span>Email</span>
        <input
          className="input"
          placeholder="email@exemplo.com"
          value={contato.email}
          onChange={(e) => set('email', e.target.value)}
        />
      </label>

      <label className="field">
        <span>Origem</span>
        <input
          className="input"
          placeholder="Ex: Site, Indicação, WhatsApp..."
          value={contato.origem}
          onChange={(e) => set('origem', e.target.value)}
        />
      </label>

      <label className="field">
        <span>Data de Nascimento</span>
        <input
          className="input"
          type="date"
          value={contato.dataNascimento}
          onChange={(e) => set('dataNascimento', e.target.value)}
        />
      </label>

      <label className="field">
        <span>Valor da Oportunidade</span>
        <input
          className="input"
          placeholder="R$ 0,00"
          value={contato.valorOportunidade}
          onChange={(e) => set('valorOportunidade', e.target.value)}
        />
      </label>

      <label className="field">
        <span>Anotações</span>
        <textarea
          className="input textarea"
          placeholder="Anotações sobre o contato..."
          rows={4}
          value={contato.anotacoes}
          onChange={(e) => set('anotacoes', e.target.value)}
        />
      </label>
    </div>
  )
}
