import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkDatabase() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // List all tables
    console.log('=== All Tables ===');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check for RSVP-related tables (case-insensitive)
    console.log('\n=== Looking for RSVP tables ===');
    const rsvpTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND LOWER(table_name) LIKE '%rsvp%'
      ORDER BY table_name;
    `);
    
    if (rsvpTablesResult.rows.length > 0) {
      console.log('RSVP-related tables:');
      rsvpTablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
      
      // Check each RSVP table
      for (const row of rsvpTablesResult.rows) {
        const tableName = row.table_name;
        console.log(`\n=== Checking table: ${tableName} ===`);
        
        // Get count
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        console.log(`Total records: ${countResult.rows[0].count}`);
        
        if (parseInt(countResult.rows[0].count) > 0) {
          // Show first 5 records
          const dataResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 5`);
          console.log('First 5 records:');
          console.log(dataResult.rows);
        }
      }
    } else {
      console.log('No RSVP-related tables found');
    }

    // Try common RSVP table names directly
    console.log('\n=== Trying common RSVP table names ===');
    const possibleNames = [
      'AnnouncementRSVP',
      'announcementRSVP', 
      'announcement_rsvp',
      'Announcement_RSVP',
      'announcements_rsvp',
      'RSVP',
      'rsvp'
    ];
    
    for (const tableName of possibleNames) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        console.log(`✓ Table "${tableName}" exists! Record count: ${result.rows[0].count}`);
        
        if (parseInt(result.rows[0].count) > 0) {
          const dataResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 3`);
          console.log(`  First 3 records:`, dataResult.rows);
        }
      } catch (err) {
        // Table doesn't exist, skip silently
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkDatabase();
