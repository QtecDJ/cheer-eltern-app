import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function assignMultipleRoles() {
  try {
    console.log('\n=== MEHRFACH-ROLLEN ZUWEISEN ===\n');
    
    // kai Püttmann -> Admin UND Coach bei Divas
    await pool.query(`
      UPDATE "Member"
      SET "userRole" = ARRAY['admin', 'coach']::TEXT[]
      WHERE name = 'kai Püttmann'
    `);
    console.log('✓ kai Püttmann -> Admin + Coach (Team Divas)');
    
    // Optional: Weitere Personen mit mehreren Rollen
    // Beispiel: Adriana als Admin + Coach
    await pool.query(`
      UPDATE "Member"
      SET "userRole" = ARRAY['admin', 'coach']::TEXT[]
      WHERE name = 'Adriana Wenzel'
    `);
    console.log('✓ Adriana Wenzel -> Admin + Coach (Team Sparkles)');
    
    console.log('\n=== ROLLEN-ÜBERSICHT ===\n');
    
    const result = await pool.query(`
      SELECT 
        m.name, 
        m."userRole", 
        m."teamId", 
        t.name as team_name,
        CASE 
          WHEN 'admin' = ANY(m."userRole") THEN '✓ Admin'
          ELSE ''
        END as is_admin,
        CASE 
          WHEN 'coach' = ANY(m."userRole") THEN '✓ Coach'
          ELSE ''
        END as is_coach
      FROM "Member" m
      LEFT JOIN "Team" t ON m."teamId" = t.id
      WHERE 'admin' = ANY(m."userRole") OR 'coach' = ANY(m."userRole")
      ORDER BY 
        CASE WHEN 'admin' = ANY(m."userRole") THEN 0 ELSE 1 END,
        t.name, 
        m.name
    `);
    
    let currentCategory = '';
    result.rows.forEach(row => {
      const roles = [];
      if (row.is_admin) roles.push('Admin');
      if (row.is_coach) roles.push('Coach');
      
      const category = roles.join(' + ');
      if (category !== currentCategory) {
        console.log(`\n--- ${category} ---`);
        currentCategory = category;
      }
      
      const teamInfo = row.team_name ? `Team ${row.team_name}` : 'Kein Team';
      console.log(`${row.name} -> ${teamInfo} (${row.userRole.join(', ')})`);
    });
    
    console.log('\n=== TEAM-ÜBERSICHT ===\n');
    
    const teamOverview = await pool.query(`
      SELECT 
        t.id,
        t.name,
        COALESCE(
          STRING_AGG(
            DISTINCT m.name || 
            CASE 
              WHEN 'admin' = ANY(m."userRole") AND 'coach' = ANY(m."userRole") THEN ' (Admin+Coach)'
              WHEN 'admin' = ANY(m."userRole") THEN ' (Admin)'
              WHEN 'coach' = ANY(m."userRole") THEN ' (Coach)'
              ELSE ''
            END, 
            ', ' 
            ORDER BY m.name
          ),
          '-'
        ) as members
      FROM "Team" t
      LEFT JOIN "Member" m ON t.id = m."teamId" 
        AND ('admin' = ANY(m."userRole") OR 'coach' = ANY(m."userRole"))
      WHERE t.status = 'active'
      GROUP BY t.id, t.name
      ORDER BY t.name
    `);
    
    teamOverview.rows.forEach(row => {
      console.log(`Team ${row.id}: ${row.name}`);
      console.log(`  ${row.members}`);
    });
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

assignMultipleRoles();
