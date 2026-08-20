const { Client } = require('pg');

async function updateDb() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_t6QcaxdwZEp5@ep-hidden-violet-aiuc1g8o-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    await client.connect();
    
    // Add timezone column if it doesn't exist
    await client.query(`
      ALTER TABLE booking_settings 
      ADD COLUMN IF NOT EXISTS "timezone" character varying NOT NULL DEFAULT 'America/New_York';
    `);
    
    // Update timezone to Asia/Dhaka and enabledWeekdays to exclude Friday(5) and Saturday(6)
    // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 7=Sun
    await client.query(`
      UPDATE booking_settings 
      SET "timezone" = 'Asia/Dhaka',
          "enabledWeekdays" = '1,2,3,4,7'
      WHERE id = 1;
    `);
    
    const afterRes = await client.query('SELECT * FROM booking_settings;');
    console.log("After:", afterRes.rows[0]);
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

updateDb();
