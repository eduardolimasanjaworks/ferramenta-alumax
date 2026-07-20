/**
 * Suíte auth + health + SPA (~12 casos).
 */
import { api, assert, run, login, EMAIL, BASE } from './helpers.mjs'

export async function suiteAuth() {
  await run('auth:01 health ok', async () => {
    const { res, data } = await api('/health')
    assert(res.ok && data.status === 'ok', `health ${res.status}`)
    assert(data.servicos?.postgres === true, 'postgres off')
    assert(data.servicos?.redis === true, 'redis off')
  })

  await run('auth:02 health evolution flag', async () => {
    const { data } = await api('/health')
    assert(typeof data.servicos?.evolution === 'boolean', 'sem flag evolution')
  })

  await run('auth:03 login ok', login)

  await run('auth:04 perfil GET', async () => {
    const { res, data } = await api('/api/auth/perfil')
    assert(res.ok && data?.ok !== false, `perfil ${res.status}`)
    const email = data.usuario?.email || data.email
    assert(!!email, 'perfil sem email')
  })

  await run('auth:05 board apos login', async () => {
    const { res, data } = await api('/api/crm/board')
    assert(res.ok && data.ok, 'board apos login')
  })

  await run('auth:06 login senha errada', async () => {
    const res = await fetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, senha: 'senha-errada-xyz' }),
    })
    const data = await res.json().catch(() => ({}))
    assert(!res.ok || data.ok === false, 'deveria rejeitar senha errada')
  })

  await run('auth:07 usuarios abas', async () => {
    const { res, data } = await api('/api/ia/usuarios/abas')
    assert(res.ok && data.ok, `abas ${res.status}`)
    assert(Array.isArray(data.abas) && data.abas.length > 0, 'sem abas')
  })

  await run('auth:08 SPA crm', async () => {
    const { res, text } = await api('/crm/')
    assert(res.ok && (text.includes('root') || /index-.*\.js/.test(text)), 'html crm')
  })

  await run('auth:09 SPA calendario', async () => {
    const { res, text } = await api('/calendario/')
    assert(res.ok && (text.includes('root') || /index-.*\.js/.test(text)), 'html cal')
  })

  await run('auth:10 SPA campanhas', async () => {
    const { res, text } = await api('/campanhas/')
    assert(res.ok && (text.includes('root') || /index-.*\.js/.test(text)), 'html camp')
  })

  await run('auth:11 alterar-senha senha curta', async () => {
    const { res, data } = await api('/api/auth/alterar-senha', {
      method: 'POST',
      body: JSON.stringify({ senhaAtual: 'x', senhaNova: '123' }),
    })
    assert(res.status >= 400 || data.ok === false, 'deveria rejeitar')
  })

  await run('auth:12 build no health', async () => {
    const { data } = await api('/health')
    assert(typeof data.build === 'string' && data.build.length > 0, 'sem build')
  })
}
