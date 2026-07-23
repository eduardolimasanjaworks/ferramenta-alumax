const payload = {
  event: 'messages.upsert',
  instance: 'alumax-principal',
  data: {
    key: {
      remoteJid: '5512982787368@s.whatsapp.net',
      fromMe: false,
      id: 'TEST_PROD_' + Date.now()
    },
    pushName: 'Victor Hugo',
    message: {
      conversation: 'Ola bom dia'
    }
  }
};

console.log('Sending webhook payload to https://alumax.ia.sanjaworks.com/webhook/evolution...');

fetch('https://alumax.ia.sanjaworks.com/webhook/evolution', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Evolution-API'
  },
  body: JSON.stringify(payload)
})
  .then(async (r) => {
    console.log('Status:', r.status);
    console.log('Headers:', Object.fromEntries(r.headers.entries()));
    console.log('Body:', await r.text());
  })
  .catch((e) => console.error('Erro:', e.message));
