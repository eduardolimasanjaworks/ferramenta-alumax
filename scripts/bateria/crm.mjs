/**
 * Suíte CRM (~28 casos): board, colunas, contatos, tags, campos, sync.
 */
import { api, assert, run, uid, TEL_A } from './helpers.mjs'

export async function suiteCrm(ctx) {
  let colunaId = ''
  let colunaNova = ''
  let contatoId = ''
  let tagId = ''
  let campoId = ''
  const tel = `1299${String(Date.now()).slice(-7)}`

  await run('crm:01 board GET', async () => {
    const { res, data } = await api('/api/crm/board')
    assert(res.ok && data.ok, `board ${res.status}`)
    assert(data.colunas?.length > 0, 'sem colunas')
    colunaId = data.colunas[0].id
    ctx.colunaId = colunaId
  })

  await run('crm:02 usuarios GET', async () => {
    const { res, data } = await api('/api/crm/usuarios')
    assert(res.ok && data.ok && Array.isArray(data.usuarios), 'usuarios')
  })

  await run('crm:03 colunas GET', async () => {
    const { res, data } = await api('/api/crm/colunas')
    assert(res.ok && (data.ok !== false) && (data.colunas || data)?.length !== 0, 'colunas')
  })

  await run('crm:04 criar coluna', async () => {
    const nome = uid('col')
    const { res, data } = await api('/api/crm/colunas', {
      method: 'POST',
      body: JSON.stringify({ nome, name: nome }),
    })
    assert(res.ok && data.ok !== false, `col post ${res.status} ${JSON.stringify(data)}`)
    colunaNova = data.coluna?.id || data.id
    assert(colunaNova, 'sem id coluna')
  })

  await run('crm:05 patch coluna', async () => {
    if (!colunaNova) return
    const { res, data } = await api(`/api/crm/colunas/${colunaNova}`, {
      method: 'PATCH',
      body: JSON.stringify({ nome: `patched-${colunaNova}` }),
    })
    assert(res.ok && data.ok !== false, `patch col ${res.status}`)
  })

  await run('crm:06 contato sem telefone', async () => {
    const { res, data } = await api('/api/crm/contatos', {
      method: 'POST',
      body: JSON.stringify({ colunaId, nome: 'Sem Tel' }),
    })
    assert(res.status === 400 || data.codigo === 'telefone_obrigatorio', 'tel obrigatorio')
  })

  await run('crm:07 contato POST', async () => {
    const { res, data } = await api('/api/crm/contatos', {
      method: 'POST',
      body: JSON.stringify({
        colunaId,
        nome: `Bateria ${uid('c')}`,
        telefone: tel,
        iaAtiva: false,
      }),
    })
    assert(res.ok && data.ok !== false, `contato ${res.status} ${JSON.stringify(data)}`)
    contatoId = data.contato?.id || data.id
    assert(contatoId, 'sem contatoId')
    ctx.contatoId = contatoId
  })

  await run('crm:08 contato GET', async () => {
    const { res, data } = await api(`/api/crm/contatos/${contatoId}`)
    assert(res.ok && data.ok !== false, `get ${res.status}`)
  })

  await run('crm:09 contato PATCH nome', async () => {
    const { res, data } = await api(`/api/crm/contatos/${contatoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ nome: 'Bateria Renomeado' }),
    })
    assert(res.ok && data.ok !== false, `patch ${res.status}`)
  })

  await run('crm:10 telefone duplicado', async () => {
    const { res, data } = await api('/api/crm/contatos', {
      method: 'POST',
      body: JSON.stringify({ colunaId, nome: 'Dup', telefone: tel }),
    })
    assert(res.status === 400 || data.codigo === 'telefone_duplicado' || data.ok === false, 'dup')
  })

  await run('crm:11 mover contato', async () => {
    const dest = colunaNova || colunaId
    const { res, data } = await api(`/api/crm/contatos/${contatoId}/mover`, {
      method: 'POST',
      body: JSON.stringify({ colunaId: dest }),
    })
    assert(res.ok && data.ok !== false, `mover ${res.status} ${JSON.stringify(data)}`)
  })

  await run('crm:12 tags GET', async () => {
    const { res, data } = await api('/api/crm/tags')
    assert(res.ok, `tags ${res.status}`)
  })

  await run('crm:13 tag POST', async () => {
    const nome = uid('tag')
    const { res, data } = await api('/api/crm/tags', {
      method: 'POST',
      body: JSON.stringify({ nome, name: nome, cor: '#336699' }),
    })
    assert(res.ok && data.ok !== false, `tag ${res.status} ${JSON.stringify(data)}`)
    tagId = data.tag?.id || data.id
    ctx.tagId = tagId
  })

  await run('crm:14 tag PATCH', async () => {
    if (!tagId) return
    const { res } = await api(`/api/crm/tags/${tagId}`, {
      method: 'PATCH',
      body: JSON.stringify({ nome: `tag-x-${tagId}` }),
    })
    assert(res.ok, `tag patch ${res.status}`)
  })

  await run('crm:15 campos GET', async () => {
    const { res } = await api('/api/crm/campos')
    assert(res.ok, `campos ${res.status}`)
  })

  await run('crm:16 campo POST', async () => {
    const nome = uid('campo')
    const { res, data } = await api('/api/crm/campos', {
      method: 'POST',
      body: JSON.stringify({ nome, name: nome, tipo: 'texto' }),
    })
    assert(res.ok && data.ok !== false, `campo ${res.status} ${JSON.stringify(data)}`)
    campoId = data.campo?.id || data.id
  })

  await run('crm:17 campo PATCH', async () => {
    if (!campoId) return
    const { res } = await api(`/api/crm/campos/${campoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ nome: `cx-${campoId}` }),
    })
    assert(res.ok, `campo patch ${res.status}`)
  })

  await run('crm:18 cadastros GET', async () => {
    const { res, data } = await api('/api/crm/cadastros')
    assert(res.ok && data.ok !== false, `cad ${res.status}`)
  })

  await run('crm:19 upload arquivo', async () => {
    const body = new TextEncoder().encode('arquivo-bateria-qa\n')
    const { res, data } = await api(`/api/crm/contatos/${contatoId}/arquivos`, {
      method: 'POST',
      headers: { 'X-Filename': 'bateria.txt', 'X-Mime': 'text/plain', 'Content-Type': 'application/octet-stream' },
      body,
      json: false,
    })
    assert(res.ok && data.ok !== false, `upload ${res.status} ${JSON.stringify(data)}`)
    ctx.arquivoId = data.arquivo?.id || data.id
  })

  await run('crm:20 download arquivo', async () => {
    if (!ctx.arquivoId) return
    const { res } = await api(
      `/api/crm/contatos/${contatoId}/arquivos/${ctx.arquivoId}/download`,
    )
    assert(res.ok, `dl ${res.status}`)
  })

  await run('crm:21 delete arquivo', async () => {
    if (!ctx.arquivoId) return
    const { res } = await api(
      `/api/crm/contatos/${contatoId}/arquivos/${ctx.arquivoId}`,
      { method: 'DELETE' },
    )
    assert(res.ok, `del arq ${res.status}`)
  })

  await run('crm:22 sync atendimento GET', async () => {
    const { res } = await api('/api/crm/sync/atendimento')
    assert(res.ok || res.status === 200, `sync get ${res.status}`)
  })

  await run('crm:23 sync atendimento POST dry', async () => {
    const { res, data } = await api('/api/crm/sync/atendimento', {
      method: 'POST',
      body: JSON.stringify({ dryRun: true, limit: 5 }),
    })
    assert(res.ok || data.ok !== false || res.status < 500, `sync ${res.status}`)
  })

  await run('crm:24 board ainda ok', async () => {
    const { res, data } = await api('/api/crm/board')
    assert(res.ok && data.ok, 'board final')
  })

  await run('crm:25 contato com tel real A', async () => {
    const t = TEL_A
    const { res, data } = await api('/api/crm/contatos', {
      method: 'POST',
      body: JSON.stringify({
        colunaId,
        nome: 'QA Tel A',
        telefone: t,
        iaAtiva: false,
        tags: tagId ? [tagId] : undefined,
      }),
    })
    // pode já existir — aceita ok ou duplicado
    assert(res.ok || data.codigo === 'telefone_duplicado' || data.ok === false, `telA ${res.status}`)
    if (data.contato?.id) ctx.contatoTelA = data.contato.id
  })

  await run('crm:26 reordenar colunas', async () => {
    const { data: board } = await api('/api/crm/board')
    const ids = (board.colunas || []).map((c) => c.id)
    if (ids.length < 2) return
    const { res } = await api('/api/crm/colunas/reordenar', {
      method: 'POST',
      body: JSON.stringify({ ids, ordem: ids }),
    })
    assert(res.ok || res.status < 500, `reord ${res.status}`)
  })

  await run('crm:27 limpa contato bateria', async () => {
    if (!contatoId) return
    const { res } = await api(`/api/crm/contatos/${contatoId}`, { method: 'DELETE' })
    assert(res.ok || res.status === 404, `del ${res.status}`)
  })

  await run('crm:28 limpa coluna/tag/campo', async () => {
    if (campoId) await api(`/api/crm/campos/${campoId}`, { method: 'DELETE' })
    if (tagId) await api(`/api/crm/tags/${tagId}`, { method: 'DELETE' })
    if (colunaNova) await api(`/api/crm/colunas/${colunaNova}`, { method: 'DELETE' })
  })
}
