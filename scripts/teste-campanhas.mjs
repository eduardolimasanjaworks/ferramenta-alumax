#!/usr/bin/env node
/**
 * Bateria API: Campanhas funcional ou não?
 * Cobre SPA, meta, CRUD, agendar (futuro), pausar, estimar, validações.
 * NÃO dispara WhatsApp agora — agenda no futuro e pausa.
 *
 * Uso:
 *   TEST_BASE_URL=http://127.0.0.1:8096 \
 *   TEST_EMAIL=admin@tilitgroup.com \
 *   TEST_SENHA='…' \   # senha real do admin no painel
 *   node scripts/teste-campanhas.mjs
 */
const BASE = (process.env.TEST_BASE_URL || 'http://127.0.0.1:8096').replace(/\/$/, '');
const EMAIL = process.env.TEST_EMAIL || 'admin@tilitgroup.com';
const SENHA = process.env.TEST_SENHA || '';
if (!SENHA) {
  console.error('Defina TEST_SENHA (senha do admin do painel).');
  process.exit(1);
}

const results = [];
let cookie = '';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function api(path, opts = {}) {
  const headers = {
    ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    ...(opts.headers || {}),
  };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const sc = res.headers.get('set-cookie');
  if (sc) {
    cookie = sc
      .split(',')
      .map((x) => x.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { _raw: text };
  }
  return { res, data, text };
}

async function run(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`PASS  ${name} (${Date.now() - t0}ms)`);
  } catch (e) {
    results.push({ name, ok: false, ms: Date.now() - t0, erro: e.message });
    console.error(`FAIL  ${name}: ${e.message}`);
  }
}

async function login() {
  const { res, data } = await api('/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, senha: SENHA }),
  });
  assert(res.ok && data?.ok !== false, `login: ${res.status} ${JSON.stringify(data)}`);
  assert(cookie, 'sem cookie de sessão');
}

async function main() {
  console.log(`\n=== Campanhas API @ ${BASE} (${EMAIL}) ===\n`);

  const tagNome = `camp-bat-${Date.now()}`;
  const tel = `1199${String(Date.now()).slice(-7)}`;
  let colunaId = '';
  let contatoId = '';
  let campanhaId = '';
  let instancia = '';

  await run('01 auth login', login);

  await run('02 SPA /campanhas/ index', async () => {
    const { res, text } = await api('/campanhas/');
    assert(res.ok, `status ${res.status}`);
    assert(/index-.*\.(js|css)/.test(text) || text.includes('root'), 'html spa');
    assert(!/Template salvo/i.test(text), 'nao deve citar Template salvo no HTML');
  });

  await run('03 SPA assets sem Template salvo', async () => {
    const { text: html } = await api('/campanhas/');
    const m = html.match(/assets\/index-[^"']+\.js/);
    assert(m, 'bundle js nao encontrado');
    const { res, text } = await api(`/campanhas/${m[0]}`);
    assert(res.ok, `js ${res.status}`);
    assert(!/Template salvo/i.test(text), 'bundle ainda tem Template salvo');
  });

  await run('04 meta tags', async () => {
    const { res, data } = await api('/api/campanhas/meta/tags');
    assert(res.ok && data.ok && Array.isArray(data.tags), JSON.stringify(data));
  });

  await run('05 meta instancias', async () => {
    const { res, data } = await api('/api/campanhas/meta/instancias');
    assert(res.ok && data.ok && data.instancias?.length > 0, JSON.stringify(data));
    instancia = data.instancias[0].name;
    assert(instancia, 'instancia vazia');
  });

  await run('06 listar campanhas', async () => {
    const { res, data } = await api('/api/campanhas');
    assert(res.ok && data.ok && Array.isArray(data.campanhas), JSON.stringify(data));
  });

  await run('07 preparar CRM contato+tag', async () => {
    const board = await api('/api/crm/board');
    assert(board.res.ok && board.data.colunas?.[0], 'sem coluna CRM');
    colunaId = board.data.colunas[0].id;

    await api('/api/crm/tags', {
      method: 'POST',
      body: JSON.stringify({ nome: tagNome }),
    });

    const c = await api('/api/crm/contatos', {
      method: 'POST',
      body: JSON.stringify({
        colunaId,
        nome: `Campanha Battery ${Date.now()}`,
        telefone: tel,
        ddi: '+55',
        iaAtiva: false,
        tags: [tagNome],
      }),
    });
    assert(c.res.ok && c.data.contato?.id, JSON.stringify(c.data));
    contatoId = c.data.contato.id;

    // garante tag no contato
    const p = await api(`/api/crm/contatos/${contatoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ tags: [tagNome] }),
    });
    assert(
      p.data.contato?.tags?.includes(tagNome),
      `tag nao aplicada: ${JSON.stringify(p.data)}`,
    );
  });

  await run('08 estimar publico > 0', async () => {
    const { res, data } = await api(
      `/api/campanhas/meta/estimar?tag=${encodeURIComponent(tagNome)}`,
    );
    assert(res.ok && data.ok && data.total >= 1, `estimado=${data.total}`);
  });

  await run('09 criar rascunho', async () => {
    const { res, data } = await api('/api/campanhas', {
      method: 'POST',
      body: JSON.stringify({
        nome: `Battery ${Date.now()}`,
        tag: tagNome,
        instancia,
        modo: 'livre',
        mensagens: [
          { id: 'm1', tipo: 'texto', texto: 'Oi — teste bateria Tilit (nao envia agora).' },
        ],
        delayMinSec: 30,
        delayMaxSec: 60,
        usarHorarios: false,
        agendadoEm: new Date(Date.now() + 7 * 24 * 3600_000).toISOString(),
        status: 'rascunho',
      }),
    });
    assert(res.ok && data.campanha?.id, JSON.stringify(data));
    assert(data.campanha.status === 'rascunho', `status=${data.campanha.status}`);
    campanhaId = data.campanha.id;
  });

  await run('10 agendar sem contatos falha', async () => {
    const empty = await api('/api/campanhas', {
      method: 'POST',
      body: JSON.stringify({
        nome: 'Vazia',
        tag: `nao-existe-${Date.now()}`,
        instancia,
        mensagens: [{ id: 'm1', tipo: 'texto', texto: 'x' }],
        delayMinSec: 30,
        delayMaxSec: 60,
      }),
    });
    assert(empty.data.campanha?.id, 'criar vazia');
    const ag = await api(`/api/campanhas/${empty.data.campanha.id}/agendar`, {
      method: 'POST',
    });
    assert(!ag.res.ok, 'deveria falhar');
    assert(/Nenhum contato/i.test(ag.data?.erro || ''), ag.data?.erro);
    await api(`/api/campanhas/${empty.data.campanha.id}`, { method: 'DELETE' });
  });

  await run('11 agendar campanha futura', async () => {
    const { res, data } = await api(`/api/campanhas/${campanhaId}/agendar`, {
      method: 'POST',
    });
    assert(res.ok && data.ok, JSON.stringify(data));
    assert(data.jobs >= 1, `jobs=${data.jobs}`);
    assert(data.campanha.status === 'agendada', `status=${data.campanha.status}`);
  });

  await run('12 listar mostra progresso', async () => {
    const { data } = await api('/api/campanhas');
    const c = data.campanhas.find((x) => x.id === campanhaId);
    assert(c, 'campanha sumiu');
    assert(c.totalJobs >= 1, `totalJobs=${c.totalJobs}`);
    assert(c.status === 'agendada', c.status);
  });

  await run('13 pausar cancela pendentes', async () => {
    const { res, data } = await api(`/api/campanhas/${campanhaId}/pausar`, {
      method: 'POST',
    });
    assert(res.ok && data.campanha.status === 'pausada', JSON.stringify(data));
  });

  await run('13b enviar agora remonta fila', async () => {
    const { res, data } = await api(`/api/campanhas/${campanhaId}/enviar-agora`, {
      method: 'POST',
    });
    assert(res.ok && data.ok && data.jobs >= 1, JSON.stringify(data));
    assert(data.campanha.status === 'agendada', `status=${data.campanha.status}`);
    // pausa de novo pra nao disparar no meio do teste
    await api(`/api/campanhas/${campanhaId}/pausar`, { method: 'POST' });
  });

  await run('14 tick nao quebra', async () => {
    const { res, data } = await api('/api/campanhas/tick', { method: 'POST' });
    assert(res.ok && data.ok && typeof data.processados === 'number', JSON.stringify(data));
  });

  await run('15 atualizar copy', async () => {
    const { res, data } = await api(`/api/campanhas/${campanhaId}`, {
      method: 'PUT',
      body: JSON.stringify({
        nome: 'Battery editada',
        tag: tagNome,
        instancia,
        mensagens: [{ id: 'm1', tipo: 'texto', texto: 'Copy atualizada.' }],
        delayMinSec: 45,
        delayMaxSec: 90,
        status: 'pausada',
      }),
    });
    assert(res.ok && data.campanha.nome === 'Battery editada', JSON.stringify(data));
    assert(data.campanha.delayMinSec === 45, 'delay');
  });

  await run('16 excluir campanha', async () => {
    const { res, data } = await api(`/api/campanhas/${campanhaId}`, { method: 'DELETE' });
    assert(res.ok && data.ok, JSON.stringify(data));
    const list = await api('/api/campanhas');
    assert(!list.data.campanhas.some((c) => c.id === campanhaId), 'ainda na lista');
  });

  await run('17 limpar contato CRM', async () => {
    if (contatoId) {
      const { res } = await api(`/api/crm/contatos/${contatoId}`, { method: 'DELETE' });
      assert(res.ok, `delete contato ${res.status}`);
    }
  });

  const fail = results.filter((r) => !r.ok);
  console.log(`\n=== API: ${results.length - fail.length}/${results.length} ok ===`);
  if (fail.length) {
    console.log('Falhas:', fail.map((f) => f.name).join(', '));
  }
  console.log('');
  process.exit(fail.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
