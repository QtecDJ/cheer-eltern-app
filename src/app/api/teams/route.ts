import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Teams change rarely, cache for 10 minutes
export const revalidate = 600;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        color: true,
        description: true,
      },
    });

    const response = NextResponse.json({ teams });
    // Teams rarely change, cache aggressively
    response.headers.set('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
    return response;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
