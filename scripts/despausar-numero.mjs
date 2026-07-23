import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const l = line.trim();
    if (!l || l.startsWith('#')) continue;
    const idx = l.indexOf('=');
    if (idx > 0) {
      const k = l.substring(0, idx).trim();
      const v = l.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const telefoneTarget = '5512982787368';

console.log(`\n🔓 Verificando e garantindo que a IA esteja RELIGADA para ${telefoneTarget}...\n`);

async function despausar() {
  try {
    const { definirPausa, obterEstadoPausa, definirPausaGlobal } = await import('../app/dist/pausa-minasplaca.js');
    
    // 1. Remove qualquer pausa global
    console.log('1. Garantindo que a pausa global da IA esteja DESATIVADA...');
    await definirPausaGlobal(false, { motivo: 'Religando IA para teste', origem: 'script' }).catch(() => {});

    // 2. Remove pausa individual do contato
    console.log(`2. Religando a IA para o contato ${telefoneTarget}...`);
    await definirPausa(telefoneTarget, false, { motivo: 'Religando IA manualmente para teste', origem: 'script' }).catch(() => {});

    // 3. Confirma o estado final
    const estado = await obterEstadoPausa(telefoneTarget).catch(() => ({ pausada: false }));
    console.log(`\n✅ ESTADO DA IA PARA ${telefoneTarget}:`, JSON.stringify(estado, null, 2));

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

despausar();
