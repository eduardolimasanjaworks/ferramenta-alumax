/**
 * Aba Notas — formulário + cards com avatar.
 */
import { useState } from 'react'
import type { Contato } from '@/shared/types/crm'
import { useCrm } from '../store/crmStore'
import { AbaCabecalho } from './AbaCabecalho'
import { formatarNotaQuando, iniciais } from './format'

type Props = { contato: Contato }

const AUTOR = { nome: 'Você', email: '' }

export function AbaNotas({ contato }: Props) {
  const { atualizarContato } = useCrm()
  const [aberto, setAberto] = useState(false)
  const [texto, setTexto] = useState('')
  const [editId, setEditId] = useState<string | null>(null)

  function salvar() {
    if (!texto.trim()) return
    const agora = new Date().toISOString()
    if (editId) {
      atualizarContato(contato.id, {
        notas: contato.notas.map((n) =>
          n.id === editId ? { ...n, texto: texto.trim() } : n,
        ),
      })
    } else {
      const nota = {
        id: `nota-${crypto.randomUUID().slice(0, 8)}`,
        texto: texto.trim(),
        autor: AUTOR.nome,
        email: AUTOR.email,
        criadoEm: agora,
      }
      atualizarContato(contato.id, {
        notas: [nota, ...contato.notas],
        timeline: [
          {
            id: `tl-${crypto.randomUUID().slice(0, 8)}`,
            tipo: 'nota',
            titulo: 'Nota Interna',
            detalhe: `Comentário registrado. Conteúdo: ${texto.trim().slice(0, 80)}`,
            em: agora,
          },
          ...contato.timeline,
        ],
      })
    }
    setTexto('')
    setEditId(null)
    setAberto(false)
  }

  function excluir(id: string) {
    if (!window.confirm('Excluir esta nota?')) return
    atualizarContato(contato.id, {
      notas: contato.notas.filter((n) => n.id !== id),
    })
  }

  const n = contato.notas.length
  const contagem = n === 0 ? 'Nenhuma nota' : n === 1 ? '1 nota' : `${n} notas`

  return (
    <div className="aba-tab">
      <AbaCabecalho
        contagem={contagem}
        botaoLabel="Nova nota"
        onNovo={() => {
          setEditId(null)
          setTexto('')
          setAberto(true)
        }}
        desabilitado={aberto}
      />

      <div className="aba-scroll">
        {aberto ? (
          <div className="form-card">
            <textarea
              className="input textarea"
              rows={3}
              placeholder="Escreva sua nota..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setAberto(false)
                  setEditId(null)
                  setTexto('')
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!texto.trim()}
                onClick={salvar}
              >
                Salvar
              </button>
            </div>
          </div>
        ) : null}

        {contato.notas.map((nota) => (
          <div key={nota.id} className="nota-card">
            <span className="avatar">{iniciais(nota.autor || AUTOR.nome)}</span>
            <div className="nota-body">
              <div className="nota-top">
                <div className="min-w-0">
                  <span className="nota-autor">{nota.autor}</span>
                  {nota.email ? (
                    <span className="nota-email">{nota.email}</span>
                  ) : null}
                </div>
                <span className="nota-quando">{formatarNotaQuando(nota.criadoEm)}</span>
              </div>
              <p className="nota-texto">{nota.texto}</p>
            </div>
            <div className="nota-acoes">
              <button
                type="button"
                className="btn btn-ghost btn-icon sm"
                aria-label="Editar"
                onClick={() => {
                  setEditId(nota.id)
                  setTexto(nota.texto)
                  setAberto(true)
                }}
              >
                ✎
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon sm danger-text"
                aria-label="Excluir"
                onClick={() => excluir(nota.id)}
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
