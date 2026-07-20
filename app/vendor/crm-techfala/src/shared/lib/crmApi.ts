/**
 * Cliente HTTP do CRM → `/api/crm/*` (mesmo origin do painel, cookie de sessão).
 * Sempre `cache: 'no-store'` para evitar resposta stale.
 */

export class CrmApiError extends Error {
  status: number
  codigo?: string
  contatoExistenteId?: string
  constructor(
    status: number,
    message: string,
    extra?: { codigo?: string; contatoExistenteId?: string },
  ) {
    super(message)
    this.status = status
    this.codigo = extra?.codigo
    this.contatoExistenteId = extra?.contatoExistenteId
  }
}

export async function crmFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers)
  const body = init?.body
  const isJsonBody =
    typeof body === 'string' ||
    (body != null &&
      !(body instanceof Blob) &&
      !(body instanceof ArrayBuffer) &&
      !(ArrayBuffer.isView(body)))
  if (body && isJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Cache-Control', 'no-cache')
  headers.set('Pragma', 'no-cache')
  const res = await fetch(`/api/crm${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers,
  })
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    erro?: string
    codigo?: string
    contatoExistenteId?: string
  } & T
  if (!res.ok || data.ok === false) {
    throw new CrmApiError(res.status, data.erro || `HTTP ${res.status}`, {
      codigo: data.codigo,
      contatoExistenteId: data.contatoExistenteId,
    })
  }
  return data
}

/** Upload binário de arquivo de contato. */
export async function crmUploadArquivo<T>(
  contatoId: string,
  file: File,
): Promise<T> {
  return crmFetch<T>(
    `/contatos/${encodeURIComponent(contatoId)}/arquivos`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Filename': encodeURIComponent(file.name),
        'X-Mime': file.type || 'application/octet-stream',
      },
      body: file,
    },
  )
}
