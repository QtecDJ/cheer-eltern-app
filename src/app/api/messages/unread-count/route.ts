import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAssignedMessageCount, getRepliedMessageCountForMember } from "@/lib/queries";

// Cache unread count for 60 seconds
export const revalidate = 60;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ count: 0 });
  try {
    const count = await getAssignedMessageCount(session.id);
    const replied = await getRepliedMessageCountForMember(session.id);
    
    const response = NextResponse.json({ count, replied });
    // Cache for 60s, stale-while-revalidate for 120s
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ count: 0, replied: 0 });
  }
}
