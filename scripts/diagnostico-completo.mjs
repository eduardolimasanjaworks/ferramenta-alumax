import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

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

const evoUrl = process.env.EVOLUTION_URL || 'https://evolution.117.sanjaworks.com';
const evoApiKey = process.env.EVOLUTION_API_KEY || '4813f30ee3d04216a0f7fc9c901a3646';
const evoInstance = process.env.EVOLUTION_INSTANCE || 'alumax-principal';
const prodWebhookUrl = 'https://alumax.ia.sanjaworks.com/webhook/evolution';

console.log('===========================================================');
console.log('🔍 DIAGNÓSTICO COMPLETO DO PROCESSO DA IA ALUMAX');
console.log('===========================================================\n');

async function diagnosticar() {
  const resultados = [];

  // 1. Instância Evolution API
  try {
    const resInst = await fetch(`${evoUrl}/instance/connectionState/${evoInstance}`, {
      headers: { 'apikey': evoApiKey }
    });
    const dataInst = await resInst.json();
    const status = dataInst?.instance?.state || 'desconhecido';
    resultados.push({
      etapa: '1. Instância WhatsApp (Evolution API)',
      status: status === 'open' ? '✅ OK (Conectado)' : `⚠️ ALERTA (${status})`,
      detalhes: `Instância: ${evoInstance} | Estado: ${status}`
    });
  } catch (err) {
    resultados.push({ etapa: '1. Instância WhatsApp (Evolution API)', status: '❌ ERRO', detalhes: err.message });
  }

  // 2. Configuração do Webhook na Evolution
  try {
    const resWh = await fetch(`${evoUrl}/webhook/find/${evoInstance}`, {
      headers: { 'apikey': evoApiKey }
    });
    const dataWh = await resWh.json();
    const urlAtual = dataWh?.url || '';
    const enabled = dataWh?.enabled === true;
    const ok = enabled && urlAtual === prodWebhookUrl;

    resultados.push({
      etapa: '2. Configuração do Webhook',
      status: ok ? '✅ OK' : '⚠️ INCORRETO',
      detalhes: `URL Configurada: ${urlAtual} | Ativo: ${enabled}`
    });
  } catch (err) {
    resultados.push({ etapa: '2. Configuração do Webhook', status: '❌ ERRO', detalhes: err.message });
  }

  // 3. Resposta do Servidor em Nuvem (/webhook/evolution)
  try {
    const payloadTeste = {
      event: 'MESSAGES_UPSERT',
      instance: evoInstance,
      data: {
        key: { remoteJid: '5512982787368@s.whatsapp.net', fromMe: false, id: 'TEST_DIAG_' + Date.now() },
        pushName: 'Victor Hugo',
        message: { conversation: 'Teste de integridade do processo' }
      }
    };
    const resProd = await fetch(prodWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadTeste)
    });
    const dataProd = await resProd.json();
    resultados.push({
      etapa: '3. Recepção no Servidor Webhook Nuvem',
      status: dataProd.ok ? '✅ OK' : '❌ ERRO',
      detalhes: JSON.stringify(dataProd)
    });
  } catch (err) {
    resultados.push({ etapa: '3. Recepção no Servidor Webhook Nuvem', status: '❌ ERRO', detalhes: err.message });
  }

  // 4. Teste do Modelo de IA via OpenRouter
  try {
    const token = process.env.OPENROUTER_TOKEN;
    if (!token) {
      resultados.push({ etapa: '4. Integração LLM (OpenRouter/OpenAI)', status: '⚠️ TOKEN NÃO CONFIGURADO', detalhes: 'OPENROUTER_TOKEN' });
    } else {
      const resLLM = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Você é a IA da Alumax.' },
            { role: 'user', content: 'Responda com "OK ALUMAX" para teste.' }
          ]
        })
      });
      const dataLLM = await resLLM.json();
      const respTexto = dataLLM.choices?.[0]?.message?.content || '';
      resultados.push({
        etapa: '4. Integração LLM (OpenRouter/OpenAI)',
        status: respTexto ? '✅ OK' : '❌ ERRO',
        detalhes: `Resposta gerada: "${respTexto.trim()}"`
      });
    }
  } catch (err) {
    resultados.push({ etapa: '4. Integração LLM (OpenRouter/OpenAI)', status: '❌ ERRO', detalhes: err.message });
  }

  // 5. Teste do Envio Final via Evolution API
  try {
    const resSend = await fetch(`${evoUrl}/message/sendText/${evoInstance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evoApiKey
      },
      body: JSON.stringify({
        number: '5512982787368',
        text: '🔍 Teste de integridade da cadeia de processo concluído com sucesso!'
      })
    });
    const dataSend = await resSend.json();
    resultados.push({
      etapa: '5. Disparo Final de Mensagem para WhatsApp',
      status: dataSend.key ? '✅ OK' : '❌ ERRO',
      detalhes: `ID da mensagem: ${dataSend.key?.id || 'não retornado'}`
    });
  } catch (err) {
    resultados.push({ etapa: '5. Disparo Final de Mensagem para WhatsApp', status: '❌ ERRO', detalhes: err.message });
  }

  // Imprime relatório final
  console.log('-----------------------------------------------------------');
  for (const r of resultados) {
    console.log(`${r.etapa.padEnd(42)} -> ${r.status}`);
    console.log(`   Detalhes: ${r.detalhes}\n`);
  }
  console.log('===========================================================');
}

diagnosticar();
