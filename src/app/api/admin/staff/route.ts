import { NextResponse } from 'next/server';
import { getSession, isAdminOrTrainer } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !isAdminOrTrainer(session.roles ?? session.userRole ?? null)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const rows = await prisma.member.findMany({
      where: {
        OR: [
          { roles: { has: 'admin' } },
          { roles: { has: 'orga' } },
          { userRole: 'admin' },
          { userRole: 'orga' },
        ],
        status: 'active',
      },
      select: { id: true, firstName: true, lastName: true, name: true, roles: true, userRole: true },
      orderBy: { firstName: 'asc' },
    });

    return NextResponse.json({ users: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
