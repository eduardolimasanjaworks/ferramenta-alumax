import fs from 'fs';
import path from 'path';

async function main() {
  const envPath = path.resolve('.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  let url = '';
  let token = '';
  let accountId = '';
  
  envContent.split('\n').forEach(line => {
    if (line.startsWith('CHATWOOT_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('CHATWOOT_PLATFORM_TOKEN=')) token = line.split('=')[1].trim();
    if (line.startsWith('CHATWOOT_ACCOUNT_ID=')) accountId = line.split('=')[1].trim();
  });

  console.log(`Checking Chatwoot Account ${accountId} at ${url}`);

  // Fetch inboxes
  const resInboxes = await fetch(`${url}/api/v1/accounts/${accountId}/inboxes`, {
    headers: { 'api_access_token': token }
  });
  
  if (!resInboxes.ok) {
    console.error('Failed to fetch inboxes', resInboxes.status, await resInboxes.text());
    return;
  }
  
  const inboxes = await resInboxes.json();
  console.log(`\nFound ${inboxes.payload.length} inboxes:`);
  
  for (const inbox of inboxes.payload) {
    console.log(`- Inbox ${inbox.id}: ${inbox.name} (type: ${inbox.channel_type})`);
    
    // Fetch conversations for this inbox
    const resConv = await fetch(`${url}/api/v1/accounts/${accountId}/conversations?inbox_id=${inbox.id}`, {
      headers: { 'api_access_token': token }
    });
    
    if (resConv.ok) {
        const convs = await resConv.json();
        console.log(`  -> ${convs.data.meta.mine_count} mine, ${convs.data.meta.unassigned_count} unassigned, ${convs.data.meta.all_count} all`);
    } else {
        console.log(`  -> Failed to fetch convs: ${resConv.status}`);
    }
  }
}

main().catch(console.error);
