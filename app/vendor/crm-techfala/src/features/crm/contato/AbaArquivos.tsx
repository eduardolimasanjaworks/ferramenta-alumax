/**
 * Aba Arquivos — upload real para o servidor + download/exclusão.
 */
import { useState } from 'react'
import type { Contato } from '@/shared/types/crm'
import { useCrm } from '../store/crmStore'

type Props = { contato: Contato }

function formatBytes(n?: number) {
  if (!n || n <= 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function AbaArquivos({ contato }: Props) {
  const { uploadArquivo, removerArquivo } = useCrm()
  const [enviando, setEnviando] = useState(false)

  async function onFile(files: FileList | null) {
    if (!files?.length) return
    setEnviando(true)
    try {
      for (const f of Array.from(files)) {
        if (f.size > 20 * 1024 * 1024) {
          window.alert('O arquivo excede o limite de 20 MB.')
          continue
        }
        await uploadArquivo(contato.id, f)
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="aba-form">
      <label className={`upload-btn btn btn-outline${enviando ? ' is-disabled' : ''}`}>
        {enviando ? 'Enviando…' : 'Enviar Arquivo(s)'}
        <input
          type="file"
          multiple
          hidden
          disabled={enviando}
          onChange={(e) => {
            void onFile(e.target.files)
            e.target.value = ''
          }}
        />
      </label>

      {contato.arquivos.length === 0 ? (
        <div className="empty-block">
          <p>Nenhum arquivo</p>
        </div>
      ) : (
        <ul className="file-list">
          {contato.arquivos.map((a) => (
            <li key={a.id}>
              <div className="file-meta">
                {a.url ? (
                  <a href={a.url} target="_blank" rel="noreferrer">
                    {a.nome}
                  </a>
                ) : (
                  <span>{a.nome}</span>
                )}
                {a.tamanho ? (
                  <small>{formatBytes(a.tamanho)}</small>
                ) : null}
              </div>
              <button
                type="button"
                className="btn btn-ghost sm"
                onClick={() => removerArquivo(contato.id, a.id)}
              >
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
