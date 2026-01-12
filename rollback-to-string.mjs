import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function rollbackToString() {
  try {
    console.log('\n=== ROLLBACK: userRole zurück zu String ===\n');
    
    // Schritt 1: Temporäre Spalte erstellen
    console.log('Schritt 1: Erstelle temporäre String-Spalte...');
    await pool.query(`ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "userRole_string" TEXT`);
    
    // Schritt 2: Array zu String konvertieren (nimm erstes Element)
    console.log('Schritt 2: Konvertiere Array zu String...');
    await pool.query(`
      UPDATE "Member" 
      SET "userRole_string" = "userRole"[1]
      WHERE "userRole_string" IS NULL
    `);
    
    // Schritt 3: Alte Array-Spalte löschen
    console.log('Schritt 3: Lösche Array-Spalte...');
    await pool.query(`ALTER TABLE "Member" DROP COLUMN "userRole"`);
    
    // Schritt 4: String-Spalte umbenennen
    console.log('Schritt 4: Benenne String-Spalte um...');
    await pool.query(`ALTER TABLE "Member" RENAME COLUMN "userRole_string" TO "userRole"`);
    
    // Schritt 5: Default setzen
    console.log('Schritt 5: Setze Default...');
    await pool.query(`ALTER TABLE "Member" ALTER COLUMN "userRole" SET DEFAULT 'member'`);
    
    console.log('\n✅ Rollback erfolgreich!\n');
    
    // Überprüfung
    const result = await pool.query(`
      SELECT name, "userRole", "teamId"
      FROM "Member"
      WHERE "userRole" IN ('admin', 'coach')
      ORDER BY "userRole" DESC, name
      LIMIT 15
    `);
    
    console.log('=== WIEDERHERGESTELLTE ROLLEN ===\n');
    result.rows.forEach(row => {
      console.log(`${row.name} -> ${row.userRole} (Team: ${row.teamId})`);
    });
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

rollbackToString();
