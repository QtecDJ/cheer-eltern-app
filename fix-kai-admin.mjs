import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function fixKaiRole() {
  try {
    console.log('\n=== KAI AUF ADMIN ZURÜCKSETZEN ===\n');
    
    // kai Püttmann -> Admin bei Divas (Team 4)
    // Admins haben Zugriff auf alle Teams, teamId zeigt an, welches Team sie bevorzugt betreuen
    await pool.query(`
      UPDATE "Member"
      SET "userRole" = 'admin'
      WHERE name = 'kai Püttmann'
    `);
    console.log('✓ kai Püttmann -> Admin (behält Team Divas für Coaching)');
    
    console.log('\n=== AKTUELLE ROLLEN-ÜBERSICHT ===\n');
    
    const rolesResult = await pool.query(`
      SELECT m.name, m."userRole", m."teamId", t.name as team_name
      FROM "Member" m
      LEFT JOIN "Team" t ON m."teamId" = t.id
      WHERE m."userRole" IN ('admin', 'coach')
      ORDER BY m."userRole" DESC, t.name, m.name
    `);
    
    console.log('--- ADMINS ---');
    rolesResult.rows.filter(r => r.userRole === 'admin').forEach(row => {
      console.log(`${row.name} (admin) -> Team: ${row.team_name || 'KEIN TEAM'} (ID: ${row.teamId})`);
    });
    
    console.log('\n--- COACHES ---');
    rolesResult.rows.filter(r => r.userRole === 'coach').forEach(row => {
      console.log(`${row.name} (coach) -> Team: ${row.team_name || 'KEIN TEAM'} (ID: ${row.teamId})`);
    });
    
    console.log('\n=== TEAM-ÜBERSICHT ===\n');
    
    const teamOverviewResult = await pool.query(`
      SELECT 
        t.id,
        t.name,
        COALESCE(
          STRING_AGG(m.name, ', ' ORDER BY m.name) FILTER (WHERE m."userRole" = 'admin'),
          '-'
        ) as admins,
        COALESCE(
          STRING_AGG(m.name, ', ' ORDER BY m.name) FILTER (WHERE m."userRole" = 'coach'),
          '-'
        ) as coaches
      FROM "Team" t
      LEFT JOIN "Member" m ON t.id = m."teamId" AND m."userRole" IN ('admin', 'coach')
      WHERE t.status = 'active'
      GROUP BY t.id, t.name
      ORDER BY t.name
    `);
    
    teamOverviewResult.rows.forEach(row => {
      console.log(`Team ${row.id}: ${row.name}`);
      console.log(`  Admins:  ${row.admins}`);
      console.log(`  Coaches: ${row.coaches}`);
    });
    
  } catch (error) {
    console.error('Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

fixKaiRole();
