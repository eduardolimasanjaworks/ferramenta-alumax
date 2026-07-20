/**
 * Migra contatos antigos do localStorage para o shape completo.
 * Evita crash ao abrir painel após atualizar o app.
 */
import { contatoVazio, type Contato } from '@/shared/types/crm'

export function normalizarContatos(lista: unknown): Contato[] {
  if (!Array.isArray(lista)) return []
  return lista.map((item) => {
    const c = item as Partial<Contato>
    const base = contatoVazio({
      id: c.id ?? crypto.randomUUID().slice(0, 12),
      nome: c.nome ?? 'Sem nome',
      colunaId: c.colunaId ?? 'col-novos',
      criadoEm: c.criadoEm ?? new Date().toISOString(),
    })
    const notas = (c.notas ?? []).map((n) => ({
      id: n.id ?? crypto.randomUUID().slice(0, 8),
      texto: n.texto ?? '',
      autor: n.autor ?? 'Você',
      email: n.email ?? '',
      criadoEm: n.criadoEm ?? new Date().toISOString(),
    }))
    const interacoes = (c.interacoes ?? []).map((i) => {
      const old = i as Contato['interacoes'][number] & {
        hora?: string
        responsavel?: string
      }
      return {
        id: old.id,
        descricao: old.descricao,
        data: old.data,
        hora: old.hora ?? '',
        responsavel: old.responsavel ?? '',
      }
    })
    return {
      ...base,
      ...c,
      id: base.id,
      nome: c.nome ?? base.nome,
      responsavel: c.responsavel ?? base.responsavel,
      responsavelUsuarioId:
        c.responsavelUsuarioId !== undefined
          ? c.responsavelUsuarioId
          : base.responsavelUsuarioId,
      automacaoAtiva:
        (c as { iaAtiva?: boolean }).iaAtiva ??
        c.automacaoAtiva ??
        base.automacaoAtiva,
      notas,
      interacoes,
      tarefas: c.tarefas ?? base.tarefas,
      timeline: c.timeline ?? base.timeline,
    }
  })
}
