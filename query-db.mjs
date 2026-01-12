import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function queryDatabase() {
  try {
    console.log('\n=== ALLE MITGLIEDER MIT TEAM-ZUWEISUNG ===\n');
    
    const allMembersResult = await pool.query(`
      SELECT m.id, m.name, m."userRole", m."teamId", t.name as team_name, t.color
      FROM "Member" m
      LEFT JOIN "Team" t ON m."teamId" = t.id
      ORDER BY m."userRole" DESC, m.name
    `);
    
    allMembersResult.rows.forEach(row => {
      const teamInfo = row.team_name ? `Team: ${row.team_name} (ID: ${row.teamId}, ${row.color})` : '❌ KEIN TEAM ZUGEWIESEN';
      console.log(`${row.name} (${row.userRole}) -> ${teamInfo}`);
    });
    
    console.log('\n=== NUR COACHES, TRAINER UND ADMINS ===\n');
    
    const trainersResult = await pool.query(`
      SELECT m.id, m.name, m."userRole", m."teamId", t.name as team_name, t.color
      FROM "Member" m
      LEFT JOIN "Team" t ON m."teamId" = t.id
      WHERE m."userRole" IN ('trainer', 'admin', 'coach')
      ORDER BY m."userRole" DESC, m.name
    `);
    
    trainersResult.rows.forEach(row => {
      const teamInfo = row.team_name ? `Team: ${row.team_name} (ID: ${row.teamId}, ${row.color})` : '❌ KEIN TEAM ZUGEWIESEN';
      console.log(`${row.name} (${row.userRole}) -> ${teamInfo}`);
    });
    
    console.log('\n=== TEAM-ÜBERSICHT MIT ZUGEWIESENEN COACHES ===\n');
    
    const teamCoachesResult = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.color,
        COALESCE(
          STRING_AGG(m.name, ', ') FILTER (WHERE m."userRole" = 'coach'),
          'Kein Coach zugewiesen'
        ) as coaches
      FROM "Team" t
      LEFT JOIN "Member" m ON t.id = m."teamId" AND m."userRole" = 'coach'
      WHERE t.status = 'active'
      GROUP BY t.id, t.name, t.color
      ORDER BY t.name
    `);
    
    teamCoachesResult.rows.forEach(row => {
      console.log(`Team ${row.id}: ${row.name} (${row.color}) -> Coaches: ${row.coaches}`);
    });
    
    console.log('\n=== ALLE TEAMS ===\n');
    
    const teamsResult = await pool.query(`
      SELECT id, name, color, status
      FROM "Team"
      WHERE status = 'active'
      ORDER BY name
    `);
    
    teamsResult.rows.forEach(row => {
      console.log(`ID: ${row.id} - ${row.name} (${row.color})`);
    });
    
    console.log('\n=== AKTIVE TRAININGS ===\n');
    
    const trainingsResult = await pool.query(`
      SELECT ts.id, ts.title, ts.date, ts."teamId", t.name as team_name
      FROM "TrainingSession" ts
      LEFT JOIN "Team" t ON ts."teamId" = t.id
      WHERE ts.status != 'cancelled' AND ts."isArchived" = false
      ORDER BY ts.date ASC
      LIMIT 10
    `);
    
    trainingsResult.rows.forEach(row => {
      const dateStr = new Date(row.date).toLocaleDateString('de-DE');
      const teamInfo = row.team_name ? `Team: ${row.team_name} (ID: ${row.teamId})` : '❌ KEIN TEAM';
      console.log(`${row.title} (${dateStr}) -> ${teamInfo}`);
    });
    
  } catch (error) {
    console.error('Fehler bei Datenbankabfrage:', error.message);
  } finally {
    await pool.end();
  }
}

queryDatabase();
