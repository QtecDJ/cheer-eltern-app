import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = "postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addCoachTeamColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adding coachTeamId column...\n');
    
    // Add column
    console.log('Step 1: Adding coachTeamId column...');
    await client.query(`
      ALTER TABLE "Member" 
      ADD COLUMN IF NOT EXISTS "coachTeamId" INTEGER;
    `);
    
    // For existing coaches, set coachTeamId = teamId
    console.log('Step 2: Copying teamId to coachTeamId for existing coaches...');
    await client.query(`
      UPDATE "Member" 
      SET "coachTeamId" = "teamId"
      WHERE "userRole" = 'coach' AND "teamId" IS NOT NULL;
    `);
    
    console.log('\n✅ Migration completed!\n');
    
    // Verify
    const result = await client.query(`
      SELECT id, name, "userRole", "teamId", "coachTeamId"
      FROM "Member" 
      WHERE "userRole" IN ('admin', 'coach')
      ORDER BY name;
    `);
    
    console.log('Admins and Coaches:');
    result.rows.forEach(row => {
      const teamInfo = row.teamId ? `Team (Athlet): ${row.teamId}` : 'Kein Team (Athlet)';
      const coachInfo = row.coachTeamId ? `Team (Coach): ${row.coachTeamId}` : 'Kein Team (Coach)';
      console.log(`  ${row.name} (${row.userRole}) - ${teamInfo}, ${coachInfo}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addCoachTeamColumn().catch(console.error);
