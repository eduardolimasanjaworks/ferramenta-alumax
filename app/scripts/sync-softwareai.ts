import { config } from '../src/config.js';
import pg from 'pg';

let dbUrl = config.databaseUrl;
if (dbUrl.includes('minasplaca_postgres')) {
  dbUrl = dbUrl.replace('minasplaca_postgres:5432', 'localhost:5435');
}
const pool = new pg.Pool({ connectionString: dbUrl });

async function sync() {
  const apiKey = config.softwareAiApiKey;
  if (!apiKey) {
    console.error('❌ SOFTWAREAI_API_KEY não configurada no .env');
    process.exit(1);
  }

  const baseUrl = 'https://xltw-api6-8lww.b2.xano.io/api:Ov2JsBUq';
  const headers = { Authorization: `Bearer ${apiKey}` };

  console.log('🔄 Iniciando sincronização com Software I.A...');

  // 1. Sincronizar Colunas
  console.log('📦 Baixando colunas...');
  const resColunas = await fetch(`${baseUrl}/contact-columns`, { headers });
  if (!resColunas.ok) throw new Error('Erro ao baixar colunas: ' + await resColunas.text());
  
  const colunas = await resColunas.json();
  let fallbackColId = 'col-novos';
  
  for (const c of colunas) {
    const id = String(c.id);
    const titulo = c.title || c.titulo || 'Coluna Sem Nome';
    const cor = c.color || 'rgb(59, 130, 246)';
    const ordem = Math.round(Number(c.order)) || 0;
    fallbackColId = id; // usar o ultimo como fallback se der erro
    
    await pool.query(`
      INSERT INTO crm_colunas (id, titulo, cor, ordem, pipeline_id)
      VALUES ($1, $2, $3, $4, 'pipe-principal')
      ON CONFLICT (id) DO UPDATE SET 
        titulo = EXCLUDED.titulo, 
        cor = EXCLUDED.cor, 
        ordem = EXCLUDED.ordem,
        pipeline_id = 'pipe-principal'
    `, [id, titulo, cor, ordem]);
  }
  console.log(`✅ ${colunas.length} colunas sincronizadas.`);

  // 2. Sincronizar Contatos e Tags
  let page = 1;
  let totalSaved = 0;
  
  while (true) {
    console.log(`👥 Baixando contatos (página ${page})...`);
    const resContacts = await fetch(`${baseUrl}/contacts?page=${page}`, { headers });
    if (!resContacts.ok) throw new Error('Erro ao baixar contatos: ' + await resContacts.text());
    
    const data = await resContacts.json();
    const contacts = data.items || data;
    
    if (!contacts || contacts.length === 0) break;

    for (const c of contacts) {
      const id = String(c.id);
      
      // Ajusta o ID da coluna (se vier null, manda para a primeira disponível)
      let colId = String(c.contact_column_id || c.coluna_id || '');
      if (!colId || colId === 'null') colId = fallbackColId;

      const nome = c.nome || c.name || 'Sem nome';
      const email = c.email || '';
      const telefone = c.numero_tel || c.telefone || c.phone || '';
      const ddi = c.ddi || '+55';
      const valorOportunidade = String(c.oportunity_value || 0);

      // Inserir ou atualizar contato (Upsert)
      await pool.query(`
        INSERT INTO crm_contatos (id, coluna_id, nome, email, telefone, ddi, valor_oportunidade, criado_em)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) DO UPDATE SET
          coluna_id = EXCLUDED.coluna_id,
          nome = EXCLUDED.nome,
          email = EXCLUDED.email,
          telefone = EXCLUDED.telefone,
          ddi = EXCLUDED.ddi,
          valor_oportunidade = EXCLUDED.valor_oportunidade
      `, [id, colId, nome, email, telefone, ddi, valorOportunidade]);

      // Tags (Substituir completamente as tags locais pelas que vieram na API)
      if (c.tags && Array.isArray(c.tags)) {
        await pool.query(`DELETE FROM crm_contato_tags WHERE contato_id = $1`, [id]);
        for (const t of c.tags) {
           const tagName = typeof t === 'string' ? t : t.name;
           if(tagName) {
             await pool.query(`
               INSERT INTO crm_contato_tags (contato_id, tag) 
               VALUES ($1, $2) ON CONFLICT DO NOTHING
             `, [id, tagName]);
           }
        }
      }
      totalSaved++;
    }

    if (data.curPage >= data.pageTotal || contacts.length === 0) {
      break;
    }
    page++;
  }

  console.log(`✅ ${totalSaved} contatos (e suas tags) sincronizados com sucesso.`);
  process.exit(0);
}

sync().catch(e => {
  console.error('❌ Erro Fatal:', e);
  process.exit(1);
});
