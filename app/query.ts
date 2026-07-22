import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://minasplaca:minasplaca_secret@localhost:5435/alumax' });
pool.query("SELECT * FROM configuracao LIMIT 5").then(res => {
  console.log(res.rows);
  process.exit(0);
});
