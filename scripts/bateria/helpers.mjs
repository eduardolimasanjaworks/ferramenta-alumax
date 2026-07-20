/**
 * Helpers compartilhados da bateria de testes Tilit.
 * Login por cookie mp_session + assert/run/api.
 */
export const BASE = (process.env.TEST_BASE_URL || 'http://127.0.0.1:8096').replace(/\/$/, '')
export const EMAIL = process.env.TEST_EMAIL || 'admin@tilitgroup.com'
export const SENHA = process.env.TEST_SENHA || ''
export const EV_URL = (process.env.EVOLUTION_URL || '').replace(/\/$/, '')
export const EV_KEY = process.env.EVOLUTION_API_KEY || ''
export const EV_INST =
  process.env.EVOLUTION_TEST_INSTANCE || 'tilit-comercial-chatwoot'

export const TEL_A = (process.env.TEST_TEL_A || '5512982787368').replace(/\D/g, '')
export const TEL_B = (process.env.TEST_TEL_B || '551236002518').replace(/\D/g, '')

export const results = []
let cookie = ''

export function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

export async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}) }
  if (opts.body && !(opts.body instanceof Uint8Array) && !(opts.json === false)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }
  if (cookie) headers.Cookie = cookie
  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  const sc = res.headers.get('set-cookie')
  if (sc) {
    cookie = sc
      .split(',')
      .map((x) => x.split(';')[0].trim())
      .filter(Boolean)
      .join('; ')
  }
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { _raw: text }
  }
  return { res, data, text, status: res.status }
}

export async function run(name, fn) {
  const t0 = Date.now()
  try {
    await fn()
    results.push({ name, ok: true, ms: Date.now() - t0 })
    console.log(`PASS  ${name} (${Date.now() - t0}ms)`)
  } catch (e) {
    results.push({ name, ok: false, ms: Date.now() - t0, erro: String(e.message || e) })
    console.error(`FAIL  ${name}: ${e.message}`)
  }
}

export async function login() {
  assert(SENHA, 'Defina TEST_SENHA')
  const { res, data } = await api('/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, senha: SENHA }),
  })
  assert(res.ok && data?.ok !== false, `login: ${res.status} ${JSON.stringify(data)}`)
  assert(cookie.includes('mp_session'), 'sem cookie mp_session')
}

export async function evo(path, opts = {}) {
  assert(EV_URL && EV_KEY, 'EVOLUTION_URL/KEY ausentes')
  const res = await fetch(`${EV_URL}${path}`, {
    ...opts,
    headers: {
      apikey: EV_KEY,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { _raw: text }
  }
  return { res, data, text, status: res.status }
}

export function uid(prefix = 'bat') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 999)}`
}

export function summary() {
  const ok = results.filter((r) => r.ok).length
  const fail = results.filter((r) => !r.ok)
  console.log(`\n=== RESUMO ${ok}/${results.length} PASS ===`)
  if (fail.length) {
    console.log('FALHAS:')
    for (const f of fail) console.log(`  - ${f.name}: ${f.erro}`)
  }
  const porArea = {}
  for (const r of results) {
    const area = r.name.split(':')[0] || 'outros'
    porArea[area] = porArea[area] || { ok: 0, fail: 0 }
    porArea[area][r.ok ? 'ok' : 'fail']++
  }
  console.log('\nPor área:')
  for (const [a, c] of Object.entries(porArea)) {
    console.log(`  ${a}: ${c.ok} ok / ${c.fail} fail`)
  }
  return { total: results.length, ok, fail: fail.length, failhas: fail, porArea }
}
