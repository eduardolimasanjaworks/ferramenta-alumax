/**
 * Aba Arquivos — lista e “upload” local (só metadados no browser).
 */
import type { Contato } from '@/shared/types/crm'
import { useCrm } from '../store/crmStore'

type Props = { contato: Contato }

export function AbaArquivos({ contato }: Props) {
  const { atualizarContato } = useCrm()

  function onFile(files: FileList | null) {
    if (!files?.length) return
    const novos = Array.from(files).map((f) => ({
      id: `arq-${crypto.randomUUID().slice(0, 8)}`,
      nome: f.name,
      criadoEm: new Date().toISOString(),
    }))
    atualizarContato(contato.id, {
      arquivos: [...novos, ...contato.arquivos],
    })
  }

  function remover(id: string) {
    atualizarContato(contato.id, {
      arquivos: contato.arquivos.filter((a) => a.id !== id),
    })
  }

  return (
    <div className="aba-form">
      <label className="upload-btn btn btn-outline">
        Enviar Arquivo(s)
        <input
          type="file"
          multiple
          hidden
          onChange={(e) => {
            onFile(e.target.files)
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
              <span>{a.nome}</span>
              <button type="button" className="btn btn-ghost sm" onClick={() => remover(a.id)}>
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
