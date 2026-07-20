/**
 * Suíte IA / filas / pausas (~16 casos) — coberturas extras até ~100.
 */
import { api, assert, run, TEL_A } from './helpers.mjs'

export async function suiteIa() {
  await run('ia:01 delay GET', async () => {
    const { res, data } = await api('/api/ia/delay')
    assert(res.ok && data.ok !== false, `delay ${res.status}`)
  })

  await run('ia:02 followup GET', async () => {
    const { res, data } = await api('/api/ia/followup')
    assert(res.ok && data.ok !== false, `fu ${res.status}`)
  })

  await run('ia:03 prompt GET', async () => {
    const { res, data } = await api('/api/ia/prompt')
    assert(res.ok && data.ok !== false, `prompt ${res.status}`)
    const txt = data.prompt || data.valor || ''
    assert(typeof txt === 'string', 'prompt str')
  })

  await run('ia:04 pausa-global GET', async () => {
    const { res } = await api('/api/ia/pausa-global')
    assert(res.ok, `pg ${res.status}`)
  })

  await run('ia:05 pausas-ativas', async () => {
    const { res, data } = await api('/api/ia/pausas-ativas')
    assert(res.ok, `pa ${res.status}`)
    assert(Array.isArray(data.pausas || data) || data.ok !== false, 'lista')
  })

  await run('ia:06 pausa-contato GET tel A', async () => {
    const { res } = await api(`/api/ia/pausa-contato/${TEL_A}`)
    assert(res.ok || res.status === 404, `pc ${res.status}`)
  })

  await run('ia:07 conversas-iniciadas', async () => {
    const { res } = await api('/api/ia/conversas-iniciadas')
    assert(res.ok || res.status < 500, `ci ${res.status}`)
  })

  await run('ia:08 sincronizar-pausas GET', async () => {
    const { res } = await api('/api/ia/sincronizar-pausas')
    assert(res.ok || res.status < 500, `sp ${res.status}`)
  })

  await run('ia:09 logs', async () => {
    const { res } = await api('/api/ia/logs')
    assert(res.ok || res.status < 500, `logs ${res.status}`)
  })

  await run('ia:10 notificacao logs', async () => {
    const { res } = await api('/api/ia/notificacao/logs')
    assert(res.ok || res.status < 500, `nl ${res.status}`)
  })

  await run('ia:11 fila-atendimento GET', async () => {
    const { res, data } = await api('/api/ia/fila-atendimento')
    assert(res.ok && data.ok !== false, `fila ${res.status}`)
  })

  await run('ia:12 filas list', async () => {
    const { res, data } = await api('/api/ia/fila-atendimento/filas')
    assert(res.ok && data.ok !== false, `filas ${res.status}`)
    assert(Array.isArray(data.filas), 'filas[]')
    assert(data.filas.length >= 5, `poucas filas: ${data.filas.length}`)
  })

  await run('ia:13 filas tem membros', async () => {
    const { data } = await api('/api/ia/fila-atendimento/filas')
    const com = (data.filas || []).filter((f) => (f.membros || []).length > 0)
    assert(com.length >= 5, `filas vazias: com membros=${com.length}`)
  })

  await run('ia:14 usuarios lista', async () => {
    const { res, data } = await api('/api/ia/usuarios')
    assert(res.ok && data.ok !== false, `usu ${res.status}`)
    assert(Array.isArray(data.usuarios) && data.usuarios.length > 0, 'sem users')
  })

  await run('ia:15 usuarios departamentos', async () => {
    const { res, data } = await api('/api/ia/usuarios/departamentos')
    assert(res.ok && data.ok, `dept ${res.status}`)
    assert((data.departamentos || []).length >= 5, 'deptos')
  })

  await run('ia:16 treinador blocos', async () => {
    const { res } = await api('/api/treinador/blocos')
    assert(res.ok || res.status < 500, `blocos ${res.status}`)
  })
}
