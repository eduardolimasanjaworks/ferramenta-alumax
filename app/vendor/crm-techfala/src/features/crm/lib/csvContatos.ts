/**
 * Serialização / parse de contatos em CSV (UTF-8, vírgula).
 */
import type { Coluna, Contato } from '@/shared/types/crm'

export const CSV_HEADERS = [
  'nome',
  'telefone',
  'ddi',
  'email',
  'coluna',
  'tags',
  'origem',
  'valorOportunidade',
  'anotacoes',
  'automacaoAtiva',
] as const

export type CsvContatoRow = {
  nome: string
  telefone: string
  ddi: string
  email: string
  coluna: string
  tags: string[]
  origem: string
  valorOportunidade: string
  anotacoes: string
  automacaoAtiva: boolean
}

function escaparCampo(valor: string): string {
  const s = String(valor ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function contatosParaCsv(
  contatos: Contato[],
  colunas: Coluna[],
): string {
  const porId = new Map(colunas.map((c) => [c.id, c.titulo]))
  const linhas = [CSV_HEADERS.join(',')]
  for (const c of contatos) {
    const row = [
      escaparCampo(c.nome),
      escaparCampo(c.telefone),
      escaparCampo(c.ddi || '+55'),
      escaparCampo(c.email || ''),
      escaparCampo(porId.get(c.colunaId) || ''),
      escaparCampo((c.tags || []).join(';')),
      escaparCampo(c.origem || ''),
      escaparCampo(c.valorOportunidade || ''),
      escaparCampo(c.anotacoes || ''),
      c.automacaoAtiva === false ? 'false' : 'true',
    ]
    linhas.push(row.join(','))
  }
  return `\uFEFF${linhas.join('\n')}`
}

export function baixarCsv(conteudo: string, nomeArquivo: string) {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  URL.revokeObjectURL(url)
}

/** Parser CSV simples com aspas. */
export function parseCsv(texto: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let i = 0
  let inQuotes = false
  const s = texto.replace(/^\uFEFF/, '')

  while (i < s.length) {
    const ch = s[i]
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += ch
      i++
      continue
    }
    if (ch === '"') {
      inQuotes = true
      i++
      continue
    }
    if (ch === ',') {
      row.push(field)
      field = ''
      i++
      continue
    }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((c) => c.trim() !== '')) rows.push(row)
      row = []
      i++
      continue
    }
    field += ch
    i++
  }
  row.push(field)
  if (row.some((c) => c.trim() !== '')) rows.push(row)
  return rows
}

function normHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
}

const HEADER_ALIASES: Record<string, (typeof CSV_HEADERS)[number]> = {
  nome: 'nome',
  name: 'nome',
  telefone: 'telefone',
  phone: 'telefone',
  celular: 'telefone',
  whatsapp: 'telefone',
  ddi: 'ddi',
  email: 'email',
  e_mail: 'email',
  coluna: 'coluna',
  etapa: 'coluna',
  stage: 'coluna',
  tags: 'tags',
  tag: 'tags',
  origem: 'origem',
  source: 'origem',
  valoroportunidade: 'valorOportunidade',
  valor: 'valorOportunidade',
  anotacoes: 'anotacoes',
  observacoes: 'anotacoes',
  notes: 'anotacoes',
  automacaoativa: 'automacaoAtiva',
  ia: 'automacaoAtiva',
  automacao: 'automacaoAtiva',
}

function parseBool(v: string): boolean {
  const t = v.trim().toLowerCase()
  if (!t) return true
  return !['false', '0', 'nao', 'não', 'off', 'n', 'no'].includes(t)
}

export type ParseCsvResult =
  | { ok: true; rows: CsvContatoRow[] }
  | { ok: false; erro: string }

export function csvParaContatos(texto: string): ParseCsvResult {
  const grid = parseCsv(texto)
  if (grid.length < 2) {
    return { ok: false, erro: 'CSV vazio ou sem linhas de dados.' }
  }
  const headers = grid[0].map(normHeader)
  const idx: Partial<Record<(typeof CSV_HEADERS)[number], number>> = {}
  headers.forEach((h, i) => {
    const key = HEADER_ALIASES[h]
    if (key) idx[key] = i
  })
  if (idx.nome === undefined || idx.telefone === undefined) {
    return {
      ok: false,
      erro: 'O CSV precisa das colunas "nome" e "telefone".',
    }
  }

  const rows: CsvContatoRow[] = []
  for (let r = 1; r < grid.length; r++) {
    const line = grid[r]
    const get = (k: (typeof CSV_HEADERS)[number]) => {
      const i = idx[k]
      return i === undefined ? '' : String(line[i] ?? '').trim()
    }
    const nome = get('nome')
    const telefone = get('telefone')
    if (!nome && !telefone) continue
    if (!nome || !telefone) {
      return {
        ok: false,
        erro: `Linha ${r + 1}: nome e telefone são obrigatórios.`,
      }
    }
    const tagsRaw = get('tags')
    rows.push({
      nome,
      telefone,
      ddi: get('ddi') || '+55',
      email: get('email'),
      coluna: get('coluna'),
      tags: tagsRaw
        ? tagsRaw.split(/[;|,]/).map((t) => t.trim()).filter(Boolean)
        : [],
      origem: get('origem'),
      valorOportunidade: get('valorOportunidade'),
      anotacoes: get('anotacoes'),
      automacaoAtiva: parseBool(get('automacaoAtiva')),
    })
  }
  if (!rows.length) {
    return { ok: false, erro: 'Nenhuma linha válida encontrada no CSV.' }
  }
  return { ok: true, rows }
}

export function modeloCsvExemplo(): string {
  return contatosParaCsv(
    [
      {
        id: 'ex',
        nome: 'Maria Silva',
        telefone: '31999999999',
        ddi: '+55',
        email: 'maria@email.com',
        origem: 'CSV',
        dataNascimento: '',
        valorOportunidade: '',
        anotacoes: '',
        responsavel: '',
        responsavelUsuarioId: null,
        camposPersonalizados: {},
        tags: ['lead'],
        arquivos: [],
        automacaoAtiva: true,
        tarefas: [],
        notas: [],
        interacoes: [],
        timeline: [],
        colunaId: 'col',
        criadoEm: new Date().toISOString(),
      },
    ],
    [{ id: 'col', titulo: 'Novos leads', cor: '#3b82f6', ordem: 0 }],
  )
}
