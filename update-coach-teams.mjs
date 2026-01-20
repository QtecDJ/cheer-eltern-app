import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = "postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateCoachTeams() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Updating coach team assignments...\n');
    
    // Team 1: Kings & Queens - Sandra Pohl, Sabrina Hertfelder (als Coaches)
    await client.query(`UPDATE "Member" SET "coachTeamId" = 1 WHERE name IN ('Sandra Pohl', 'Sabrina Hertfelder');`);
    console.log('✓ Team 1 (Kings & Queens): Sandra Pohl, Sabrina Hertfelder');
    
    // Team 2: Princesses - Julia Rebmann, Chantal Pohl
    await client.query(`UPDATE "Member" SET "coachTeamId" = 2 WHERE name IN ('Julia Rebmann', 'Chantal Pohl');`);
    console.log('✓ Team 2 (Princesses): Julia Rebmann, Chantal Pohl');
    
    // Team 3: Sparkles - Cedric Kaiser, Adriana Wenzel
    await client.query(`UPDATE "Member" SET "coachTeamId" = 3 WHERE name IN ('Cedric Kaiser', 'Adriana Wenzel');`);
    console.log('✓ Team 3 (Sparkles): Cedric Kaiser, Adriana Wenzel');
    
    // Team 4: Divas - Sabrina Seefried, Saskia Samland, kai Püttmann
    await client.query(`UPDATE "Member" SET "coachTeamId" = 4 WHERE name IN ('Sabrina Seefried', 'Saskia Samland', 'kai Püttmann');`);
    console.log('✓ Team 4 (Divas): Sabrina Seefried, Saskia Samland, kai Püttmann');
    
    console.log('\n✅ Coach assignments updated!\n');
    
    // Verify
    const result = await client.query(`
      SELECT m.name, m."userRole", m."teamId", t1.name as athlete_team, m."coachTeamId", t2.name as coach_team
      FROM "Member" m
      LEFT JOIN "Team" t1 ON m."teamId" = t1.id
      LEFT JOIN "Team" t2 ON m."coachTeamId" = t2.id
      WHERE m."userRole" IN ('admin', 'coach')
      ORDER BY m."coachTeamId", m.name;
    `);
    
    console.log('📊 Final assignments:');
    let currentTeam = null;
    result.rows.forEach(row => {
      if (row.coachTeamId !== currentTeam) {
        currentTeam = row.coachTeamId;
        console.log(`\n${row.coach_team || 'Kein Team'} (Team ${row.coachTeamId || 'N/A'}):`);
      }
      const athleteInfo = row.athlete_team ? ` - Athlet in: ${row.athlete_team}` : '';
      console.log(`  ${row.name} (${row.userRole})${athleteInfo}`);
    });
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateCoachTeams().catch(console.error);
