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

  if (!url || !apikey) {
    console.error('Missing env vars');
    return;
  }

  const res = await fetch(`${url}/instance/fetchInstances`, {
    headers: {
      apikey,
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
