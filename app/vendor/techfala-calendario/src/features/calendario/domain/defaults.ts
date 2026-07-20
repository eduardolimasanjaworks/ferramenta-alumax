/**
 * Defaults de disponibilidade e regras — seed do domínio.
 * Usado por adapters locais e migração futura Directus.
 */
import type {
  DiaSemana,
  Disponibilidade,
  RegrasAgendamento,
  SlotDia,
} from './models'

const DIAS: DiaSemana[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']

function slot(ativo: boolean): SlotDia {
  return {
    ativo,
    janelas: [{ inicio: '09:00', fim: '18:00' }],
    intervaloMin: 30,
  }
}

export function disponibilidadePadrao(): Disponibilidade {
  const dias = Object.fromEntries(
    DIAS.map((d) => [d, slot(d !== 'dom' && d !== 'sab')]),
  ) as Record<DiaSemana, SlotDia>
  return { dias, todosOsDias: false, intervaloAtendimentoMin: 30 }
}

export function regrasPadrao(): RegrasAgendamento {
  return {
    tipoAgendamento: 'Horário marcado',
    limiteDiasFuturos: 30,
    numHorariosCliente: 3,
    antecedenciaMinutos: 60,
    notifPadraoDesativadas: true,
    semSobreposicao: true,
  }
}

/** E-mail com quem o cliente deve compartilhar a agenda Google (clone TechFala). */
export const GOOGLE_SHARE_EMAIL = 'software.ai.cloud@gmail.com'
