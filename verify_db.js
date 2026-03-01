import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

async function verify() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n--- 1️⃣ DATABASE PROOF: estateStatus counts ---');
    const counts = await client.query('SELECT estate_status, COUNT(*) FROM estates GROUP BY estate_status');
    console.table(counts.rows);

    console.log('\n--- 2️⃣ DATABASE PROOF: Newest estates (DRAFT default) ---');
    const newest = await client.query('SELECT id, estate_status, created_at FROM estates ORDER BY created_at DESC LIMIT 3');
    console.table(newest.rows);

    console.log('\n--- 3️⃣ SCHEMA PROOF: Missing columns check ---');
    const columns = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'estates' 
    AND column_name IN (
      'user_selected_estate_authority_type',
      'has_probate_assets',
      'completeness_level'
    )
  `);
    console.table(columns.rows);

    await client.end();
}

verify().catch(console.error);
