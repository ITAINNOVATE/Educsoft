const { Client } = require('pg');

const connectionString = 'postgresql://postgres.jorecpcnhlstxzqdygda:EduSoft2026%21@aws-1-eu-west-3.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id, name, code FROM "Establishment"');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

main();
