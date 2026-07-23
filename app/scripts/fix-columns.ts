import { config } from '../src/config.js';
import pg from 'pg';

let dbUrl = config.databaseUrl;
if (dbUrl.includes('minasplaca_postgres')) {
  dbUrl = dbUrl.replace('minasplaca_postgres:5432', 'localhost:5435');
}
const pool = new pg.Pool({ connectionString: dbUrl });

async function fix() {
  console.log('Vinculando colunas importadas ao Kanban principal...');
  await pool.query(`UPDATE crm_colunas SET pipeline_id = 'pipe-principal' WHERE pipeline_id IS NULL`);
  
  console.log('Removendo colunas padrão antigas que estão vazias (para limpar o visual)...');
  // Deletar colunas antigas APENAS se elas nao tiverem nenhum contato
  await pool.query(`
    DELETE FROM crm_colunas 
    WHERE id IN ('col-novos', 'col-negociacao', 'col-fechamento')
    AND NOT EXISTS (SELECT 1 FROM crm_contatos WHERE coluna_id = crm_colunas.id)
  `);
  
  console.log('Pronto!');
  process.exit(0);
}

fix().catch(e => {
  console.error(e);
  process.exit(1);
});
