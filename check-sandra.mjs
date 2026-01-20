import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = "postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSandra() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT id, name, "userRole", "teamId", "coachTeamId"
      FROM "Member" 
      WHERE name = 'Sandra Pohl';
    `);
    
    console.log('Sandra Pohl:');
    console.log(result.rows[0]);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSandra().catch(console.error);
