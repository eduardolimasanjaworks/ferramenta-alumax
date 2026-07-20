/**
 * Mensagens amigáveis das rotas WhatsApp (painel).
 * Esconde nomes de bridge/API (UazAPI, tokens) do usuário final.
 */

export function erroWaPublico(err: unknown): string {
  const raw = String(err ?? '');
  if (/401|invalid token|token/i.test(raw)) {
    return 'Não foi possível validar a conexão deste número. Tente outra instância ou Atualizar QR.';
  }
  if (/404|not found/i.test(raw)) {
    return 'Instância WhatsApp não encontrada. Confira se este número está ativo.';
  }
  if (/uaz|evolution|bridge|apikey|webhook/i.test(raw)) {
    return 'Falha ao falar com o WhatsApp. Tente Atualizar status ou QR em instantes.';
  }
  if (raw.length > 120) return 'Falha ao carregar o WhatsApp. Tente novamente.';
  return raw.replace(/^Error:\s*/i, '') || 'Falha ao carregar o WhatsApp.';
}
