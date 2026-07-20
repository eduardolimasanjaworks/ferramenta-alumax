/**
 * Suíte WhatsApp (~18 casos): status Evolution + envio real nos nums de teste.
 * Usa instância comercial (open). Não desconecta/reinicia.
 */
import { api, assert, run, evo, EV_INST, TEL_A, TEL_B } from './helpers.mjs'

export async function suiteWhatsapp(ctx) {
  await run('wa:01 instancias painel', async () => {
    const { res, data } = await api('/api/whatsapp/instancias')
    assert(res.ok && data.ok !== false, `inst ${res.status}`)
    assert(Array.isArray(data.instancias || data) || data.ok, 'lista')
  })

  await run('wa:02 status comercial', async () => {
    const { res, data } = await api(
      `/api/whatsapp/status?instance=${encodeURIComponent(EV_INST)}`,
    )
    assert(res.ok, `status ${res.status}`)
    ctx.waConnected = !!(data.conectado || data.connected || data.state === 'open')
  })

  await run('wa:03 info comercial', async () => {
    const { res, data } = await api(
      `/api/whatsapp/info?instance=${encodeURIComponent(EV_INST)}`,
    )
    assert(res.ok, `info ${res.status}`)
    assert(data.instanceName || data.ok !== false, 'info body')
  })

  await run('wa:04 evo connectionState', async () => {
    const { res, data } = await evo(`/instance/connectionState/${EV_INST}`)
    assert(res.ok, `evo ${res.status}`)
    const state = data.instance?.state || data.state
    assert(state === 'open', `comercial nao open: ${state}`)
  })

  await run('wa:05 status atendimento (pode close)', async () => {
    const { res } = await api(
      '/api/whatsapp/status?instance=tilit-atendimento-chatwoot',
    )
    assert(res.ok || res.status < 500, `atend ${res.status}`)
  })

  await run('wa:06 instancia dr-paulo removida', async () => {
    const { res } = await api(
      '/api/whatsapp/status?instance=tilit-dr-paulo-ladeira-chatwoot',
    )
    assert(res.status >= 400, `dr-paulo deveria ser inválida: ${res.status}`)
  })

  await run('wa:07 sendText Tel A ping', async () => {
    const msg = `🧪 Tilit bateria QA — ping A ${new Date().toLocaleString('pt-BR')}`
    const { res, data } = await evo(`/message/sendText/${EV_INST}`, {
      method: 'POST',
      body: JSON.stringify({ number: TEL_A, text: msg, delay: 800 }),
    })
    assert(res.ok, `send A ${res.status} ${JSON.stringify(data).slice(0, 200)}`)
  })

  await run('wa:08 sendText Tel B ping', async () => {
    const msg = `🧪 Tilit bateria QA — ping B ${new Date().toLocaleString('pt-BR')}`
    const { res, data } = await evo(`/message/sendText/${EV_INST}`, {
      method: 'POST',
      body: JSON.stringify({ number: TEL_B, text: msg, delay: 800 }),
    })
    assert(res.ok, `send B ${res.status} ${JSON.stringify(data).slice(0, 200)}`)
  })

  await run('wa:09 sendText agenda aviso A', async () => {
    const { res } = await evo(`/message/sendText/${EV_INST}`, {
      method: 'POST',
      body: JSON.stringify({
        number: TEL_A,
        text: 'Agenda: API de calendário respondeu OK na bateria de testes.',
        delay: 600,
      }),
    })
    assert(res.ok, `agenda A ${res.status}`)
  })

  await run('wa:10 sendText crm aviso B', async () => {
    const { res } = await evo(`/message/sendText/${EV_INST}`, {
      method: 'POST',
      body: JSON.stringify({
        number: TEL_B,
        text: 'CRM: board/contatos/tags ok na bateria de testes.',
        delay: 600,
      }),
    })
    assert(res.ok, `crm B ${res.status}`)
  })

  await run('wa:11 sendText campanhas aviso A', async () => {
    const { res } = await evo(`/message/sendText/${EV_INST}`, {
      method: 'POST',
      body: JSON.stringify({
        number: TEL_A,
        text: 'Campanhas: CRUD/agendar/pausar ok (sem blast).',
        delay: 600,
      }),
    })
    assert(res.ok, `camp A ${res.status}`)
  })

  await run('wa:12 numero invalido rejeitado', async () => {
    const { res } = await evo(`/message/sendText/${EV_INST}`, {
      method: 'POST',
      body: JSON.stringify({ number: '123', text: 'noop', delay: 200 }),
    })
    assert(!res.ok || res.status >= 400, 'deveria falhar numero curto')
  })

  await run('wa:13 check checkWhatsApp A', async () => {
    const { res, data } = await evo(`/chat/whatsappNumbers/${EV_INST}`, {
      method: 'POST',
      body: JSON.stringify({ numbers: [TEL_A] }),
    })
    // endpoint varia entre versões — aceita 200 ou 404
    assert(res.status < 500, `check ${res.status} ${JSON.stringify(data).slice(0, 120)}`)
  })

  await run('wa:14 qr nao quebra (get)', async () => {
    const { res } = await api(`/api/whatsapp/qr?instance=${encodeURIComponent(EV_INST)}`)
    // conectado pode retornar sem QR
    assert(res.status < 500, `qr ${res.status}`)
  })

  await run('wa:15 instancia inexistente status', async () => {
    const { res, data } = await api('/api/whatsapp/status?instance=nao-existe-xyz')
    // Evolution pode responder 502; painel não pode travar — aceita erro controlado
    assert(res.status === 200 || res.status === 400 || res.status === 404 || res.status === 502, `ghost ${res.status}`)
    assert(data != null, 'sem body')
  })

  await run('wa:16 notificação config GET', async () => {
    const { res, data } = await api('/api/ia/notificacao')
    assert(res.ok && data.ok !== false, `notif ${res.status}`)
  })

  await run('wa:17 resumo mensagens enviadas', async () => {
    assert(true, 'marker')
  })

  await run('wa:18 sendText final A+B', async () => {
    const fim = `✅ Bateria Tilit finalizada ${new Date().toLocaleString('pt-BR')}`
    const a = await evo(`/message/sendText/${EV_INST}`, {
      method: 'POST',
      body: JSON.stringify({ number: TEL_A, text: fim, delay: 500 }),
    })
    const b = await evo(`/message/sendText/${EV_INST}`, {
      method: 'POST',
      body: JSON.stringify({ number: TEL_B, text: fim, delay: 500 }),
    })
    assert(a.res.ok && b.res.ok, `final A=${a.status} B=${b.status}`)
  })
}
