// Test-Skript um Benachrichtigungen zu erstellen
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestNotifications() {
  try {
    console.log('🔍 Suche nach einem Member...');
    
    // Finde ersten Member
    const member = await prisma.member.findFirst();
    
    if (!member) {
      console.log('❌ Kein Member gefunden!');
      return;
    }
    
    console.log(`✅ Member gefunden: ${member.name} (ID: ${member.id})`);
    
    // Erstelle Test-Benachrichtigungen
    const notifications = await prisma.notification.createMany({
      data: [
        {
          memberId: member.id,
          type: 'training',
          title: 'Neues Training morgen',
          message: 'Training findet morgen um 17:00 Uhr auf dem Sportplatz statt.',
          link: '/training',
          isRead: false
        },
        {
          memberId: member.id,
          type: 'announcement',
          title: 'Wichtige Ankündigung',
          message: 'Die Trainingszeiten wurden aktualisiert. Bitte beachte die neuen Zeiten im Kalender.',
          link: '/info',
          isRead: false
        },
        {
          memberId: member.id,
          type: 'info',
          title: 'Profil aktualisiert',
          message: 'Dein Profil wurde erfolgreich aktualisiert.',
          link: '/profil',
          isRead: true // Diese ist bereits gelesen
        }
      ]
    });
    
    console.log(`✅ ${notifications.count} Test-Benachrichtigungen erstellt!`);
    
    // Zeige alle Benachrichtigungen des Members
    const allNotifications = await prisma.notification.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('\n📬 Benachrichtigungen:');
    allNotifications.forEach(n => {
      console.log(`  ${n.isRead ? '✓' : '•'} ${n.title} (${n.type})`);
    });
    
    const unreadCount = allNotifications.filter(n => !n.isRead).length;
    console.log(`\n📊 ${unreadCount} ungelesene Benachrichtigungen`);
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestNotifications();
