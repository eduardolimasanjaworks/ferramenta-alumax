/**
 * Sheet expansível: criar/editar campanha e agendar disparo.
 * Campos alinhados ao fluxo TechFala (tag, conexão, mensagens, delay, data).
 */
import { useEffect, useState } from 'react'
import { estimarPublico } from './api'
import { CampanhaAgendamento } from './CampanhaAgendamento'
import { CampanhaMensagens } from './CampanhaMensagens'
import { formVazio, novaMsg } from './formHelpers'
import type { Campanha, InstanciaOpt } from './types'

type Props = {
  inicial: Campanha | null
  tags: string[]
  instancias: InstanciaOpt[]
  expandido: boolean
  onToggleExpand: () => void
  onClose: () => void
  onSalvar: (c: Partial<Campanha> & { nome: string }, agendar: boolean) => Promise<void>
}

export function CampanhaSheet({
  inicial,
  tags,
  instancias,
  expandido,
  onToggleExpand,
  onClose,
  onSalvar,
}: Props) {
  const [form, setForm] = useState(() =>
    inicial
      ? {
          ...formVazio(),
          ...inicial,
          mensagens: inicial.mensagens?.length ? inicial.mensagens : [novaMsg()],
        }
      : formVazio(),
  )
  const [estimado, setEstimado] = useState(0)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!form.tag) {
      setEstimado(0)
      return
    }
    let cancel = false
    void estimarPublico(form.tag)
      .then((r) => {
        if (!cancel) setEstimado(r.total)
      })
      .catch(() => {
        if (!cancel) setEstimado(0)
      })
    return () => {
      cancel = true
    }
  }, [form.tag])

  const valido =
    Boolean(form.nome.trim()) &&
    Boolean(form.tag) &&
    Boolean(form.instancia) &&
    form.mensagens.some((m) => m.texto.trim())

  async function go(agendar: boolean) {
    if (!valido) return
    setSaving(true)
    setErro('')
    try {
      await onSalvar(
        {
          ...form,
          id: inicial?.id,
          nome: form.nome.trim(),
          mensagens: form.mensagens.filter((m) => m.texto.trim()),
          agendadoEm: form.agendadoEm ? new Date(form.agendadoEm).toISOString() : null,
        },
        agendar,
      )
      onClose()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cp-overlay" onClick={onClose} role="presentation">
      <aside
        className={`cp-sheet${expandido ? ' is-expanded' : ''}`}
        role="dialog"
        aria-label="Campanha"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cp-sheet-head">
          <h2>{inicial ? 'Editar campanha' : 'Nova campanha'}</h2>
          <div className="cp-sheet-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onToggleExpand}>
              {expandido ? 'Reduzir' : 'Expandir'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar">
              ✕
            </button>
          </div>
        </header>

        <div className="cp-sheet-body">
          {erro ? <p className="cp-erro">{erro}</p> : null}

          <label className="field">
            <span>Nome da Campanha *</span>
            <input
              className="input"
              placeholder="Ex: Promoção de Verão"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Público-alvo (tag) *</span>
            <select
              className="input"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
            >
              <option value="">Selecione uma tag...</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <span className="cp-hint">Público estimado: {estimado} contatos</span>
          </label>

          <label className="field">
            <span>Conexão de Envio *</span>
            <select
              className="input"
              value={form.instancia}
              onChange={(e) => setForm({ ...form, instancia: e.target.value })}
            >
              <option value="">Selecione...</option>
              {instancias.map((i) => (
                <option key={i.name} value={i.name}>
                  {i.label}
                </option>
              ))}
            </select>
          </label>

          <CampanhaMensagens
            mensagens={form.mensagens}
            onChange={(mensagens) => setForm({ ...form, mensagens })}
          />

          <CampanhaAgendamento
            form={form}
            onPatch={(p) =>
              setForm({
                ...form,
                ...p,
                horarioInicio: p.horarioInicio === null ? undefined : p.horarioInicio ?? form.horarioInicio,
                horarioFim: p.horarioFim === null ? undefined : p.horarioFim ?? form.horarioFim,
                agendadoEm:
                  p.agendadoEm !== undefined ? p.agendadoEm : form.agendadoEm ?? null,
              })
            }
          />
        </div>

        <footer className="cp-sheet-foot">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={!valido || saving}
            onClick={() => void go(false)}
          >
            Salvar rascunho
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!valido || saving}
            onClick={() => void go(true)}
          >
            Agendar disparo
          </button>
        </footer>
      </aside>
    </div>
  )
}
