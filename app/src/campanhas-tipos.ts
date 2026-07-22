/**
 * Tipos e helpers compartilhados das Campanhas (API ↔ worker).
 */
export type StatusCampanha =
  | 'rascunho'
  | 'agendada'
  | 'em_andamento'
  | 'pausada'
  | 'concluida'
  | 'cancelada';

export type MensagemCampanha = {
  id: string;
  tipo: string;
  texto: string;
};

export type CampanhaRow = {
  id: string;
  nome: string;
  tag: string;
  instancia: string;
  modo: 'livre' | 'template' | 'meta_template';
  metaTemplateName?: string;
  metaTemplateLang?: string;
  mensagens: MensagemCampanha[];
  delayMinSec: number;
  delayMaxSec: number;
  usarHorarios: boolean;
  horarioInicio: string | null;
  horarioFim: string | null;
  agendadoEm: string | null;
  status: StatusCampanha;
  criadoEm: string;
  atualizadoEm: string;
  publicoEstimado?: number;
  enviados?: number;
  falhas?: number;
  totalJobs?: number;
};

export type JobStatus = 'pendente' | 'enviando' | 'enviado' | 'erro' | 'cancelado';
