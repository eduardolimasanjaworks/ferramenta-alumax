/**
 * Tipos do domínio CRM (colunas, contatos e área interna).
 * Fonte única para store, painel e persistência.
 */

export type ContatoArquivo = {
  id: string
  nome: string
  criadoEm: string
}

export type ContatoTarefa = {
  id: string
  titulo: string
  vencimento: string
  status: 'pendente' | 'em_andamento' | 'concluida'
  descricao: string
  responsavel: string
}

export type ContatoNota = {
  id: string
  texto: string
  autor: string
  email: string
  criadoEm: string
}

export type ContatoEvento = {
  id: string
  titulo: string
  descricao: string
  url: string
  inicioData: string
  inicioHora: string
  fimData: string
  fimHora: string
  calendario: string
  notificacao: boolean
}

export type ContatoInteracao = {
  id: string
  descricao: string
  data: string
  hora: string
  responsavel: string
}

export type TimelineItem = {
  id: string
  tipo: 'lead' | 'bot' | 'kanban' | 'nota' | 'interacao' | 'tarefa' | 'evento' | string
  titulo: string
  detalhe: string
  em: string
}

export type MultichatStatus =
  | 'em_atendimento'
  | 'aguardando'
  | 'concluido'

export type Contato = {
  id: string
  nome: string
  email: string
  telefone: string
  ddi: string
  origem: string
  dataNascimento: string
  valorOportunidade: string
  anotacoes: string
  camposPersonalizados: Record<string, string>
  tags: string[]
  arquivos: ContatoArquivo[]
  automacaoAtiva: boolean
  multichatStatus: MultichatStatus
  responsavelMultichat: string
  tarefas: ContatoTarefa[]
  notas: ContatoNota[]
  eventos: ContatoEvento[]
  interacoes: ContatoInteracao[]
  timeline: TimelineItem[]
  colunaId: string
  criadoEm: string
}

export type Coluna = {
  id: string
  titulo: string
  cor: string
  ordem: number
}

export type CrmState = {
  colunas: Coluna[]
  contatos: Contato[]
  busca: string
  zoom: number
  contatoAbertoId: string | null
}

/** Contato novo com campos da área interna vazios. */
export function contatoVazio(
  partial: Pick<Contato, 'id' | 'nome' | 'colunaId' | 'criadoEm'>,
): Contato {
  return {
    email: '',
    telefone: '',
    ddi: '+55',
    origem: '',
    dataNascimento: '',
    valorOportunidade: '',
    anotacoes: '',
    camposPersonalizados: {},
    tags: [],
    arquivos: [],
    automacaoAtiva: true,
    multichatStatus: 'aguardando',
    responsavelMultichat: '',
    tarefas: [],
    notas: [],
    eventos: [],
    interacoes: [],
    timeline: [
      {
        id: `tl-${partial.id}`,
        tipo: 'lead',
        titulo: 'Lead Criado',
        detalhe: 'Contato criado no sistema',
        em: partial.criadoEm,
      },
    ],
    ...partial,
  }
}
