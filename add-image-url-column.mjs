import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function addImageUrlColumn() {
  try {
    console.log('Adding imageUrl column to Announcement table...');
    
    await pool.query(`
      ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
    `);
    
    console.log('✅ Successfully added imageUrl column!');
    
    // Verify
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Announcement'
      AND column_name = 'imageUrl';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Column verified:', result.rows[0]);
    } else {
      console.log('⚠️  Column not found in verification');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

addImageUrlColumn();
