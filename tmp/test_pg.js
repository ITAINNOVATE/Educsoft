const { Client } = require('pg');

async function testConnection() {
  const connectionString = "postgresql://postgres.eqqdjqdbbwmshllqesdt:Dilshadtairou2@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?connect_timeout=30";
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("SUCCESS: Connected successfully!");
    const res = await client.query('SELECT current_user, now()');
    console.log("Result:", res.rows[0]);
  } catch (err) {
    console.error("FAILURE: Connection failed.");
    console.error("Error Detail:", err.message);
  } finally {
    await client.end();
  }
}

testConnection();
