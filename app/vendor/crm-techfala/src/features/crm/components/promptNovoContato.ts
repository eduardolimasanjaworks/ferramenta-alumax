/**
 * Fluxo rápido de prompt para criar contato fora do Kanban.
 * Pede nome e telefone em sequência; cancelar telefone aborta tudo.
 */
import type { NovoContatoInput } from '../store/crmStore'

export function promptNovoContato(
  colunaId: string,
  adicionar: (colunaId: string, dados: NovoContatoInput) => void,
) {
  const nome = window.prompt('Nome do contato')
  if (!nome?.trim()) return
  const telefone = window.prompt('Telefone do contato')
  if (!telefone?.trim()) return
  adicionar(colunaId, {
    nome: nome.trim(),
    telefone: telefone.trim(),
    ddi: '+55',
    iaAtiva: true,
  })
}
