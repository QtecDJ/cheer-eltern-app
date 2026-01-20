import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = "postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function rollbackToString() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Rolling back from String[] to String...\n');
    
    // Step 1: Add temporary column
    console.log('Step 1: Adding temporary column...');
    await client.query(`
      ALTER TABLE "Member" 
      ADD COLUMN IF NOT EXISTS "userRole_temp" TEXT;
    `);
    
    // Step 2: Convert array to string (take first element)
    console.log('Step 2: Converting from array to string...');
    await client.query(`
      UPDATE "Member" 
      SET "userRole_temp" = 
        CASE 
          WHEN "userRole" IS NULL OR array_length("userRole", 1) IS NULL THEN 'member'
          ELSE "userRole"[1]
        END;
    `);
    
    // Step 3: Drop old column
    console.log('Step 3: Dropping old column...');
    await client.query(`ALTER TABLE "Member" DROP COLUMN "userRole";`);
    
    // Step 4: Rename new column
    console.log('Step 4: Renaming column...');
    await client.query(`
      ALTER TABLE "Member" 
      RENAME COLUMN "userRole_temp" TO "userRole";
    `);
    
    // Step 5: Set default
    console.log('Step 5: Setting default...');
    await client.query(`
      ALTER TABLE "Member" 
      ALTER COLUMN "userRole" SET DEFAULT 'member';
    `);
    
    console.log('\n✅ Rollback completed!\n');
    
    // Verify
    const result = await client.query(`
      SELECT id, name, "userRole" 
      FROM "Member" 
      WHERE "userRole" IN ('admin', 'coach')
      ORDER BY name;
    `);
    
    console.log('Users with admin or coach roles:');
    result.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.userRole}`);
    });
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

rollbackToString().catch(console.error);
