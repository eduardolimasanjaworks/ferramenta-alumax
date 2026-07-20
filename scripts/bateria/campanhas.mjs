/**
 * Suíte Campanhas (~22 casos): meta, CRUD, agendar futuro, pausar.
 * Disparo real só em wa suite controlada.
 */
import { api, assert, run, uid, TEL_A, TEL_B } from './helpers.mjs'

export async function suiteCampanhas(ctx) {
  let campanhaId = ''
  let instancia = ''
  let tagNome = ''
  let tagId = ''
  const telTag = `1198${String(Date.now()).slice(-7)}`

  await run('camp:01 listar', async () => {
    const { res, data } = await api('/api/campanhas')
    assert(res.ok && data.ok !== false, `list ${res.status}`)
    assert(Array.isArray(data.campanhas || data), 'lista')
  })

  await run('camp:02 meta tags', async () => {
    const { res, data } = await api('/api/campanhas/meta/tags')
    assert(res.ok, `tags ${res.status}`)
    assert(Array.isArray(data.tags || data), 'tags arr')
  })

  await run('camp:03 meta instancias', async () => {
    const { res, data } = await api('/api/campanhas/meta/instancias')
    assert(res.ok && data.ok !== false, `inst ${res.status}`)
    const list = data.instancias || data
    assert(Array.isArray(list) && list.length > 0, 'sem instancias')
    const open = list.find((i) => i.connected || i.conectado || i.state === 'open')
    instancia = open?.name || open?.instance || list[0].name || list[0]
    if (typeof instancia === 'object') instancia = instancia.name
    ctx.instancia = instancia
  })

  await run('camp:04 preparar tag+contato', async () => {
    tagNome = uid('camp-tag')
    const board = await api('/api/crm/board')
    const colunaId = board.data.colunas[0].id
    const tag = await api('/api/crm/tags', {
      method: 'POST',
      body: JSON.stringify({ nome: tagNome, name: tagNome }),
    })
    tagId = tag.data.tag?.id || tag.data.id
    assert(tagId, 'tag id')
    const c = await api('/api/crm/contatos', {
      method: 'POST',
      body: JSON.stringify({
        colunaId,
        nome: 'Campanha QA',
        telefone: telTag,
        iaAtiva: false,
      }),
    })
    assert(c.res.ok && c.data.contato?.id, `contato ${JSON.stringify(c.data)}`)
    ctx.campContatoId = c.data.contato.id
    const p = await api(`/api/crm/contatos/${ctx.campContatoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ tags: [tagNome] }),
    })
    assert(
      p.data.contato?.tags?.includes(tagNome),
      `tag nao aplicada: ${JSON.stringify(p.data)}`,
    )
    ctx.campTagId = tagId
  })

  await run('camp:05 estimar tag', async () => {
    const q = encodeURIComponent(tagNome)
    const { res, data } = await api(`/api/campanhas/meta/estimar?tag=${q}`)
    assert(res.ok && data.ok, `estimar ${res.status}`)
    assert((data.total ?? 0) >= 1, `estimado=${data.total}`)
  })

  await run('camp:06 criar campanha', async () => {
    const { res, data } = await api('/api/campanhas', {
      method: 'POST',
      body: JSON.stringify({
        nome: uid('camp'),
        tag: tagNome,
        instancia,
        mensagens: [
          { id: 'm1', tipo: 'texto', texto: `Bateria Tilit ${new Date().toISOString()}` },
        ],
        delayMinSec: 30,
        delayMaxSec: 60,
        usarHorarios: false,
        agendadoEm: new Date(Date.now() + 7 * 86400_000).toISOString(),
        status: 'rascunho',
      }),
    })
    assert(res.ok && data.ok !== false, `create ${res.status} ${JSON.stringify(data)}`)
    campanhaId = data.campanha?.id || data.id
    assert(campanhaId, 'sem id campanha')
    ctx.campanhaId = campanhaId
  })


  await run('camp:07 GET lista contém', async () => {
    const { data } = await api('/api/campanhas')
    const list = data.campanhas || data
    assert(list.some((c) => c.id === campanhaId), 'campanha sumiu')
  })

  await run('camp:08 PUT atualiza mensagem', async () => {
    const { res, data } = await api(`/api/campanhas/${campanhaId}`, {
      method: 'PUT',
      body: JSON.stringify({
        nome: `camp-upd-${campanhaId}`,
        tag: tagNome,
        instancia,
        mensagens: [{ id: 'm1', tipo: 'texto', texto: 'Mensagem atualizada bateria QA' }],
        agendadoEm: new Date(Date.now() + 7 * 86400_000).toISOString(),
      }),
    })
    assert(res.ok && data.ok !== false, `put ${res.status} ${JSON.stringify(data)}`)
  })

  await run('camp:09 agendar futuro', async () => {
    const { res, data } = await api(`/api/campanhas/${campanhaId}/agendar`, {
      method: 'POST',
      body: '{}',
    })
    assert(res.ok && data.ok !== false, `agendar ${res.status} ${JSON.stringify(data)}`)
    assert((data.jobs ?? 0) >= 1, `jobs=${data.jobs}`)
  })

  await run('camp:10 pausar', async () => {
    const { res, data } = await api(`/api/campanhas/${campanhaId}/pausar`, {
      method: 'POST',
      body: '{}',
    })
    assert(res.ok && data.ok !== false, `pausar ${res.status}`)
  })

  await run('camp:11 tick safe', async () => {
    const { res, data } = await api('/api/campanhas/tick', { method: 'POST', body: '{}' })
    assert(res.ok || res.status < 500, `tick ${res.status} ${JSON.stringify(data)}`)
  })

  await run('camp:12 criar campanha vazia rejeitada', async () => {
    const { res, data } = await api('/api/campanhas', {
      method: 'POST',
      body: JSON.stringify({ nome: '' }),
    })
    assert(res.status >= 400 || data.ok === false, 'deveria rejeitar')
  })

  await run('camp:13 instancia invalida', async () => {
    const { res, data } = await api('/api/campanhas', {
      method: 'POST',
      body: JSON.stringify({
        nome: uid('bad'),
        mensagem: 'x',
        tag: tagNome,
        instancia: 'instancia-que-nao-existe-xyz',
      }),
    })
    // algumas versões aceitam e falham no envio — aceita create ou reject
    assert(res.status < 500, `inst ${res.status}`)
    if (data.campanha?.id || data.id) {
      await api(`/api/campanhas/${data.campanha?.id || data.id}`, { method: 'DELETE' })
    }
  })

  await run('camp:14 segunda campanha', async () => {
    const { res, data } = await api('/api/campanhas', {
      method: 'POST',
      body: JSON.stringify({
        nome: uid('camp2'),
        tag: tagNome,
        instancia,
        mensagens: [{ id: 'm1', tipo: 'texto', texto: 'Segunda campanha QA' }],
      }),
    })
    assert(res.ok, `c2 ${res.status}`)
    ctx.campanha2 = data.campanha?.id || data.id
  })

  await run('camp:15 pausar segunda', async () => {
    if (!ctx.campanha2) return
    const { res } = await api(`/api/campanhas/${ctx.campanha2}/pausar`, {
      method: 'POST',
      body: '{}',
    })
    assert(res.ok, `p2 ${res.status}`)
  })

  await run('camp:16 meta instancias tem comercial', async () => {
    const { data } = await api('/api/campanhas/meta/instancias')
    const list = data.instancias || []
    const names = list.map((i) => i.name || i).join(',')
    assert(/comercial|atendimento/i.test(names), `inst: ${names}`)
  })

  await run('camp:17 estimar tag inexistente', async () => {
    const { res, data } = await api('/api/campanhas/meta/estimar?tag=nao-existe-xyz')
    assert(res.ok, `est ${res.status}`)
    const n = data.total ?? data.quantidade ?? data.count ?? 0
    assert(n === 0 || data.ok !== false, 'est zero')
  })

  await run('camp:18 SPA bundle', async () => {
    const { text } = await api('/campanhas/')
    const m = text.match(/assets\/index-[^"']+\.js/)
    assert(m, 'js')
    const { res } = await api(`/campanhas/${m[0]}`)
    assert(res.ok, 'asset')
  })

  await run('camp:19 delete campanha 2', async () => {
    if (!ctx.campanha2) return
    const { res } = await api(`/api/campanhas/${ctx.campanha2}`, { method: 'DELETE' })
    assert(res.ok, `del2 ${res.status}`)
  })

  await run('camp:20 delete campanha 1', async () => {
    const { res } = await api(`/api/campanhas/${campanhaId}`, { method: 'DELETE' })
    assert(res.ok, `del1 ${res.status}`)
  })

  await run('camp:21 limpa contato tag', async () => {
    if (ctx.campContatoId) {
      await api(`/api/crm/contatos/${ctx.campContatoId}`, { method: 'DELETE' })
    }
    if (tagId) await api(`/api/crm/tags/${tagId}`, { method: 'DELETE' })
  })

  await run('camp:22 listar apos limpeza', async () => {
    const { res } = await api('/api/campanhas')
    assert(res.ok, 'list final')
  })
}
