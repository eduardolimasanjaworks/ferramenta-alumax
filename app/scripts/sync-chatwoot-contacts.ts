import { config } from '../src/config.js';
import pg from 'pg';
import { chatwootFetch } from '../src/chatwoot-sync.js';

let dbUrl = config.databaseUrl;
if (dbUrl.includes('minasplaca_postgres')) {
  dbUrl = dbUrl.replace('minasplaca_postgres:5432', 'localhost:5435');
}
const pool = new pg.Pool({ connectionString: dbUrl });

async function syncAllToChatwoot() {
  console.log('🔄 Iniciando sincronização proativa de contatos para o Chatwoot...');
  
  // Buscar todos os contatos
  const { rows: contatos } = await pool.query(`
    SELECT id, nome, email, telefone, ddi, chatwoot_contact_id
    FROM crm_contatos
    WHERE telefone IS NOT NULL AND telefone != ''
  `);
  
  console.log(`Encontrados ${contatos.length} contatos com telefone para sincronizar.`);

  // Buscar todas as tags para associar
  const { rows: tagsRows } = await pool.query(`SELECT contato_id, tag FROM crm_contato_tags`);
  const tagsMap: Record<string, string[]> = {};
  for (const row of tagsRows) {
    if (!tagsMap[row.contato_id]) tagsMap[row.contato_id] = [];
    tagsMap[row.contato_id].push(row.tag);
  }

  let success = 0;
  let errors = 0;

  for (let i = 0; i < contatos.length; i++) {
    const c = contatos[i];
    const phone = c.ddi + c.telefone;

    try {
      // 1. Criar ou atualizar o contato
      let contactId = c.chatwoot_contact_id;
      if (!contactId) {
        const create = await chatwootFetch(`/api/v1/accounts/${config.chatwootAccountId}/contacts`, {
          method: 'POST',
          body: JSON.stringify({
            name: c.nome || phone,
            phone_number: phone,
            email: c.email || undefined,
            custom_attributes: { status_ia: 'ia_desligada' }
          })
        });

        if (create.ok) {
           const created = await create.json();
           contactId = created.payload?.contact?.id || created.payload?.id || created.id;
           if (contactId) {
             await pool.query(`UPDATE crm_contatos SET chatwoot_contact_id = $1 WHERE id = $2`, [contactId, c.id]);
           }
        } else if (create.status === 422) {
           // Contato ja existe, vamos buscar
           const search = await chatwootFetch(`/api/v1/accounts/${config.chatwootAccountId}/contacts/search?q=${encodeURIComponent(phone)}`);
           if (search.ok) {
             const sData = await search.json();
             const hit = sData.payload?.find((x: any) => x.phone_number?.includes(c.telefone));
             if (hit) {
               contactId = hit.id;
               await pool.query(`UPDATE crm_contatos SET chatwoot_contact_id = $1 WHERE id = $2`, [contactId, c.id]);
             }
           }
        }
      }

      // 2. Adicionar labels
      if (contactId && tagsMap[c.id]?.length > 0) {
        await chatwootFetch(`/api/v1/accounts/${config.chatwootAccountId}/contacts/${contactId}/labels`, {
          method: 'POST',
          body: JSON.stringify({ labels: tagsMap[c.id] })
        });
      }
      
      success++;
    } catch (err) {
      console.error(`❌ Erro no contato ${c.telefone}:`, err);
      errors++;
    }

    if ((i + 1) % 50 === 0) {
      console.log(`Progresso: ${i + 1} / ${contatos.length} contatos processados...`);
    }
    
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`🎉 Sincronização finalizada!`);
  console.log(`✅ Sucessos: ${success}`);
  console.log(`❌ Erros/Ignorados: ${errors}`);
  process.exit(0);
}

syncAllToChatwoot().catch(e => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
