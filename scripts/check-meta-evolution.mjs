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

  const res = await fetch(`${url}/instance/fetchInstances`, {
    headers: { apikey }
  });
  const data = await res.json();
  const metaInstances = data.filter(i => i.integration === 'WHATSAPP-BUSINESS');
  
  console.log('--- Meta Instances ---');
  for (const inst of metaInstances) {
    console.log(`\nInstance: ${inst.name}`);
    console.log(`Connection Status: ${inst.connectionStatus}`);
    
    // Check Chatwoot config
    const resCw = await fetch(`${url}/chatwoot/find/${inst.name}`, { headers: { apikey }});
    console.log(`Chatwoot config status: ${resCw.status}`);
    if (resCw.ok) {
        console.log(await resCw.json());
    }

    // Check webhook config (for evolution to chatwoot / our webhook)
    const resWh = await fetch(`${url}/webhook/find/${inst.name}`, { headers: { apikey }});
    console.log(`Evolution Webhook config status: ${resWh.status}`);
    if (resWh.ok) {
        console.log(await resWh.json());
    }
  }
}

main().catch(console.error);
