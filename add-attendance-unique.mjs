import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable. Aborting.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function dedupeAndAddConstraint() {
  const client = await pool.connect();
  try {
    console.log('🔎 Removing duplicate Attendance rows (keeping newest per training/member/type)...');

    // Delete duplicates keeping the newest (by createdAt)
    await client.query(`
      WITH duplicates AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "trainingId", "memberId", "type" ORDER BY "createdAt" DESC, id DESC) AS rn
        FROM "Attendance"
        WHERE "trainingId" IS NOT NULL AND "memberId" IS NOT NULL AND "type" IS NOT NULL
      )
      DELETE FROM "Attendance" WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
    `);

    console.log('✅ Duplicates removed. Adding UNIQUE constraint...');

    // Add unique constraint (ignore if already exists)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'attendance_training_member_type_unique'
        ) THEN
          ALTER TABLE "Attendance"
            ADD CONSTRAINT attendance_training_member_type_unique UNIQUE ("trainingId", "memberId", "type");
        END IF;
      END$$;
    `);

    console.log('\n✅ UNIQUE constraint added (or already present). Migration complete.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

dedupeAndAddConstraint().catch(console.error);
