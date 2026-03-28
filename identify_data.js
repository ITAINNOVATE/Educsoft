const { Client } = require('pg');

const connectionString = 'postgresql://postgres.jorecpcnhlstxzqdygda:EduSoft2026%21@aws-1-eu-west-3.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    // 1. List establishments
    const estRes = await client.query('SELECT id, name, code FROM "Establishment"');
    console.log("--- Establishments ---");
    console.log(JSON.stringify(estRes.rows, null, 2));

    // 2. Count data for each
    for (const est of estRes.rows) {
        const studentCount = await client.query('SELECT COUNT(*) FROM "Student" WHERE "establishmentId" = $1', [est.id]);
        const userCount = await client.query('SELECT COUNT(*) FROM "User" WHERE "establishmentId" = $1', [est.id]);
        const paymentCount = await client.query('SELECT COUNT(*) FROM "Payment" WHERE "establishmentId" = $1', [est.id]);
        
        console.log(`\nStats for ${est.name} (${est.code}):`);
        console.log(`- Students: ${studentCount.rows[0].count}`);
        console.log(`- Users: ${userCount.rows[0].count}`);
        console.log(`- Payments: ${paymentCount.rows[0].count}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
