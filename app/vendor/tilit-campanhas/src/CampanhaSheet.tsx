/**
 * Sheet expansível: criar/editar campanha e agendar disparo.
 * Campos alinhados ao fluxo TechFala (tag, conexão, mensagens, delay, data).
 */
import { useEffect, useState } from 'react'
import { estimarPublico, listarMetaTemplates, criarMetaTemplate } from './api'
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

  const [metaTemplates, setMetaTemplates] = useState<any[]>([])
  const [carregandoTemplates, setCarregandoTemplates] = useState(false)
  const [showCriarTemplate, setShowCriarTemplate] = useState(false)
  const [novoTemplate, setNovoTemplate] = useState({ name: '', category: 'MARKETING' as 'MARKETING' | 'UTILITY', text: '', language: 'pt_BR' })
  const [erroTemplate, setErroTemplate] = useState('')

  useEffect(() => {
    if (form.modo === 'meta_template') {
      setCarregandoTemplates(true)
      listarMetaTemplates()
        .then((r) => setMetaTemplates(r.templates))
        .catch(() => {})
        .finally(() => setCarregandoTemplates(false))
    }
  }, [form.modo])

  async function handleCriarTemplate() {
    if (!novoTemplate.name.trim() || !novoTemplate.text.trim()) return
    setErroTemplate('')
    try {
      await criarMetaTemplate(novoTemplate)
      const r = await listarMetaTemplates()
      setMetaTemplates(r.templates)
      setForm({ ...form, metaTemplateName: novoTemplate.name.toLowerCase().replace(/[^a-z0-9_]/g, '_') })
      setShowCriarTemplate(false)
      setNovoTemplate({ name: '', category: 'MARKETING', text: '', language: 'pt_BR' })
    } catch (e) {
      setErroTemplate(e instanceof Error ? e.message : 'Falha ao criar template')
    }
  }

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
    (form.modo === 'meta_template'
      ? Boolean(form.metaTemplateName)
      : form.mensagens.some((m) => m.texto.trim()))

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

          <label className="field">
            <span>Modo de Envio *</span>
            <select
              className="input"
              value={form.modo}
              onChange={(e) => setForm({ ...form, modo: e.target.value as any })}
            >
              <option value="livre">Mensagem Livre (WhatsApp normal)</option>
              <option value="meta_template">Template Oficial (Meta WABA)</option>
            </select>
          </label>

          {form.modo === 'meta_template' ? (
            <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px', margin: '10px 0' }}>
              <label className="field">
                <span>Template Oficial Meta *</span>
                {carregandoTemplates ? (
                  <span className="cp-hint">Carregando templates oficiais...</span>
                ) : (
                  <select
                    className="input"
                    value={form.metaTemplateName || ''}
                    onChange={(e) => setForm({ ...form, metaTemplateName: e.target.value })}
                  >
                    <option value="">Selecione um template aprovado...</option>
                    {metaTemplates.map((t: any) => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.status})
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label className="field">
                <span>Idioma do Template</span>
                <select
                  className="input"
                  value={form.metaTemplateLang || 'pt_BR'}
                  onChange={(e) => setForm({ ...form, metaTemplateLang: e.target.value })}
                >
                  <option value="pt_BR">Português (Brasil)</option>
                  <option value="en_US">Inglês (EUA)</option>
                  <option value="es_ES">Espanhol (Espanha)</option>
                </select>
              </label>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ marginTop: '8px' }}
                onClick={() => setShowCriarTemplate(!showCriarTemplate)}
              >
                {showCriarTemplate ? 'Cancelar criação de template' : '➕ Criar Novo Template no Meta'}
              </button>

              {showCriarTemplate && (
                <div style={{ marginTop: '12px', background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                  <h4>Novo Template de Mensagem</h4>
                  {erroTemplate ? <p className="cp-erro">{erroTemplate}</p> : null}
                  
                  <label className="field">
                    <span>Nome do Template (letras minúsculas e underline)</span>
                    <input
                      className="input"
                      placeholder="ex: promocao_novembro"
                      value={novoTemplate.name}
                      onChange={(e) => setNovoTemplate({ ...novoTemplate, name: e.target.value })}
                    />
                  </label>

                  <label className="field">
                    <span>Categoria</span>
                    <select
                      className="input"
                      value={novoTemplate.category}
                      onChange={(e) => setNovoTemplate({ ...novoTemplate, category: e.target.value as any })}
                    >
                      <option value="MARKETING">Marketing</option>
                      <option value="UTILITY">Utilidade</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Texto do Corpo</span>
                    <textarea
                      className="input"
                      style={{ minHeight: '80px', fontFamily: 'inherit' }}
                      placeholder="Olá! Temos novidades para você. Use {{1}} para variáveis dinâmicas."
                      value={novoTemplate.text}
                      onChange={(e) => setNovoTemplate({ ...novoTemplate, text: e.target.value })}
                    />
                  </label>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '8px' }}
                    onClick={handleCriarTemplate}
                    disabled={!novoTemplate.name.trim() || !novoTemplate.text.trim()}
                  >
                    Enviar para Aprovação do Meta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <CampanhaMensagens
              mensagens={form.mensagens}
              onChange={(mensagens) => setForm({ ...form, mensagens })}
            />
          )}

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
