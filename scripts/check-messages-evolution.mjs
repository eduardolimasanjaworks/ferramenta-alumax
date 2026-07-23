import fs from 'fs';
import path from 'path';

async function main() {
  const envPath = path.resolve('.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  let url = '';
  let apikey = '';
  
  envContent.split('\n').forEach(line => {
    if (line.startsWith('EVOLUTION_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('EVOLUTION_API_KEY=')) apikey = line.split('=')[1].trim();
  });

  const instances = ['alumax-oficial-meta-622939', 'alumax-oficial-meta-578120'];
  
  for (const instance of instances) {
    console.log(`\n--- Verificando mensagens para ${instance} ---`);
    const res = await fetch(`${url}/chat/findMessages/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey
      },
      body: JSON.stringify({ where: {} })
    });
    
    if (res.ok) {
        const data = await res.json();
        const records = data.messages?.records || [];
        console.log(`Total de mensagens encontradas: ${records.length}`);
        
        // Print the last 3 messages
        const lastMsgs = records.slice(0, 3);
        for (const msg of lastMsgs) {
            console.log(`- De: ${msg.key.remoteJid} | Direcao: ${msg.key.fromMe ? 'Enviada' : 'Recebida'} | Msg: ${JSON.stringify(msg.message)} | Status: ${msg.status}`);
        }
    } else {
        console.error(`Erro ao buscar: ${res.status} - ${await res.text()}`);
    }
    
    // Check global instance status again to see if Message count went up
    const resInst = await fetch(`${url}/instance/fetchInstances`, { headers: { apikey } });
    if (resInst.ok) {
        const insts = await resInst.json();
        const me = insts.find(i => i.name === instance);
        if (me) {
            console.log(`Contagem geral (do banco da Evolution):`, me._count);
        }
    }
  }
}

main().catch(console.error);
