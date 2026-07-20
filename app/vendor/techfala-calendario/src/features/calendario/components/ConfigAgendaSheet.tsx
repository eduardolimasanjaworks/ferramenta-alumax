/**
 * Sheet “Configurar Agenda” — Google, notif, horários, regras e parâmetros do assistente.
 */
import { useEffect, useState } from 'react'
import {
  IconCalendar,
  IconExpand,
  IconListChecks,
  IconSettings,
  IconX,
} from '@/shared/icons'
import { ModalZoomBar, useModalZoom } from '@/shared/ui/ModalZoom'
import { configAgendaPadrao } from '../lib/configAgendaPadrao'
import { useCalendario } from '../store/calendarioStore'
import type { Agenda } from '../types'
import type { AgendaConfig } from '../types/agendaConfig'
import { CfgAccordion } from './config/CfgAccordion'
import { CfgToggleLinha } from './config/CfgToggleLinha'
import { SecaoDisponibilidade } from './config/SecaoDisponibilidade'
import { SecaoGoogle } from './config/SecaoGoogle'
import { SecaoMensagens } from './config/SecaoMensagens'
import { SecaoNotificacoes } from './config/SecaoNotificacoes'
import { SecaoParametros } from './config/SecaoParametros'
import { SecaoRegras } from './config/SecaoRegras'
import { SecaoServicos } from './config/SecaoServicos'

type Props = {
  agenda: Agenda
  onClose: () => void
  onSelecionar: (a: Agenda) => void
}

type SecaoId =
  | 'google'
  | 'notif'
  | 'disp'
  | 'regras'
  | 'servicos'
  | 'params'
  | 'msgs'

export function ConfigAgendaSheet({ agenda, onClose, onSelecionar }: Props) {
  const { agendas, atualizarAgenda, removerAgenda } = useCalendario()
  const [nome, setNome] = useState(agenda.nome)
  const [cor, setCor] = useState(agenda.cor)
  const [ativo, setAtivo] = useState(agenda.ativo)
  const [link, setLink] = useState(agenda.linkChamadaPadrao)
  const [config, setConfig] = useState<AgendaConfig>(
    () => agenda.config ?? configAgendaPadrao(),
  )
  const [abertas, setAbertas] = useState<Partial<Record<SecaoId, boolean>>>({})
  const [expandido, setExpandido] = useState(true)
  const { zoom, zoomIn, zoomOut, zoomReset } = useModalZoom()

  useEffect(() => {
    setNome(agenda.nome)
    setCor(agenda.cor)
    setAtivo(agenda.ativo)
    setLink(agenda.linkChamadaPadrao)
    setConfig(agenda.config ?? configAgendaPadrao())
  }, [agenda])

  function patchCfg(patch: Partial<AgendaConfig>) {
    setConfig((c) => ({ ...c, ...patch }))
  }

  function toggle(id: SecaoId) {
    setAbertas((s) => ({ ...s, [id]: !s[id] }))
  }

  const valido = Boolean(nome.trim())

  function salvar() {
    if (!valido) return
    atualizarAgenda(agenda.id, {
      nome: nome.trim(),
      cor,
      ativo,
      linkPublicoAtivo: false,
      linkChamadaPadrao: link.trim(),
      config,
    })
    onClose()
  }

  return (
    <div className="cal-overlay" role="presentation" onClick={onClose}>
      <aside
        className={`cal-sheet is-config${expandido ? ' is-expanded' : ''}`}
        role="dialog"
        aria-label="Configurar Agenda"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top right' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cal-sheet-head">
          <div className="cal-sheet-title-row">
            <span className="cal-sheet-icon cfg-head-ico">
              <IconSettings />
            </span>
            <h2>Configurar Agenda</h2>
          </div>
          <div className="cfg-head-actions">
            <ModalZoomBar
              zoom={zoom}
              onIn={zoomIn}
              onOut={zoomOut}
              onReset={zoomReset}
            />
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => setExpandido((v) => !v)}
              aria-label={expandido ? 'Reduzir painel' : 'Expandir painel'}
              title={expandido ? 'Reduzir' : 'Expandir'}
            >
              <IconExpand />
            </button>
            <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar">
              <IconX />
            </button>
          </div>
        </header>

        <div className="cal-sheet-body cfg-body">
          <div className="cal-form-row2">
            <label className="field">
              <span>Selecionar Agenda: *</span>
              <select
                className="input"
                value={agenda.id}
                onChange={(e) => {
                  const next = agendas.find((a) => a.id === e.target.value)
                  if (next) onSelecionar(next)
                }}
              >
                {agendas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Título da Agenda: *</span>
              <div className="cal-input-cor">
                <input
                  className="input"
                  placeholder="Título da Agenda"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
                <input
                  type="color"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  aria-label="Cor"
                />
              </div>
            </label>
          </div>

          <CfgToggleLinha
            checked={ativo}
            onChange={setAtivo}
            textoAtivo="O assistente irá gerenciar esta agenda automaticamente com base nas suas configurações."
            textoDesativado="O assistente não tem acesso e não pode gerenciar esta agenda."
          />

          <CfgAccordion
            titulo="Conectar com Calendário Google"
            aberto={!!abertas.google}
            onToggle={() => toggle('google')}
          >
            <SecaoGoogle config={config} onChange={patchCfg} />
          </CfgAccordion>

          <CfgAccordion
            titulo="Notificações Gerais"
            aberto={!!abertas.notif}
            onToggle={() => toggle('notif')}
          >
            <SecaoNotificacoes config={config} onChange={patchCfg} />
          </CfgAccordion>

          {ativo ? (
            <CfgAccordion
              titulo="Disponibilidade de Horários"
              icone={<IconCalendar />}
              aberto={!!abertas.disp}
              onToggle={() => toggle('disp')}
            >
              <SecaoDisponibilidade config={config} onChange={patchCfg} />
            </CfgAccordion>
          ) : null}

          {ativo ? (
            <CfgAccordion
              titulo="Regras de Agendamento"
              icone={<IconListChecks />}
              aberto={!!abertas.regras}
              onToggle={() => toggle('regras')}
            >
              <SecaoRegras
                config={config}
                linkChamada={link}
                onLinkChamada={setLink}
                onChange={patchCfg}
              />
            </CfgAccordion>
          ) : null}

          {ativo ? (
            <CfgAccordion
              titulo="Serviços e Durações"
              aberto={!!abertas.servicos}
              onToggle={() => toggle('servicos')}
            >
              <SecaoServicos agendaId={agenda.id} />
            </CfgAccordion>
          ) : null}


          {ativo ? (
            <CfgAccordion
              titulo="Parâmetros do Agendamento"
              aberto={!!abertas.params}
              onToggle={() => toggle('params')}
            >
              <SecaoParametros
                itens={config.parametros}
                onChange={(parametros) => patchCfg({ parametros })}
                emptySub="Crie parâmetros personalizados e deixe o seu assistente mais preciso!"
              />
            </CfgAccordion>
          ) : null}


          {ativo ? (
            <CfgAccordion
              titulo="Mensagens de Êxito"
              aberto={!!abertas.msgs}
              onToggle={() => toggle('msgs')}
            >
              <SecaoMensagens
                itens={config.mensagensExito}
                onChange={(mensagensExito) => patchCfg({ mensagensExito })}
              />
            </CfgAccordion>
          ) : null}
        </div>

        <footer className="cal-sheet-foot">
          <button
            type="button"
            className="btn btn-outline danger-text"
            onClick={() => {
              if (window.confirm('Excluir esta agenda e seus eventos?')) {
                removerAgenda(agenda.id)
                onClose()
              }
            }}
          >
            Excluir Agenda
          </button>
          <div className="cal-sheet-foot-right">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!valido}
              onClick={salvar}
            >
              Salvar
            </button>
          </div>
        </footer>
      </aside>
    </div>
  )
}
