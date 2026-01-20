const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

(async function(){
  const prisma = new PrismaClient();
  try {
    const memberId = 1;
    const trainingIds = [14,15];
    console.log('Updating attendance for member', memberId, 'and trainings', trainingIds);
    const result = await prisma.attendance.updateMany({
      where: { memberId, trainingId: { in: trainingIds }, type: 'training' },
      data: {
        status: 'pending',
        notes: null,
        reason: null,
        updatedAt: new Date(),
      }
    });
    console.log('Updated rows:', result.count);
  } catch(e){
    console.error(e);
  } finally{
    await prisma.$disconnect();
  }
})();
