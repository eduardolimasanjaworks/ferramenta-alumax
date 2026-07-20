/**
 * Texto de ajuda da conexão Google (regras do app clonado).
 * UI pode importar; backend real usa o mesmo e-mail de compartilhamento.
 */
import { GOOGLE_SHARE_EMAIL } from '../domain/defaults'

export const GOOGLE_HELP_PASSOS = [
  `No Google, acesse as configurações e compartilhamento da agenda e compartilhe com ${GOOGLE_SHARE_EMAIL}. Nível de acesso: "Fazer alterações nos eventos".`,
  'Role até encontrar o ID DA AGENDA, copie e cole no campo.',
  'TODAS as configurações de disponibilidade de horário devem ser feitas neste calendário.',
] as const

export const GOOGLE_HELP_EXPECTATIVAS = [
  'Ao consultar horários (assistente ou link público), consideramos também eventos da agenda Google — não marcamos em horários ocupados lá.',
  'Ao criar/editar/excluir um evento aqui, espelhamos na agenda Google.',
  'Eventos criados só no Google NÃO são copiados para o nosso calendário.',
] as const
