import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function updateCoachRoles() {
  try {
    console.log('\n=== COACH-ROLLEN AKTUALISIEREN ===\n');
    
    // Chantal Pohl -> Coach bei Princesses (Team 2)
    await pool.query(`
      UPDATE "Member"
      SET "userRole" = 'coach', "teamId" = 2
      WHERE name = 'Chantal Pohl'
    `);
    console.log('✓ Chantal Pohl -> Coach bei Princesses (Team 2)');
    
    // kai Püttmann -> Coach bei Divas (Team 4)
    await pool.query(`
      UPDATE "Member"
      SET "userRole" = 'coach', "teamId" = 4
      WHERE name = 'kai Püttmann'
    `);
    console.log('✓ kai Püttmann -> Coach bei Divas (Team 4)');
    
    console.log('\n=== AKTUALISIERTE COACH-ÜBERSICHT ===\n');
    
    const coachesResult = await pool.query(`
      SELECT m.name, m."userRole", m."teamId", t.name as team_name
      FROM "Member" m
      LEFT JOIN "Team" t ON m."teamId" = t.id
      WHERE m."userRole" = 'coach'
      ORDER BY t.name, m.name
    `);
    
    coachesResult.rows.forEach(row => {
      console.log(`${row.name} (${row.userRole}) -> Team: ${row.team_name || 'KEIN TEAM'} (ID: ${row.teamId})`);
    });
    
    console.log('\n=== TEAM-ÜBERSICHT MIT ALLEN COACHES ===\n');
    
    const teamCoachesResult = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.color,
        COALESCE(
          STRING_AGG(m.name, ', ' ORDER BY m.name) FILTER (WHERE m."userRole" = 'coach'),
          'Kein Coach zugewiesen'
        ) as coaches
      FROM "Team" t
      LEFT JOIN "Member" m ON t.id = m."teamId" AND m."userRole" = 'coach'
      WHERE t.status = 'active'
      GROUP BY t.id, t.name, t.color
      ORDER BY t.name
    `);
    
    teamCoachesResult.rows.forEach(row => {
      console.log(`Team ${row.id}: ${row.name} -> ${row.coaches}`);
    });
    
  } catch (error) {
    console.error('Fehler bei Coach-Aktualisierung:', error.message);
  } finally {
    await pool.end();
  }
}

updateCoachRoles();
