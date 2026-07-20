/**
 * Carrega o board do CRM em poucas queries (evita N+1 do montarContato).
 * Payload lean: só o que o Kanban/filtro precisa; painel hidrata no GET contact.
 */
import type pg from 'pg';
import type { CrmColuna, CrmContato } from './crm-store.js';

type UrlArquivoFn = (contatoId: string, arquivoId: string) => string;

function rotuloOrigem(raw: unknown): string {
  const o = String(raw ?? '');
  return /^chatwoot$/i.test(o.trim())
    ? 'Atendimento'
    : o.replace(/Chatwoot/gi, 'Atendimento');
}

function pushMap(map: Map<string, string[]>, key: string, item: string): void {
  const list = map.get(key);
  if (list) list.push(item);
  else map.set(key, [item]);
}

/** Contato mínimo do board — FE completa com contatoVazio/normalizar. */
export type CrmContatoBoard = Pick<
  CrmContato,
  | 'id'
  | 'nome'
  | 'email'
  | 'telefone'
  | 'ddi'
  | 'tags'
  | 'colunaId'
  | 'criadoEm'
  | 'responsavel'
  | 'responsavelUsuarioId'
  | 'automacaoAtiva'
  | 'valorOportunidade'
  | 'origem'
  | 'chatwootContactId'
>;

export async function carregarBoardBatched(
  pool: pg.Pool,
  _urlArquivo: UrlArquivoFn,
  pipelineId?: string | null,
): Promise<{ colunas: CrmColuna[]; contatos: CrmContatoBoard[] }> {
  const colunasSql = pipelineId
    ? `SELECT id, titulo, cor, ordem, pipeline_id AS "pipelineId"
       FROM crm_colunas WHERE pipeline_id = $1 ORDER BY ordem ASC, titulo ASC`
    : `SELECT id, titulo, cor, ordem, pipeline_id AS "pipelineId"
       FROM crm_colunas ORDER BY ordem ASC, titulo ASC`;
  const contatosSql = pipelineId
    ? `SELECT c.id, c.nome, c.email, c.telefone, c.ddi, c.origem, c.valor_oportunidade,
              c.responsavel_multichat, c.responsavel_usuario_id, c.automacao_ativa,
              c.coluna_id, c.criado_em, c.chatwoot_contact_id
       FROM crm_contatos c
       JOIN crm_colunas col ON col.id = c.coluna_id
       WHERE col.pipeline_id = $1
       ORDER BY c.criado_em ASC`
    : `SELECT id, nome, email, telefone, ddi, origem, valor_oportunidade,
              responsavel_multichat, responsavel_usuario_id, automacao_ativa,
              coluna_id, criado_em, chatwoot_contact_id
       FROM crm_contatos ORDER BY criado_em ASC`;

  const args = pipelineId ? [pipelineId] : [];
  const [colunas, base, tags] = await Promise.all([
    pool.query(colunasSql, args),
    pool.query(contatosSql, args),
    pool.query<{ contato_id: string; tag: string }>(
      pipelineId
        ? `SELECT t.contato_id, t.tag FROM crm_contato_tags t
           JOIN crm_contatos c ON c.id = t.contato_id
           JOIN crm_colunas col ON col.id = c.coluna_id
           WHERE col.pipeline_id = $1 ORDER BY t.tag`
        : `SELECT contato_id, tag FROM crm_contato_tags ORDER BY tag`,
      args,
    ),
  ]);

  const tagsBy = new Map<string, string[]>();
  for (const t of tags.rows) pushMap(tagsBy, t.contato_id, t.tag);

  const contatos: CrmContatoBoard[] = base.rows.map((row) => {
    const id = String(row.id);
    const out: CrmContatoBoard = {
      id,
      nome: String(row.nome ?? '').replace(/Chatwoot/gi, 'Atendimento'),
      email: String(row.email ?? ''),
      telefone: String(row.telefone ?? ''),
      ddi: String(row.ddi ?? '+55'),
      tags: tagsBy.get(id) ?? [],
      colunaId: String(row.coluna_id),
      criadoEm: new Date(row.criado_em as string).toISOString(),
      responsavel: String(row.responsavel_multichat ?? ''),
      responsavelUsuarioId:
        row.responsavel_usuario_id != null ? Number(row.responsavel_usuario_id) : null,
      automacaoAtiva: Boolean(row.automacao_ativa ?? true),
      valorOportunidade: String(row.valor_oportunidade ?? ''),
      origem: rotuloOrigem(row.origem),
      chatwootContactId: row.chatwoot_contact_id
        ? String(row.chatwoot_contact_id)
        : null,
    };
    return out;
  });

  const cols: CrmColuna[] = colunas.rows.map((r) => ({
    id: String(r.id),
    titulo: String(r.titulo),
    cor: String(r.cor),
    ordem: Number(r.ordem),
    pipelineId: r.pipelineId ? String(r.pipelineId) : undefined,
  }));

  return { colunas: cols, contatos };
}
