/**
 * Tipos da sidebar global de Tarefas (lista / form / calendário).
 * Separado das tarefas por contato (AbaTarefas) para o painel da toolbar.
 */

export type TarefaStatus = 'pendente' | 'em_andamento' | 'concluida'

export type Tarefa = {
  id: string
  titulo: string
  descricao: string
  vencimento: string
  hora: string
  status: TarefaStatus
  responsavel: string
}

export type TarefaFiltro = 'todas' | 'pendentes' | 'concluidas' | 'vencidas'

export type TarefaOrdenacao = 'vencimento' | 'titulo'

export type TarefasView = 'lista' | 'form' | 'calendario'

export type CalendarioModo = 'mes' | 'semana' | 'dia'

export type NovaTarefaInput = Omit<Tarefa, 'id'>
