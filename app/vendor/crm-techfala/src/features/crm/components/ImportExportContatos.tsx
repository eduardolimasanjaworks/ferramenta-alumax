/**
 * Importar / exportar contatos via CSV.
 */
import { useRef, useState } from 'react'
import { CrmApiError, crmFetch } from '@/shared/lib/crmApi'
import type { Contato } from '@/shared/types/crm'
import { UiModal } from './UiModal'
import { useCrm } from '../store/crmStore'
import {
  baixarCsv,
  contatosParaCsv,
  csvParaContatos,
  modeloCsvExemplo,
  type CsvContatoRow,
} from '../lib/csvContatos'

type Props = {
  aberto: boolean
  onClose: () => void
}

async function importarLinhas(
  rows: CsvContatoRow[],
  colunas: { id: string; titulo: string }[],
): Promise<{ ok: number; falhas: number; duplicados: number }> {
  const porTitulo = new Map(
    colunas.map((c) => [c.titulo.trim().toLowerCase(), c.id]),
  )
  const colunaPadrao = colunas[0]?.id
  if (!colunaPadrao) {
    throw new Error('Crie ao menos uma coluna antes de importar.')
  }

  let ok = 0
  let falhas = 0
  let duplicados = 0

  for (const row of rows) {
    const colunaId =
      (row.coluna && porTitulo.get(row.coluna.trim().toLowerCase())) ||
      colunaPadrao
    try {
      const { contato } = await crmFetch<{ contato: Contato }>('/contatos', {
        method: 'POST',
        body: JSON.stringify({
          colunaId,
          nome: row.nome,
          telefone: row.telefone,
          ddi: row.ddi || '+55',
          email: row.email || undefined,
          iaAtiva: row.automacaoAtiva,
        }),
      })
      const patch: Partial<Contato> = {}
      if (row.email) patch.email = row.email
      if (row.origem) patch.origem = row.origem
      if (row.valorOportunidade) patch.valorOportunidade = row.valorOportunidade
      if (row.anotacoes) patch.anotacoes = row.anotacoes
      if (row.tags.length) patch.tags = row.tags
      if (Object.keys(patch).length) {
        await crmFetch(`/contatos/${contato.id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        })
      }
      ok++
    } catch (e) {
      if (e instanceof CrmApiError && e.codigo === 'telefone_duplicado') {
        duplicados++
        continue
      }
      falhas++
    }
  }
  return { ok, falhas, duplicados }
}

export function ImportCsvModal({ aberto, onClose }: Props) {
  const { colunasOrdenadas, recarregarBoard } = useCrm()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<CsvContatoRow[] | null>(null)
  const [erroLocal, setErroLocal] = useState<string | null>(null)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)

  if (!aberto) return null

  function reset() {
    setPreview(null)
    setErroLocal(null)
    setResultado(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function onFile(file: File | null) {
    setResultado(null)
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = csvParaContatos(String(reader.result || ''))
      if (!parsed.ok) {
        setPreview(null)
        setErroLocal(parsed.erro)
        return
      }
      setErroLocal(null)
      setPreview(parsed.rows)
    }
    reader.onerror = () => setErroLocal('Falha ao ler o arquivo.')
    reader.readAsText(file, 'UTF-8')
  }

  async function confirmarImport() {
    if (!preview?.length) return
    setImportando(true)
    setErroLocal(null)
    try {
      const resumo = await importarLinhas(preview, colunasOrdenadas)
      setResultado(
        `Importados: ${resumo.ok}. Falhas: ${resumo.falhas}. Duplicados ignorados: ${resumo.duplicados}.`,
      )
      setPreview(null)
      await recarregarBoard()
    } catch (e) {
      setErroLocal(e instanceof Error ? e.message : 'Erro na importação')
    } finally {
      setImportando(false)
    }
  }

  return (
    <UiModal
      title="Importar contatos (CSV)"
      onClose={() => {
        reset()
        onClose()
      }}
      wide
    >
      <p className="ui-modal-msg">
        Colunas obrigatórias: <code>nome</code>, <code>telefone</code>. Opcionais:{' '}
        <code>ddi</code>, <code>email</code>, <code>coluna</code>, <code>tags</code>{' '}
        (separadas por ;), <code>origem</code>, <code>valorOportunidade</code>,{' '}
        <code>anotacoes</code>, <code>automacaoAtiva</code>.
      </p>
      <div className="csv-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => baixarCsv(modeloCsvExemplo(), 'modelo-contatos.csv')}
        >
          Baixar modelo
        </button>
        <label className="btn btn-primary csv-file-btn">
          Escolher arquivo
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {erroLocal ? (
        <div className="crm-banner crm-banner-erro" role="alert">
          {erroLocal}
        </div>
      ) : null}
      {resultado ? <div className="crm-banner">{resultado}</div> : null}

      {preview ? (
        <>
          <p className="ui-modal-msg">
            {preview.length} contato(s) prontos para importar
            {preview.length > 8 ? ' (mostrando os 8 primeiros)' : ''}.
          </p>
          <div className="csv-preview-wrap">
            <table className="csv-preview">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Coluna</th>
                  <th>E-mail</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 8).map((r, i) => (
                  <tr key={`${r.telefone}-${i}`}>
                    <td>{r.nome}</td>
                    <td>{r.telefone}</td>
                    <td>{r.coluna || '—'}</td>
                    <td>{r.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ui-modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              disabled={importando}
              onClick={reset}
            >
              Limpar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={importando}
              onClick={() => void confirmarImport()}
            >
              {importando ? 'Importando…' : `Importar ${preview.length}`}
            </button>
          </div>
        </>
      ) : null}
    </UiModal>
  )
}

export function useExportarContatosCsv() {
  const { contatosFiltrados, colunas } = useCrm()
  return () => {
    const csv = contatosParaCsv(contatosFiltrados, colunas)
    const stamp = new Date().toISOString().slice(0, 10)
    baixarCsv(csv, `contatos-${stamp}.csv`)
  }
}
