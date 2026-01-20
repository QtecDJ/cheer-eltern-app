import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = "postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateToArray() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting migration to String[] for userRole...\n');
    
    // Step 1: Add temporary column
    console.log('Step 1: Adding temporary column...');
    await client.query(`
      ALTER TABLE "Member" 
      ADD COLUMN IF NOT EXISTS "userRole_temp" TEXT[];
    `);
    
    // Step 2: Convert existing data
    console.log('Step 2: Converting data from String to String[]...');
    await client.query(`
      UPDATE "Member" 
      SET "userRole_temp" = 
        CASE 
          WHEN "userRole" IS NULL THEN ARRAY['member']::TEXT[]
          WHEN "userRole" = '' THEN ARRAY['member']::TEXT[]
          ELSE ARRAY["userRole"]::TEXT[]
        END;
    `);
    
    // Step 3: Drop old column
    console.log('Step 3: Dropping old column...');
    await client.query(`ALTER TABLE "Member" DROP COLUMN "userRole";`);
    
    // Step 4: Rename new column
    console.log('Step 4: Renaming new column...');
    await client.query(`
      ALTER TABLE "Member" 
      RENAME COLUMN "userRole_temp" TO "userRole";
    `);
    
    // Step 5: Set NOT NULL constraint
    console.log('Step 5: Setting NOT NULL constraint...');
    await client.query(`
      ALTER TABLE "Member" 
      ALTER COLUMN "userRole" SET NOT NULL;
    `);
    
    // Step 6: Set default value
    console.log('Step 6: Setting default value...');
    await client.query(`
      ALTER TABLE "Member" 
      ALTER COLUMN "userRole" SET DEFAULT ARRAY['member']::TEXT[];
    `);
    
    console.log('\n✅ Migration completed successfully!\n');
    
    // Verify the data
    console.log('📊 Verifying data:\n');
    const result = await client.query(`
      SELECT id, name, "userRole" 
      FROM "Member" 
      WHERE "userRole" && ARRAY['admin', 'coach']::TEXT[]
      ORDER BY name;
    `);
    
    console.log('Users with admin or coach roles:');
    result.rows.forEach(row => {
      console.log(`  ${row.name}: [${row.userRole.join(', ')}]`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateToArray().catch(console.error);
