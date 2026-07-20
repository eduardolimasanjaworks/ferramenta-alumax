/**
 * Seed e chave de persistência das tarefas do painel global.
 * Exemplo do dump HTML para a lista não começar vazia.
 */
import type { Tarefa } from './types'

export const TAREFAS_STORAGE_KEY = 'techfala-tarefas-v1'

export const TAREFAS_PADRAO: Tarefa[] = [
  {
    id: 'tar-demo-1',
    titulo: 'Ligar pro Diego HotCar',
    descricao:
      'O mesmo solicitou que entre em contato para ver disponibilidade para meet de apresentação. Alegou que não consegue cumprir horário, por isso não deixa pré agendado.',
    vencimento: '2026-05-29',
    hora: '09:00',
    status: 'pendente',
    responsavel: 'Você',
  },
]
