import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function migrateUserRoleToArray() {
  try {
    console.log('\n=== MIGRATION: userRole von String zu Array ===\n');
    
    // Schritt 1: Temporäre Spalte erstellen
    console.log('Schritt 1: Erstelle temporäre Spalte...');
    await pool.query(`ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "userRole_new" TEXT[]`);
    
    // Schritt 2: Daten migrieren
    console.log('Schritt 2: Migriere existierende Daten...');
    await pool.query(`
      UPDATE "Member" 
      SET "userRole_new" = CASE 
        WHEN "userRole" IS NULL THEN ARRAY['member']::TEXT[]
        ELSE ARRAY["userRole"]::TEXT[]
      END
      WHERE "userRole_new" IS NULL
    `);
    
    // Schritt 3: Alte Spalte löschen
    console.log('Schritt 3: Lösche alte Spalte...');
    await pool.query(`ALTER TABLE "Member" DROP COLUMN IF EXISTS "userRole"`);
    
    // Schritt 4: Neue Spalte umbenennen
    console.log('Schritt 4: Benenne neue Spalte um...');
    await pool.query(`ALTER TABLE "Member" RENAME COLUMN "userRole_new" TO "userRole"`);
    
    // Schritt 5: Default setzen
    console.log('Schritt 5: Setze Default-Wert...');
    await pool.query(`ALTER TABLE "Member" ALTER COLUMN "userRole" SET DEFAULT ARRAY['member']::TEXT[]`);
    
    // Schritt 6: NOT NULL setzen
    console.log('Schritt 6: Setze NOT NULL Constraint...');
    await pool.query(`ALTER TABLE "Member" ALTER COLUMN "userRole" SET NOT NULL`);
    
    console.log('\n✅ Migration erfolgreich abgeschlossen!\n');
    
    // Überprüfung
    console.log('=== ÜBERPRÜFUNG DER MIGRIERTEN DATEN ===\n');
    const result = await pool.query(`
      SELECT name, "userRole", "teamId"
      FROM "Member"
      WHERE 'admin' = ANY("userRole") OR 'coach' = ANY("userRole")
      ORDER BY name
      LIMIT 10
    `);
    
    result.rows.forEach(row => {
      console.log(`${row.name} -> Rollen: [${row.userRole.join(', ')}] (Team: ${row.teamId})`);
    });
    
  } catch (error) {
    console.error('❌ Fehler bei Migration:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

migrateUserRoleToArray();
