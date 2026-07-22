/**
 * Estado inicial e helpers do formulário de campanha.
 * Evita inflar CampanhaSheet com utils.
 */
import type { Campanha, MensagemCampanha } from './types'

export function novaMsg(): MensagemCampanha {
  return { id: `m-${crypto.randomUUID().slice(0, 6)}`, tipo: 'texto', texto: '' }
}

export function formVazio(): Partial<Campanha> & {
  nome: string
  mensagens: MensagemCampanha[]
} {
  return {
    nome: '',
    tag: '',
    instancia: '',
    modo: 'livre',
    metaTemplateName: '',
    metaTemplateLang: 'pt_BR',
    mensagens: [novaMsg()],
    delayMinSec: 30,
    delayMaxSec: 120,
    usarHorarios: false,
    horarioInicio: '09:00',
    horarioFim: '18:00',
    agendadoEm: null,
  }
}

export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
