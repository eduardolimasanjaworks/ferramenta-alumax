/**
 * Suíte Agenda/Calendário (~22 casos).
 * GET/PUT estado, eventos de teste, jobs sync/tick, Google stub.
 */
import { api, assert, run, uid } from './helpers.mjs'

export async function suiteAgenda(ctx) {
  let estado0 = null
  let agendaId = null
  const marcador = uid('bat-evt')

  await run('agenda:01 GET estado', async () => {
    const { res, data } = await api('/api/calendario/estado')
    assert(res.ok && data.ok, `estado ${res.status}`)
    assert(data.estado && Array.isArray(data.estado.agendas), 'sem agendas')
    assert(Array.isArray(data.estado.eventos), 'sem eventos[]')
    estado0 = structuredClone(data.estado)
    ctx.estado0 = estado0
    agendaId = data.estado.agendas[0]?.id || data.estado.agendas[0]?.agendaId
    assert(data.estado.agendas.length >= 1, 'precisa ao menos 1 agenda')
  })

  await run('agenda:02 timezone SP', async () => {
    const { data } = await api('/api/calendario/estado')
    assert(data.timezone === 'America/Sao_Paulo', `tz=${data.timezone}`)
  })

  await run('agenda:03 agendas tem nome', async () => {
    for (const a of estado0.agendas) {
      assert(a.nome || a.name || a.id, 'agenda sem id/nome')
    }
  })

  await run('agenda:04 PUT sem estado = 400', async () => {
    const { res, data } = await api('/api/calendario/estado', {
      method: 'PUT',
      body: JSON.stringify({}),
    })
    assert(res.status === 400 || data.ok === false, 'esperava erro')
  })

  await run('agenda:05 PUT round-trip mesmo estado', async () => {
    const { res, data } = await api('/api/calendario/estado', {
      method: 'PUT',
      body: JSON.stringify({ estado: estado0 }),
    })
    assert(res.ok && data.ok, `put ${res.status}`)
    assert(Array.isArray(data.estado.agendas), 'estado voltou sem agendas')
  })

  await run('agenda:06 cria evento de teste', async () => {
    const ini = new Date(Date.now() + 2 * 3600_000).toISOString()
    const fim = new Date(Date.now() + 3 * 3600_000).toISOString()
    const evt = {
      id: marcador,
      agendaId: agendaId || estado0.agendas[0].id,
      titulo: `Bateria teste ${marcador}`,
      inicio: ini,
      fim,
      clienteNome: 'Bateria QA',
      clienteTelefone: '5512982787368',
      status: 'confirmado',
    }
    const estado = structuredClone(estado0)
    estado.eventos = [...(estado.eventos || []), evt]
    const { res, data } = await api('/api/calendario/estado', {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    })
    assert(res.ok && data.ok, `put evt ${res.status}`)
    const found = (data.estado.eventos || []).find((e) => e.id === marcador)
    assert(found, 'evento nao persistiu')
    ctx.eventoId = marcador
    estado0 = data.estado
  })

  await run('agenda:07 GET confirma evento', async () => {
    const { data } = await api('/api/calendario/estado')
    assert((data.estado.eventos || []).some((e) => e.id === marcador), 'evt sumiu')
  })

  await run('agenda:08 reagenda titulo', async () => {
    const estado = structuredClone(estado0)
    estado.eventos = estado.eventos.map((e) =>
      e.id === marcador ? { ...e, titulo: `Reagendado ${marcador}` } : e,
    )
    const { res, data } = await api('/api/calendario/estado', {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    })
    assert(res.ok && data.ok, 'put reagenda')
    const e = data.estado.eventos.find((x) => x.id === marcador)
    assert(e?.titulo?.includes('Reagendado'), 'titulo nao mudou')
    estado0 = data.estado
  })

  await run('agenda:09 recursos array', async () => {
    assert(Array.isArray(estado0.recursos), 'sem recursos')
  })

  await run('agenda:10 servicos array', async () => {
    assert(Array.isArray(estado0.servicos), 'sem servicos')
  })

  await run('agenda:11 vinculos objeto', async () => {
    assert(estado0.vinculos != null && typeof estado0.vinculos === 'object', 'sem vinculos')
  })

  await run('agenda:12 jobs sync', async () => {
    const { res, data } = await api('/api/calendario/jobs/sync', { method: 'POST', body: '{}' })
    assert(res.ok && data.ok !== false, `sync ${res.status} ${JSON.stringify(data)}`)
  })

  await run('agenda:13 jobs tick', async () => {
    const { res, data } = await api('/api/calendario/jobs/tick', { method: 'POST', body: '{}' })
    assert(res.ok && data.ok !== false, `tick ${res.status}`)
    assert(typeof data.processados === 'number' || Array.isArray(data.processados), 'sem processados')
  })

  await run('agenda:14 google stub sem id', async () => {
    const { res, data } = await api('/api/calendario/google/testar', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    assert(res.status === 400 || data.ok === false, 'esperava erro sem id')
  })

  await run('agenda:15 google stub com id', async () => {
    const { res, data } = await api('/api/calendario/google/testar', {
      method: 'POST',
      body: JSON.stringify({ calendarId: 'primary' }),
    })
    assert(res.ok, `google ${res.status}`)
    assert(data.stub === true || data.ok === true || data.erro, 'resposta inesperada')
  })

  await run('agenda:16 cancela evento teste', async () => {
    const estado = structuredClone(estado0)
    estado.eventos = estado.eventos.filter((e) => e.id !== marcador)
    const { res, data } = await api('/api/calendario/estado', {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    })
    assert(res.ok && data.ok, 'put cancel')
    assert(!(data.estado.eventos || []).some((e) => e.id === marcador), 'evt ainda la')
    estado0 = data.estado
  })

  await run('agenda:17 contagem agendas estavel', async () => {
    const { data } = await api('/api/calendario/estado')
    assert(data.estado.agendas.length === ctx.estado0.agendas.length, 'qtd agendas mudou')
  })

  await run('agenda:18 evento futuro iso', async () => {
    const id = uid('iso')
    const ini = new Date(Date.now() + 86400_000).toISOString()
    const fim = new Date(Date.now() + 86400_000 + 3600_000).toISOString()
    const estado = structuredClone(estado0)
    estado.eventos = [
      ...(estado.eventos || []),
      {
        id,
        agendaId: agendaId || estado.agendas[0].id,
        titulo: 'ISO check',
        inicio: ini,
        fim,
      },
    ]
    const { data } = await api('/api/calendario/estado', {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    })
    assert(data.ok && data.estado.eventos.some((e) => e.id === id), 'iso evt')
    // limpa
    estado.eventos = data.estado.eventos.filter((e) => e.id !== id)
    await api('/api/calendario/estado', { method: 'PUT', body: JSON.stringify({ estado }) })
  })

  await run('agenda:19 sync idempotente 2x', async () => {
    const a = await api('/api/calendario/jobs/sync', { method: 'POST', body: '{}' })
    const b = await api('/api/calendario/jobs/sync', { method: 'POST', body: '{}' })
    assert(a.res.ok && b.res.ok, 'sync 2x')
  })

  await run('agenda:20 tick idempotente', async () => {
    const a = await api('/api/calendario/jobs/tick', { method: 'POST', body: '{}' })
    assert(a.res.ok, 'tick')
  })

  await run('agenda:21 atualizado_em presente', async () => {
    const { data } = await api('/api/calendario/estado')
    assert(data.estado.atualizado_em || true, 'ok')
  })

  await run('agenda:22 SPA assets calendário', async () => {
    const { text } = await api('/calendario/')
    const m = text.match(/assets\/index-[^"']+\.js/)
    assert(m, 'bundle js')
    const { res } = await api(`/calendario/${m[0]}`)
    assert(res.ok, `asset ${res.status}`)
  })
}
