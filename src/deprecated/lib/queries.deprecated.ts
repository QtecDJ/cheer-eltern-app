import { prisma } from "@/lib/db";

export async function getMemberListItem(memberId: number) {
  return await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, firstName: true, lastName: true, photoUrl: true },
  });
}

export async function getEventsListMinimal(limit = 15) {
  return await prisma.event.findMany({
    where: { status: { in: ["upcoming", "completed"] } },
    orderBy: { date: "asc" },
    take: limit,
    select: { id: true, title: true, date: true, time: true, location: true, type: true, status: true, description: true, _count: { select: { participants: true } } },
  });
}
