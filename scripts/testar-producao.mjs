console.log('\n🔍 Testando autenticação e rotas na nuvem (https://alumax.ia.sanjaworks.com)...\n');

async function testarNuvem() {
  try {
    // Login
    const loginRes = await fetch('https://alumax.ia.sanjaworks.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@alumax.local',
        senha: 'alumax-admin-2026'
      })
    });

    const cookieHeader = loginRes.headers.get('set-cookie');
    console.log('Login Status:', loginRes.status);
    console.log('Cookie:', cookieHeader);

    if (!cookieHeader) {
      console.error('❌ Falha ao obter cookie de sessão na nuvem');
      return;
    }

    const headers = { 'Cookie': cookieHeader };

    // Checa pausas ativas
    const pausasRes = await fetch('https://alumax.ia.sanjaworks.com/api/ia/pausas-ativas', { headers });
    console.log('Pausas ativas em Produção:', await pausasRes.json());

    // Checa pausa global
    const globalRes = await fetch('https://alumax.ia.sanjaworks.com/api/ia/pausa-global', { headers });
    console.log('Pausa Global em Produção:', await globalRes.json());

  } catch (err) {
    console.error('Erro ao testar nuvem:', err.message);
  }
}

testarNuvem();
