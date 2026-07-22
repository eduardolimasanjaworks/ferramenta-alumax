import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://minasplaca:minasplaca_secret@localhost:5435/alumax' });
async function run() {
  await pool.query("UPDATE painel_usuarios SET chatwoot_user_id = 75 WHERE email = 'admin@alumax.local'");
  console.log('Updated admin chatwoot id');
  process.exit(0);
}
run().catch(console.error);
