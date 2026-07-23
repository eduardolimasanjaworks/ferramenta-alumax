async function testWebhook(token) {
  const challenge = '123456789';
  const url = `https://evolution.117.sanjaworks.com/webhook/meta?hub.mode=subscribe&hub.challenge=${challenge}&hub.verify_token=${token}`;
  
  const res = await fetch(url);
  const text = await res.text();
  console.log(`Token: ${token} | Status: ${res.status} | Response: ${text}`);
}

async function main() {
  await testWebhook('4813f30ee3d04216a0f7fc9c901a3646');
  await testWebhook('evolution');
}

main().catch(console.error);
