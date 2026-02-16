import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkChildTables() {
  try {
    await client.connect();
    console.log('=== Child Table Structure ===\n');
    
    // Get Child table structure
    const childColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Child'
      ORDER BY ordinal_position;
    `);
    
    console.log('Child table columns:');
    childColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Get some sample data
    const childData = await client.query('SELECT * FROM "Child" LIMIT 3');
    console.log(`\nSample data (${childData.rows.length} records):`);
    console.log(childData.rows);
    
    console.log('\n=== ParentChildRelation Table Structure ===\n');
    
    // Get ParentChildRelation table structure
    const relationColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'ParentChildRelation'
      ORDER BY ordinal_position;
    `);
    
    console.log('ParentChildRelation table columns:');
    relationColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Get some sample data
    const relationData = await client.query('SELECT * FROM "ParentChildRelation" LIMIT 5');
    console.log(`\nSample data (${relationData.rows.length} records):`);
    console.log(relationData.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkChildTables();
