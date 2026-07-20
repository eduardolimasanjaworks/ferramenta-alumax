/**
 * Mensagens públicas do Atendimento — sem nomes de ferramentas externas.
 * Converte motivos técnicos (API/logs) em texto legível no painel.
 */
const MAPA: Array<{ re: RegExp; msg: string }> = [
  {
    re: /token.*ausente|token_indisponivel|platform_token/i,
    msg: 'Atendimento indisponível no momento. Tente de novo ou avise o suporte.',
  },
  {
    re: /senha_fraca|senha fraca/i,
    msg: 'Senha fraca para o Atendimento (use maiúscula, minúscula, número e caractere especial, mín. 8).',
  },
  {
    re: /falha_chatwoot_teams|falha.*teams|agents_list/i,
    msg: 'Não foi possível carregar os departamentos do Atendimento.',
  },
  {
    re: /falha_membros/i,
    msg: 'Não foi possível carregar os departamentos deste usuário.',
  },
  {
    re: /user_criado_mas_vinculo|vinculo_falhou/i,
    msg: 'Usuário criado no Atendimento, mas o vínculo na conta Tilit falhou.',
  },
  {
    re: /nao removeu|não removeu|delete_http/i,
    msg: 'Não foi possível remover o usuário no Atendimento. O painel não foi apagado.',
  },
  {
    re: /criar_user_http|agents_http|Falha ao criar/i,
    msg: 'Falha ao criar o usuário no Atendimento. Verifique e-mail/senha e tente de novo.',
  },
];

export function mensagemPublicaAtendimento(raw: unknown): string {
  const original = String(raw ?? '').trim();
  if (!original) return 'Falha ao sincronizar com o Atendimento.';
  if (/^ok$/i.test(original)) return 'OK';

  for (const { re, msg } of MAPA) {
    if (re.test(original)) return msg;
  }

  // Sucesso técnico interno
  if (/removed=true|user_ok|account_user_ok/i.test(original) && !/fail|nao removeu|não removeu/i.test(original)) {
    return 'OK';
  }

  // Já é mensagem amigável (sem jargão técnico)
  if (
    !/chatwoot|platform|agents?[_:]|http_\d+|account_api|token_|senha_fraca/i.test(original) &&
    original.length <= 160
  ) {
    return original;
  }

  let s = original
    .replace(/chatwoot/gi, 'Atendimento')
    .replace(/evolution(\s*api)?/gi, 'WhatsApp')
    .replace(/qdrant|openrouter|directus|redis|postgres/gi, '')
    .replace(/platform[:_\s]?/gi, '')
    .replace(/account_api[_\w]*/gi, '')
    .replace(/\bagents?\b[:_\s]?/gi, '')
    .replace(/http_\d+/gi, '')
    .replace(/[|_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!s || s.length < 4) return 'Falha ao sincronizar com o Atendimento.';
  if (/chatwoot/i.test(s)) s = s.replace(/chatwoot/gi, 'Atendimento');
  return s.length > 180 ? `${s.slice(0, 177)}…` : s;
}
