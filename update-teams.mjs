import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function updateTeamAssignments() {
  try {
    console.log('\n=== TEAM-ZUWEISUNGEN AKTUALISIEREN ===\n');
    
    // Team IDs:
    // 1 = Kings & Queens
    // 2 = Princesses
    // 3 = Sparkles
    // 4 = Divas
    
    // Cedric Kaiser -> Sparkles (Team 3)
    await pool.query(`
      UPDATE "Member"
      SET "teamId" = 3
      WHERE name = 'Cedric Kaiser'
    `);
    console.log('✓ Cedric Kaiser -> Sparkles (Team 3)');
    
    // Adriana Wenzel -> Sparkles (Team 3)
    await pool.query(`
      UPDATE "Member"
      SET "teamId" = 3
      WHERE name = 'Adriana Wenzel'
    `);
    console.log('✓ Adriana Wenzel -> Sparkles (Team 3)');
    
    // Chantal Pohl -> Princesses (Team 2)
    await pool.query(`
      UPDATE "Member"
      SET "teamId" = 2
      WHERE name = 'Chantal Pohl'
    `);
    console.log('✓ Chantal Pohl -> Princesses (Team 2)');
    
    // Julia Rebmann -> Princesses (Team 2)
    await pool.query(`
      UPDATE "Member"
      SET "teamId" = 2
      WHERE name = 'Julia Rebmann'
    `);
    console.log('✓ Julia Rebmann -> Princesses (Team 2)');
    
    // Sabrina Seefried -> Divas (Team 4)
    await pool.query(`
      UPDATE "Member"
      SET "teamId" = 4
      WHERE name = 'Sabrina Seefried'
    `);
    console.log('✓ Sabrina Seefried -> Divas (Team 4)');
    
    // Saskia Samland -> Divas (Team 4)
    await pool.query(`
      UPDATE "Member"
      SET "teamId" = 4
      WHERE name = 'Saskia Samland'
    `);
    console.log('✓ Saskia Samland -> Divas (Team 4)');
    
    // Sandra Pohl bleibt bei Kings & Queens (Team 1) - keine Änderung nötig
    console.log('✓ Sandra Pohl -> Kings & Queens (Team 1) (bereits zugewiesen)');
    
    console.log('\n=== AKTUALISIERTE TEAM-ÜBERSICHT ===\n');
    
    const teamCoachesResult = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.color,
        COALESCE(
          STRING_AGG(m.name, ', ') FILTER (WHERE m."userRole" IN ('coach', 'admin')),
          'Kein Coach zugewiesen'
        ) as coaches
      FROM "Team" t
      LEFT JOIN "Member" m ON t.id = m."teamId" AND m."userRole" IN ('coach', 'admin')
      WHERE t.status = 'active'
      GROUP BY t.id, t.name, t.color
      ORDER BY t.name
    `);
    
    teamCoachesResult.rows.forEach(row => {
      console.log(`Team ${row.id}: ${row.name} -> ${row.coaches}`);
    });
    
  } catch (error) {
    console.error('Fehler bei Team-Zuweisung:', error.message);
  } finally {
    await pool.end();
  }
}

updateTeamAssignments();
