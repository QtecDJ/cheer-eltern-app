import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Test-API zum Erstellen von Test-Benachrichtigungen
 * GET /api/test/create-notifications
 */
export async function GET() {
  try {
    console.log('🔍 Suche nach einem Member...');
    
    // Finde ersten Member
    const member = await prisma.member.findFirst();
    
    if (!member) {
      return NextResponse.json(
        { error: 'Kein Member gefunden!' },
        { status: 404 }
      );
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
          isRead: true
        }
      ]
    });
    
    // Zeige alle Benachrichtigungen des Members
    const allNotifications = await prisma.notification.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    const unreadCount = allNotifications.filter(n => !n.isRead).length;
    
    return NextResponse.json({
      success: true,
      message: `${notifications.count} Test-Benachrichtigungen erstellt!`,
      member: { id: member.id, name: member.name },
      notifications: allNotifications,
      unreadCount
    });
    
  } catch (error) {
    console.error('❌ Fehler:', error);
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen der Test-Benachrichtigungen',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
