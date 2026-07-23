import fs from 'fs';
import path from 'path';

async function main() {
  const envPath = path.resolve('.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  let url = 'https://chat.sanjaworks.com';
  let token = 'qGQpjFsw1PMv8kN4jNVLJ8jH';
  let accountId = '18';
  let userId = '75';

  console.log(`Getting access token for User ${userId} via Platform API`);

  const resAuth = await fetch(`${url}/platform/api/v1/users/${userId}/login`, {
    method: 'POST',
    headers: { 'access-token': token }
  });
  
  if (!resAuth.ok) {
    console.error('Failed to login', resAuth.status, await resAuth.text());
    return;
  }
  
  const authData = await resAuth.json();
  // Usually returns { url: "...", token: "..." } or similar
  console.log('Login Response:', JSON.stringify(authData, null, 2));
}

main().catch(console.error);
