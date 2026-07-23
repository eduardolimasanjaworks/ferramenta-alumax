import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Carrega .env
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

const token = process.env.OPENROUTER_TOKEN || process.env.OPENAI_API_KEY;
const model = process.env.MODELO_CHAT_OPENROUTER || 'openai/gpt-4o-mini';

console.log(`\n🤖 Testando motor de IA (${model})...\n`);

const promptPath = resolve(process.cwd(), 'prompt-cliente.txt');
const systemPrompt = existsSync(promptPath) 
  ? readFileSync(promptPath, 'utf-8')
  : 'Você é um assistente virtual atencioso, rápido e prestativo da empresa Alumax.';

const userMessage = process.argv[2] || 'Olá! Gostaria de saber os serviços e produtos que vocês oferecem e como posso fazer um orçamento.';

console.log(`💬 Mensagem do Cliente: "${userMessage}"\n`);

async function testarIA() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://alumax.ia.sanjaworks.com',
        'X-Title': 'Alumax IA'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('❌ Erro na API:', data);
      return;
    }

    const respostaIA = data.choices?.[0]?.message?.content;
    console.log('🤖 Resposta da IA Alumax:\n');
    console.log('--------------------------------------------------');
    console.log(respostaIA);
    console.log('--------------------------------------------------\n');
    console.log('✅ IA funcionando e respondendo com sucesso!');
  } catch (err) {
    console.error('❌ Falha ao conectar à IA:', err.message);
  }
}

testarIA();
