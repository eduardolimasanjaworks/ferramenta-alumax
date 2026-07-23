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

  const urlChatwoot = `${url}/chatwoot/set/alumax-oficial-meta-622939`;
  const bodyChatwoot = {
    enabled: true,
    accountId: "18",
    url: "https://chat.sanjaworks.com",
    token: "qGQpjFsw1PMv8kN4jNVLJ8jH",
    inboxName: "Alumax Oficial (API)", // dummy name
    signMsg: true,
  };

  const resChatwoot = await fetch(urlChatwoot, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey,
    },
    body: JSON.stringify(bodyChatwoot),
  });
  
  console.log(resChatwoot.status, await resChatwoot.text());
}

main().catch(console.error);
