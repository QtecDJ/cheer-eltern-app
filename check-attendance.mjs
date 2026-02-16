import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZvmfB4Dur2KO@ep-calm-star-ag0w1zic-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function checkAttendance() {
  try {
    console.log('🔍 Checking attendance records...\n');
    
    // Get a member (first one with attendance)
    const memberResult = await pool.query(`
      SELECT DISTINCT m.id, m."firstName", m."lastName"
      FROM "Member" m
      INNER JOIN "Attendance" a ON a."memberId" = m.id
      WHERE a.type = 'training'
      LIMIT 1
    `);
    
    if (memberResult.rows.length === 0) {
      console.log('❌ No members with attendance found');
      await pool.end();
      return;
    }
    
    const member = memberResult.rows[0];
    console.log(`👤 Member: ${member.firstName} ${member.lastName} (ID: ${member.id})\n`);
    
    // Get their attendance records
    const attendanceResult = await pool.query(`
      SELECT 
        a.id,
        a."trainingId",
        a.status,
        a."updatedAt",
        a.notes,
        t.title as training_title,
        t.date as training_date
      FROM "Attendance" a
      LEFT JOIN "TrainingSession" t ON t.id = a."trainingId"
      WHERE a."memberId" = $1 AND a.type = 'training'
      ORDER BY a."updatedAt" DESC
      LIMIT 10
    `, [member.id]);
    
    if (attendanceResult.rows.length === 0) {
      console.log('❌ No attendance records found for this member\n');
      await pool.end();
      return;
    }
    
    console.log(`📊 Found ${attendanceResult.rows.length} attendance records:\n`);
    
    attendanceResult.rows.forEach((att, index) => {
      console.log(`${index + 1}. Training: ${att.training_title || 'Unknown'}`);
      console.log(`   Training ID: ${att.trainingId}`);
      console.log(`   Status: "${att.status}"`);
      console.log(`   Updated: ${new Date(att.updatedAt).toLocaleString()}`);
      console.log(`   Notes: ${att.notes || 'None'}`);
      console.log('');
    });
    
    // Build the map like the query does
    const map = {};
    for (const att of attendanceResult.rows) {
      if (att.trainingId && map[att.trainingId] === undefined) {
        map[att.trainingId] = att.status;
      }
    }
    
    console.log('🗺️  Attendance Map (like API returns):');
    console.log(JSON.stringify(map, null, 2));
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAttendance();
