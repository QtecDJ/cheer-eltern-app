const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

(async function(){
  const prisma = new PrismaClient();
  try {
    const memberId = 1;
    const trainingIds = [13,14,15];
    const records = await prisma.attendance.findMany({
      where: { memberId, trainingId: { in: trainingIds }, type: 'training' },
      orderBy: { date: 'desc' },
    });
    console.log('Attendance records for member', memberId, 'and trainings', trainingIds);
    console.table(records.map(r => ({ id: r.id, trainingId: r.trainingId, status: r.status, date: r.date, reason: r.reason })));
  } catch(e){
    console.error(e);
  } finally{
    await prisma.$disconnect();
  }
})();
