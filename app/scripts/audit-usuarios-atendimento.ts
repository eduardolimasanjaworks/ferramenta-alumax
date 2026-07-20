/**
 * Auditoria viva do espelho painel ↔ Atendimento (account Tilit #12).
 * Cria, confere agent, apaga, confere remoção. Aponta buracos.
 */
import { config } from '../src/config.ts';

const BASE = process.env.TEST_BASE_URL || 'http://127.0.0.1:8096';
const CW = config.chatwootUrl.replace(/\/$/, '');
const ACC = config.chatwootAccountId;
const PLATFORM = config.chatwootPlatformToken!;
const SSO = config.chatwootSsoUserId;
const SENHA = process.env.TEST_SENHA || '';

let cookie = '';

async function api(path: string, opts: RequestInit & { body?: string } = {}) {
  const headers: Record<string, string> = {
    ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
  };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(BASE + path, { ...opts, headers });
  const sc = res.headers.get('set-cookie');
  if (sc) {
    cookie = sc
      .split(',')
      .map((x) => x.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');
  }
  return { res, data: (await res.json().catch(() => ({}))) as Record<string, any> };
}

async function platform(path: string, init: RequestInit = {}) {
  const r = await fetch(CW + path, {
    ...init,
    headers: {
      'Api-Access-Token': PLATFORM,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  const t = await r.text();
  let body: any = t;
  try {
    body = JSON.parse(t);
  } catch {
    /* raw */
  }
  return { status: r.status, body };
}

async function accountToken() {
  const r = await platform(`/platform/api/v1/users/${SSO}`);
  return r.body?.access_token as string | undefined;
}

async function listAgents(token: string) {
  const r = await fetch(`${CW}/api/v1/accounts/${ACC}/agents`, {
    headers: { 'api-access-token': token },
  });
  const body = await r.json().catch(() => []);
  const agents = Array.isArray(body) ? body : body?.payload || body?.data || [];
  return { status: r.status, agents: agents as any[] };
}

async function main() {
  if (!SENHA) throw new Error('Defina TEST_SENHA');
  const bugs: string[] = [];

  const login = await api('/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@tilitgroup.com', senha: SENHA }),
  });
  console.log('01 login', login.res.status);
  if (!login.res.ok) throw new Error('login falhou');

  const token = await accountToken();
  if (!token) bugs.push('sem access_token do SSO (Account API agents pode falhar)');
  console.log('02 account_token', Boolean(token));

  const email = `audit-sync-${Date.now()}@sanjaworks.com`;
  const create = await api('/api/ia/usuarios', {
    method: 'POST',
    body: JSON.stringify({
      nome: 'Audit Sync',
      email,
      senha: 'AuditSync1!',
      role: 'agente',
      abas: ['assistente'],
    }),
  });
  const cwId = create.data.usuario?.chatwoot_user_id;
  console.log('03 CREATE', create.res.status, {
    ok: create.data.ok,
    panelId: create.data.usuario?.id,
    cwId,
    motivo: create.data.atendimento?.motivo || create.data.erro,
  });
  if (!create.data.ok || !cwId) {
    bugs.push(`create falhou: ${create.data.erro || JSON.stringify(create.data)}`);
    console.log('BUGS', bugs);
    process.exit(1);
  }

  const afterCreate = await listAgents(token!);
  const found = afterCreate.agents.find((a) => a.id === cwId || a.email === email);
  console.log('04 AGENT_IN_ACCOUNT', found ? { id: found.id, email: found.email } : 'NOT_FOUND');
  if (!found) bugs.push('criou no painel mas agent nao aparece na account Tilit');

  const pu = await platform(`/platform/api/v1/users/${cwId}`);
  console.log('05 PLATFORM_USER', pu.status, pu.body?.email || '');
  if (pu.status !== 200) bugs.push('platform user ausente apos create');

  const del = await api(`/api/ia/usuarios/${create.data.usuario.id}`, { method: 'DELETE' });
  console.log('06 DELETE', del.res.status, del.data.atendimento || del.data);

  const afterDel = await listAgents(token!);
  const still = afterDel.agents.find((a) => a.id === cwId || a.email === email);
  console.log('07 AGENT_AFTER_DELETE', still ? 'STILL_PRESENT' : 'GONE');
  if (still) bugs.push('agent ainda na account apos apagar no painel');

  const pu2 = await platform(`/platform/api/v1/users/${cwId}`);
  console.log('08 PLATFORM_AFTER', pu2.status);
  if (pu2.status !== 404) bugs.push(`platform user ainda existe (http ${pu2.status})`);

  const lista = await api('/api/ia/usuarios');
  const orphanPanel = (lista.data.usuarios || []).filter((u: any) => !u.chatwoot_user_id);
  console.log(
    '09 LEGACY_SEM_VINCULO',
    orphanPanel.map((u: any) => u.email),
  );
  // delete agora resolve por e-mail; só marca INFO
  if (orphanPanel.length) {
    console.log(
      'INFO: legados sem chatwoot_user_id — delete usa lookup por e-mail na account',
    );
  }

  // cenário email already exists no chatwoot
  const email2 = `audit-dup-${Date.now()}@sanjaworks.com`;
  const pre = await platform('/platform/api/v1/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'Preexist', email: email2, password: 'PreExist1!' }),
  });
  console.log('10a PRECREATE_PLATFORM', pre.status, pre.body?.id);
  // vincula na account pra existir como agent
  if (pre.body?.id) {
    await platform(`/platform/api/v1/accounts/${ACC}/account_users`, {
      method: 'POST',
      body: JSON.stringify({ user_id: pre.body.id, role: 'agent' }),
    });
  }
  const createDup = await api('/api/ia/usuarios', {
    method: 'POST',
    body: JSON.stringify({
      nome: 'Preexist Panel',
      email: email2,
      senha: 'PreExist1!',
      role: 'agente',
      abas: ['assistente'],
    }),
  });
  console.log('10b CREATE_EMAIL_JA_EXISTE', createDup.res.status, {
    ok: createDup.data.ok,
    cw: createDup.data.usuario?.chatwoot_user_id,
    erro: createDup.data.erro,
    motivo: createDup.data.atendimento?.motivo,
  });
  if (!createDup.data.ok) {
    bugs.push('email ja existente no Atendimento: painel deveria reusar/vincular');
    if (pre.body?.id) {
      await platform(`/platform/api/v1/users/${pre.body.id}`, { method: 'DELETE' });
    }
  } else if (createDup.data.usuario?.id) {
    const d2 = await api(`/api/ia/usuarios/${createDup.data.usuario.id}`, {
      method: 'DELETE',
    });
    if (!d2.data.ok) bugs.push('falha ao apagar usuario reusado');
  }

  console.log('\n=== RESULTADO ===');
  if (bugs.length) {
    bugs.forEach((b, i) => console.log(`BUG ${i + 1}: ${b}`));
    process.exit(2);
  }
  console.log('OK caminho feliz + reuso de e-mail');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
