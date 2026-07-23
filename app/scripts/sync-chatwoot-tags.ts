import { config } from '../src/config.js';
import pg from 'pg';
import { chatwootFetch } from '../src/chatwoot-sync.js';

let dbUrl = config.databaseUrl;
if (dbUrl.includes('minasplaca_postgres')) {
  dbUrl = dbUrl.replace('minasplaca_postgres:5432', 'localhost:5435');
}
const pool = new pg.Pool({ connectionString: dbUrl });

async function syncTags() {
  console.log('🔄 Buscando tags únicas no banco de dados local...');
  
  const res = await pool.query('SELECT DISTINCT tag FROM crm_contato_tags WHERE tag IS NOT NULL AND tag != \'\'');
  const tags = res.rows.map(r => r.tag);
  
  console.log(`Encontradas ${tags.length} tags únicas. Iniciando criação no Chatwoot...`);
  
  let successCount = 0;
  for (const tag of tags) {
    const payload = {
      title: tag,
      description: 'Importada do CRM Software I.A',
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'), // cor aleatoria
      show_on_sidebar: true
    };
    
    try {
      const createRes = await chatwootFetch(`/api/v1/accounts/${config.chatwootAccountId}/labels`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (createRes.ok) {
        successCount++;
        console.log(`✅ Tag criada: ${tag}`);
      } else {
        // Se retornar 422 (Unprocessable Entity), a tag provavelemnte já existe.
        if (createRes.status === 422) {
          console.log(`⚠️ Tag já existe: ${tag}`);
        } else {
          console.error(`❌ Erro HTTP ${createRes.status} ao criar tag: ${tag}`);
        }
      }
    } catch (e) {
      console.error(`❌ Erro de conexão ao tentar criar tag ${tag}:`, e);
    }
  }
  
  console.log(`🎉 Processo finalizado! ${successCount} novas tags criadas no Chatwoot.`);
  process.exit(0);
}

syncTags().catch(e => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
