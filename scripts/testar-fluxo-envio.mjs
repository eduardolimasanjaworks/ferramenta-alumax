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

console.log('\n🚀 Testando fluxo completo do debounce -> agente -> envio WhatsApp...\n');

async function testarFluxoEnvio() {
  try {
    const { processarContato } = await import('../app/dist/debounce-minasplaca.js');
    const { obterRedis } = await import('../app/dist/lib/redis.js');
    
    const redis = obterRedis();
    const telefone = '5512982787368';
    const chaveLista = `debounce:lista:${telefone}`;

    // Adiciona uma mensagem de teste no Redis local
    await redis.rpush(chaveLista, JSON.stringify({
      remoteJid: `${telefone}@s.whatsapp.net`,
      telefone,
      conteudo: 'Ola bom dia',
      tipo: 'texto',
      pushName: 'Victor Hugo',
      instance: 'alumax-principal',
      recebidoEm: Date.now()
    }));

    console.log(`[teste] Mensagem adicionada à fila de debounce para ${telefone}. Processando...`);
    await processarContato(`${telefone}@s.whatsapp.net`);

    console.log('\n✅ FLUXO COMPLETO EXECUTADO COM SUCESSO!');
  } catch (err) {
    console.error('❌ Erro no fluxo:', err);
  }
}

testarFluxoEnvio();
